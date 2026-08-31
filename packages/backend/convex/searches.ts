import { internalMutation } from "@repo/backend/convex/_generated/server";
import {
  MAX_SEARCH_LANES,
  stopSearchLanes,
} from "@repo/backend/convex/lib/searchwork";
import { opportunityValidator } from "@repo/backend/convex/model";
import { SEARCH_RESULT_LIMIT } from "@repo/domain/discoveryplan";
import { opportunityFingerprint } from "@repo/domain/opportunity";
import { ConvexError, v } from "convex/values";

/** Appends one unique result within the shared 100-result search budget. */
export const append = internalMutation({
  args: {
    opportunity: opportunityValidator,
    searchId: v.id("searches"),
    userId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const search = await ctx.db.get("searches", args.searchId);
    if (
      !search ||
      search.userId !== args.userId ||
      search.status !== "running"
    ) {
      throw new ConvexError({ code: "SEARCH_SESSION_MISMATCH" });
    }
    const resultCount = search.resultCount ?? 0;
    if (resultCount >= SEARCH_RESULT_LIMIT) {
      return false;
    }

    const fingerprint = opportunityFingerprint(args.opportunity);
    const [sameUrl, sameFingerprint] = await Promise.all([
      ctx.db
        .query("opportunities")
        .withIndex("by_search_and_url", (index) =>
          index
            .eq("searchId", args.searchId)
            .eq("opportunity.directApplyUrl", args.opportunity.directApplyUrl)
        )
        .take(SEARCH_RESULT_LIMIT),
      ctx.db
        .query("opportunities")
        .withIndex("by_search_and_fingerprint", (index) =>
          index.eq("searchId", args.searchId).eq("fingerprint", fingerprint)
        )
        .first(),
    ]);
    const title = args.opportunity.title.toLocaleLowerCase();
    if (
      sameFingerprint ||
      sameUrl.some(
        (record) => record.opportunity.title.toLocaleLowerCase() === title
      )
    ) {
      return false;
    }

    await ctx.db.insert("opportunities", {
      fingerprint,
      opportunity: args.opportunity,
      searchId: args.searchId,
      userId: args.userId,
    });
    await ctx.db.patch("searches", args.searchId, {
      resultCount: resultCount + 1,
    });
    return true;
  },
});

/** Closes an unfinished search after its durable execution deadline. */
export const expire = internalMutation({
  args: {
    searchId: v.id("searches"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const search = await ctx.db.get("searches", args.searchId);
    if (
      !search ||
      search.userId !== args.userId ||
      search.status !== "running"
    ) {
      return null;
    }

    const completedAt = Date.now();
    const lanes = await ctx.db
      .query("searchLanes")
      .withIndex("by_search", (index) => index.eq("searchId", search._id))
      .take(MAX_SEARCH_LANES);
    await stopSearchLanes(
      ctx,
      lanes,
      completedAt,
      "Search lane exceeded its execution deadline.",
      "deadline"
    );
    await ctx.db.patch("searches", search._id, {
      completedAt,
      ...(search.resultCount && search.resultCount > 0
        ? {
            limitation: "deadline" as const,
            outcome: "partial" as const,
            status: "complete" as const,
          }
        : {
            error: "No source-backed opportunities were found in time.",
            limitation: "deadline" as const,
            status: "failed" as const,
          }),
    });
    return null;
  },
});

import { mutation, query } from "@repo/backend/convex/_generated/server";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import { applicationStatusValidator } from "@repo/backend/convex/model";
import schema from "@repo/backend/convex/schema";
import { validateApplicationTransition } from "@repo/domain/application";
import { ConvexError, v } from "convex/values";
import { Effect } from "effect";

export const save = mutation({
  args: {
    notes: v.optional(v.string()),
    opportunityId: v.id("opportunities"),
  },
  returns: v.id("applications"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const opportunity = await ctx.db.get("opportunities", args.opportunityId);
    if (!opportunity || opportunity.userId !== userId) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }

    const existing = await ctx.db
      .query("applications")
      .withIndex("by_user_opportunity", (index) =>
        index.eq("userId", userId).eq("opportunityId", args.opportunityId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch("applications", existing._id, {
        notes: args.notes?.slice(0, 2000) ?? existing.notes,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return ctx.db.insert("applications", {
      notes: args.notes?.slice(0, 2000) ?? "",
      opportunityId: args.opportunityId,
      status: "saved",
      updatedAt: Date.now(),
      userId,
    });
  },
});

/** Saves a bounded selection of owned opportunities in one atomic mutation. */
export const saveMany = mutation({
  args: {
    opportunityIds: v.array(v.id("opportunities")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const opportunityIds = [...new Set(args.opportunityIds)].slice(0, 50);
    const opportunities = await Promise.all(
      opportunityIds.map((opportunityId) => ctx.db.get(opportunityId))
    );
    if (
      opportunities.some(
        (opportunity) => !opportunity || opportunity.userId !== userId
      )
    ) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }

    const existing = await Promise.all(
      opportunityIds.map((opportunityId) =>
        ctx.db
          .query("applications")
          .withIndex("by_user_opportunity", (index) =>
            index.eq("userId", userId).eq("opportunityId", opportunityId)
          )
          .unique()
      )
    );
    const unsaved = opportunityIds.filter((_, index) => !existing[index]);
    const updatedAt = Date.now();
    await Promise.all(
      unsaved.map((opportunityId) =>
        ctx.db.insert("applications", {
          notes: "",
          opportunityId,
          status: "saved",
          updatedAt,
          userId,
        })
      )
    );

    return unsaved.length;
  },
});

export const transition = mutation({
  args: {
    applicationId: v.id("applications"),
    notes: v.optional(v.string()),
    requestedAt: v.number(),
    status: applicationStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const application = await ctx.db.get("applications", args.applicationId);
    if (!application || application.userId !== userId) {
      throw new ConvexError({ code: "NOT_FOUND" });
    }

    const validation = await Effect.runPromise(
      validateApplicationTransition(application.status, args.status).pipe(
        Effect.match({
          onFailure: () => ({ success: false }) as const,
          onSuccess: (status) => ({ status, success: true }) as const,
        })
      )
    );
    if (!validation.success) {
      throw new ConvexError({ code: "INVALID_APPLICATION_TRANSITION" });
    }

    await ctx.db.patch("applications", application._id, {
      appliedAt:
        validation.status === "applied" ? Date.now() : application.appliedAt,
      notes: args.notes?.slice(0, 2000) ?? application.notes,
      status: validation.status,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      application: schema.doc("applications"),
      opportunity: schema.doc("opportunities"),
    })
  ),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_user_updatedAt", (index) => index.eq("userId", userId))
      .order("desc")
      .take(50);
    const records = await Promise.all(
      applications.map(async (application) => ({
        application,
        opportunity: await ctx.db.get(
          "opportunities",
          application.opportunityId
        ),
      }))
    );

    return records.flatMap((record) =>
      record.opportunity
        ? [{ application: record.application, opportunity: record.opportunity }]
        : []
    );
  },
});

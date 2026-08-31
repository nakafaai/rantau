import { internalMutation } from "@repo/backend/convex/_generated/server";
import { v } from "convex/values";

/** Removes inbox fields replaced by the shared Rantau sender. */
export const clearAgentMailProfileFields = internalMutation({
  args: { cursor: v.optional(v.string()) },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    updated: v.number(),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db.query("profiles").paginate({
      cursor: args.cursor ?? null,
      numItems: 100,
    });
    const legacyProfiles = page.page.filter(
      (profile) =>
        profile.agentMailEmail ||
        profile.agentMailInboxId ||
        profile.agentMailProvisioningAt
    );
    await Promise.all(
      legacyProfiles.map((profile) =>
        ctx.db.patch("profiles", profile._id, {
          agentMailEmail: undefined,
          agentMailInboxId: undefined,
          agentMailProvisioningAt: undefined,
        })
      )
    );
    return {
      continueCursor: page.continueCursor,
      isDone: page.isDone,
      updated: legacyProfiles.length,
    };
  },
});

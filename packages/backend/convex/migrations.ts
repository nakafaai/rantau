import { internalMutation } from "@repo/backend/convex/_generated/server";
import { v } from "convex/values";

const OPPORTUNITY_MIGRATION_LIMIT = 1000;

/** Removes the retired opportunity fingerprint field before schema tightening. */
export const removeOpportunityFingerprints = internalMutation({
  args: {},
  returns: v.object({ removed: v.number(), scanned: v.number() }),
  handler: async (ctx) => {
    const opportunities = await ctx.db
      .query("opportunities")
      .take(OPPORTUNITY_MIGRATION_LIMIT);
    const legacy = opportunities.filter(
      (opportunity) => opportunity.fingerprint !== undefined
    );
    await Promise.all(
      legacy.map((opportunity) =>
        ctx.db.patch(opportunity._id, { fingerprint: undefined })
      )
    );
    return { removed: legacy.length, scanned: opportunities.length };
  },
});

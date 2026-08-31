import { AgentMail } from "@agentmail/convex";
import { DAY, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "@repo/backend/convex/_generated/api";
import { env, mutation } from "@repo/backend/convex/_generated/server";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import { ConvexError, v } from "convex/values";

const agentmail = new AgentMail(components.agentmail);
const rateLimiter = new RateLimiter(components.rateLimiter, {
  applicationDigest: {
    capacity: 3,
    kind: "fixed window",
    period: DAY,
    rate: 3,
  },
});

/** Renders a compact application digest for the candidate. */
function digestText(
  items: ReadonlyArray<{
    company: string;
    status: string;
    title: string;
    url: string;
  }>
) {
  if (items.length === 0) {
    return "You have no saved applications yet. Search Rantau and save an opportunity first.";
  }

  return [
    "Your Rantau application digest",
    "",
    ...items.flatMap((item, index) => [
      `${index + 1}. ${item.title} at ${item.company}`,
      `Status: ${item.status}`,
      `Apply: ${item.url}`,
      "",
    ]),
  ].join("\n");
}

export const sendDigest = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    await rateLimiter.limit(ctx, "applicationDigest", {
      key: userId,
      throws: true,
    });
    const user = await ctx.db.get("users", userId);
    if (!user?.email) {
      throw new ConvexError({ code: "EMAIL_REQUIRED" });
    }

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_user_updatedAt", (index) => index.eq("userId", userId))
      .order("desc")
      .take(10);
    const items = await Promise.all(
      applications.map(async (application) => {
        const opportunity = await ctx.db.get(
          "opportunities",
          application.opportunityId
        );
        return opportunity
          ? {
              company: opportunity.opportunity.company,
              status: application.status,
              title: opportunity.opportunity.title,
              url: opportunity.opportunity.directApplyUrl,
            }
          : null;
      })
    );
    const outboundId = await agentmail.sendMessage(
      ctx,
      env.AGENTMAIL_INBOX_ID,
      {
        labels: ["rantau", "application-digest"],
        subject: "Your Rantau application digest",
        text: digestText(items.filter((item) => item !== null)),
        to: user.email,
      }
    );
    return outboundId;
  },
});

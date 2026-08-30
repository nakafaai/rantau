import { AgentMail } from "@agentmail/convex";
import { DAY, RateLimiter } from "@convex-dev/rate-limiter";
import { components, internal } from "@repo/backend/convex/_generated/api";
import {
  action,
  internalMutation,
  mutation,
  query,
} from "@repo/backend/convex/_generated/server";
import { requireUserId } from "@repo/backend/convex/lib/guard";
import { decodeInbox } from "@repo/domain/mail";
import { ConvexError, v } from "convex/values";
import { Effect } from "effect";

const PROVISION_TIMEOUT = 5 * 60 * 1000;

type MailReservation =
  | { email: string; inboxId: string; status: "existing" }
  | { status: "reserved" }
  | { status: "busy" };

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

export const reserve = internalMutation({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({
      email: v.string(),
      inboxId: v.string(),
      status: v.literal("existing"),
    }),
    v.object({ status: v.literal("reserved") }),
    v.object({ status: v.literal("busy") })
  ),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (index) => index.eq("userId", args.userId))
      .unique();
    if (!profile) {
      throw new ConvexError({ code: "PROFILE_REQUIRED" });
    }
    if (profile.agentMailEmail && profile.agentMailInboxId) {
      return {
        email: profile.agentMailEmail,
        inboxId: profile.agentMailInboxId,
        status: "existing" as const,
      };
    }
    if (
      profile.agentMailProvisioningAt &&
      Date.now() - profile.agentMailProvisioningAt < PROVISION_TIMEOUT
    ) {
      return { status: "busy" as const };
    }

    await ctx.db.patch("profiles", profile._id, {
      agentMailProvisioningAt: Date.now(),
    });
    return { status: "reserved" as const };
  },
});

export const finish = internalMutation({
  args: {
    email: v.string(),
    inboxId: v.string(),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (index) => index.eq("userId", args.userId))
      .unique();
    if (!profile) {
      throw new ConvexError({ code: "PROFILE_REQUIRED" });
    }

    await ctx.db.patch("profiles", profile._id, {
      agentMailEmail: args.email,
      agentMailInboxId: args.inboxId,
      agentMailProvisioningAt: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const clear = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (index) => index.eq("userId", args.userId))
      .unique();
    if (profile) {
      await ctx.db.patch("profiles", profile._id, {
        agentMailProvisioningAt: undefined,
      });
    }
    return null;
  },
});

export const provision = action({
  args: {},
  returns: v.object({ email: v.string(), inboxId: v.string() }),
  handler: async (ctx): Promise<{ email: string; inboxId: string }> => {
    const userId = await requireUserId(ctx);
    const reservation: MailReservation = await ctx.runMutation(
      internal.mail.reserve,
      { userId }
    );
    if (reservation.status === "existing") {
      return { email: reservation.email, inboxId: reservation.inboxId };
    }
    if (reservation.status === "busy") {
      throw new ConvexError({ code: "INBOX_PROVISIONING" });
    }

    const outcome = await Effect.runPromise(
      Effect.tryPromise(() =>
        agentmail.createInbox(ctx, {
          clientId: `rantau:${userId}`,
          displayName: "Rantau applications",
        })
      ).pipe(
        Effect.flatMap(decodeInbox),
        Effect.match({
          onFailure: (error) => ({ error, success: false }) as const,
          onSuccess: (record) => ({ record, success: true }) as const,
        })
      )
    );
    if (!outcome.success) {
      await ctx.runMutation(internal.mail.clear, { userId });
      throw new ConvexError({ code: "INBOX_FAILED" });
    }

    await ctx.runMutation(internal.mail.finish, {
      email: outcome.record.email,
      inboxId: outcome.record.inbox_id,
      userId,
    });
    return {
      email: outcome.record.email,
      inboxId: outcome.record.inbox_id,
    };
  },
});

export const sendDigest = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    await rateLimiter.limit(ctx, "applicationDigest", {
      key: userId,
      throws: true,
    });
    const [profile, user] = await Promise.all([
      ctx.db
        .query("profiles")
        .withIndex("by_user", (index) => index.eq("userId", userId))
        .unique(),
      ctx.db.get("users", userId),
    ]);
    if (!(profile?.agentMailInboxId && user?.email)) {
      throw new ConvexError({ code: "INBOX_REQUIRED" });
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
      profile.agentMailInboxId,
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

export const inbox = query({
  args: {},
  returns: v.union(
    v.object({ email: v.string(), inboxId: v.string() }),
    v.null()
  ),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (index) => index.eq("userId", userId))
      .unique();
    return profile?.agentMailEmail && profile.agentMailInboxId
      ? {
          email: profile.agentMailEmail,
          inboxId: profile.agentMailInboxId,
        }
      : null;
  },
});

export const messages = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (index) => index.eq("userId", userId))
      .unique();
    if (!profile?.agentMailInboxId) {
      return [];
    }

    return ctx.runQuery(components.agentmail.lib.listInboundMessages, {
      inboxId: profile.agentMailInboxId,
    });
  },
});

import { authTables } from "@convex-dev/auth/server";
import {
  applicationStatusValidator,
  localeValidator,
  opportunityValidator,
  profileInputValidator,
} from "@repo/backend/convex/model";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  applications: defineTable({
    appliedAt: v.optional(v.number()),
    notes: v.string(),
    opportunityId: v.id("opportunities"),
    status: applicationStatusValidator,
    updatedAt: v.number(),
    userId: v.id("users"),
  })
    .index("by_user_updatedAt", ["userId", "updatedAt"])
    .index("by_user_opportunity", ["userId", "opportunityId"]),
  opportunities: defineTable({
    fingerprint: v.string(),
    opportunity: opportunityValidator,
    searchId: v.id("searches"),
    userId: v.id("users"),
  })
    .index("by_search", ["searchId"])
    .index("by_user_fingerprint", ["userId", "fingerprint"]),
  profiles: defineTable({
    ...profileInputValidator.fields,
    agentMailEmail: v.optional(v.string()),
    agentMailInboxId: v.optional(v.string()),
    agentMailProvisioningAt: v.optional(v.number()),
    cvFileName: v.optional(v.string()),
    cvStorageId: v.optional(v.id("_storage")),
    cvText: v.optional(v.string()),
    updatedAt: v.number(),
    userId: v.id("users"),
  })
    .index("by_cv", ["cvStorageId"])
    .index("by_user", ["userId"]),
  searches: defineTable({
    completedAt: v.optional(v.number()),
    country: v.optional(v.string()),
    createdAt: v.number(),
    error: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    locale: localeValidator,
    model: v.optional(v.string()),
    outputTokens: v.optional(v.number()),
    pathway: v.optional(
      v.union(
        v.literal("job"),
        v.literal("ausbildung"),
        v.literal("apprenticeship"),
        v.literal("internship"),
        v.literal("vocational")
      )
    ),
    query: v.string(),
    resultCount: v.optional(v.number()),
    status: v.union(
      v.literal("running"),
      v.literal("complete"),
      v.literal("failed")
    ),
    threadId: v.optional(v.string()),
    userId: v.id("users"),
    workMode: v.optional(
      v.union(v.literal("onsite"), v.literal("hybrid"), v.literal("remote"))
    ),
  }).index("by_user_createdAt", ["userId", "createdAt"]),
});

import { vWorkId } from "@convex-dev/workpool";
import { legacyAuthTables } from "@repo/backend/convex/legacy";
import {
  applicationStatusValidator,
  localeValidator,
  opportunityValidator,
  profileInputValidator,
  searchLimitationValidator,
} from "@repo/backend/convex/model";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...legacyAuthTables,
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
    fingerprint: v.optional(v.string()),
    opportunity: opportunityValidator,
    searchId: v.id("searches"),
    userId: v.id("users"),
  })
    .index("by_search", ["searchId"])
    .index("by_search_and_fingerprint", ["searchId", "fingerprint"])
    .index("by_search_and_url", ["searchId", "opportunity.directApplyUrl"]),
  profiles: defineTable({
    ...profileInputValidator.fields,
    cvFileName: v.optional(v.string()),
    cvStorageId: v.optional(v.id("_storage")),
    cvText: v.optional(v.string()),
    updatedAt: v.number(),
    userId: v.id("users"),
  })
    .index("by_cv", ["cvStorageId"])
    .index("by_user", ["userId"]),
  searches: defineTable({
    city: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    createdAt: v.number(),
    error: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    locale: localeValidator,
    limitation: v.optional(searchLimitationValidator),
    model: v.optional(v.string()),
    outputTokens: v.optional(v.number()),
    outcome: v.optional(v.union(v.literal("target_met"), v.literal("partial"))),
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
    region: v.optional(v.string()),
    regionCode: v.optional(v.string()),
    resultCount: v.optional(v.number()),
    status: v.union(
      v.literal("running"),
      v.literal("complete"),
      v.literal("failed")
    ),
    stage: v.optional(v.union(v.literal("initial"), v.literal("expansion"))),
    threadId: v.optional(v.string()),
    targetCount: v.optional(v.number()),
    userId: v.id("users"),
    workMode: v.optional(
      v.union(v.literal("onsite"), v.literal("hybrid"), v.literal("remote"))
    ),
  }).index("by_user_createdAt", ["userId", "createdAt"]),
  searchLanes: defineTable({
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    inputTokens: v.optional(v.number()),
    limit: v.optional(v.number()),
    limitation: v.optional(searchLimitationValidator),
    market: v.string(),
    outputTokens: v.optional(v.number()),
    resultCount: v.optional(v.number()),
    searchId: v.id("searches"),
    sourceQuery: v.optional(v.string()),
    stage: v.optional(v.union(v.literal("initial"), v.literal("expansion"))),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("complete"),
      v.literal("failed")
    ),
    threadId: v.optional(v.string()),
    updatedAt: v.number(),
    userId: v.id("users"),
    workId: v.optional(vWorkId),
  })
    .index("by_search", ["searchId"])
    .index("by_search_and_market", ["searchId", "market"]),
  users: defineTable({
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),
});

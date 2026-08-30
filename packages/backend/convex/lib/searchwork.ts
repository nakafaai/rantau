import { Workpool } from "@convex-dev/workpool";
import { components } from "@repo/backend/convex/_generated/api";
import { v } from "convex/values";

export const MAX_SEARCH_LANES = 20;
export const SEARCH_TIMEOUT_MS = 30 * 60 * 1000;

export const searchWork = new Workpool(components.searchWorkpool, {
  maxParallelism: 5,
  retryActionsByDefault: false,
});

export const discoveryLaneResultValidator = v.object({
  inputTokens: v.number(),
  outputTokens: v.number(),
  resultCount: v.number(),
  threadId: v.string(),
});

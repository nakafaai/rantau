# ADR-0001: Component-first Convex backend

## Status

Accepted

## Decision

Rantau uses Convex as the only application backend and prioritizes official Convex components for capabilities they already own.

- `@convex-dev/agent` owns AI threads, tool use, and generation history.
- `@firecrawl/firecrawl-convex` owns web search, scrape, map, and durable crawls.
- `@agentmail/convex` owns persistent email inboxes and reactive message sync.
- `@convex-dev/static-hosting` owns the `convex.site` frontend deployment.
- Convex Auth owns identity.
- Convex storage owns CV files.
- Convex indexes and search indexes own application data retrieval.

## Consequences

The backend has fewer operational seams, reactive state stays in one system, and component upgrades replace bespoke infrastructure work. Custom implementation remains appropriate for Rantau domain policy and typed adapters around component interfaces.

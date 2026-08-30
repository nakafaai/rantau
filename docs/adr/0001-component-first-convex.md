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

The normal caller contract stays short:

```text
results = opportunities.search(intent)
application = applications.save(result)
application = applications.advance(application, nextStatus)
```

The client never coordinates Firecrawl, an AI model, persistence, or email. A
public Convex function owns each user operation and keeps vendor state behind
that boundary.

## Types

Effect Schema owns candidate, opportunity, search, readiness, and application
contracts. Branded search values prevent unvalidated free text from entering a
provider prompt. Tagged errors represent expected domain failures. Convex
validators own the persisted and public transport representation required by
the database runtime.

## Ownership

- `packages/domain` owns values, transitions, evidence rules, and readiness
  projection.
- `packages/backend/convex` owns auth, indexed persistence, public functions,
  component registration, and framework Effect runners.
- Convex Agent owns model threads and generation history.
- Firecrawl owns current web retrieval and scraped source content.
- AgentMail owns inbox and delivery lifecycle state.
- `apps/www` owns interaction state and localization, not business rules.

## Module map

```text
apps/www
  -> packages/domain
  -> generated Convex API
packages/backend/convex
  -> packages/domain
  -> official Convex components
packages/domain
  -> Effect v4 only
```

Hand-written modules import the owning file through `@/` or `@repo/*` aliases.
Registered Convex route files stay thin. Domain capability files concentrate
validation and policy without pass-through barrels.

## Main flow

1. Convex Auth resolves the candidate.
2. A transactional rate limit reserves one search request.
3. Firecrawl retrieves current, source-backed application pages.
4. The Agent component extracts typed opportunities from bounded evidence.
5. Domain policy rejects unsupported source indexes and normalizes results.
6. A mutation stores the search and opportunity records atomically.
7. The realtime client renders one direct application action and a derived
   readiness plan.

Partial vendor failure marks the search as failed without storing unsupported
opportunities. A retry starts a new traceable search rather than mutating prior
evidence.

## Alternatives

### Effect service wrappers around every component

This would make every vendor call injectable, but most wrappers would only
forward a Convex context and arguments. It adds concepts without hiding vendor
knowledge, so it fails the deletion test. Effect programs remain valuable for
validation, orchestration, and typed failures, while the installed component
client remains the adapter at the Convex boundary.

### Separate ingestion worker and search database

This could support very large indexing workloads, but duplicates scheduling,
storage, auth, and observability already supplied by Convex components. It is
not justified for the hackathon product or its initial scale.

## Risks

- Current search quality depends on Firecrawl source coverage and direct job
  pages remaining accessible.
- Convex Auth is beta, so upgrades require an explicit auth regression gate.
- AI extraction can be incomplete. Deterministic source ownership prevents an
  invented link from becoming a Direct Apply URL.
- Non-Vercel hosting requires a static AI Gateway key in Convex environment
  variables and an explicit monthly budget.

## Consequences

The backend has fewer operational seams, reactive state stays in one system,
and component upgrades replace bespoke infrastructure work. Custom
implementation remains appropriate for Rantau domain policy and typed adapters
around component interfaces.

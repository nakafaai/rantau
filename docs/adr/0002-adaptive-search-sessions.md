# ADR-0002: Durable adaptive search sessions

## Status

Accepted

## Decision

Rantau treats each search as one durable Convex Search Session. The session owns a typed Place Scope, a staged Discovery Plan, streamed Opportunities, and a deterministic quality outcome. The existing `searches` records are also the history source, so the product exposes paginated sessions rather than copying them into a separate history store.

Initial Workpool lanes favor the selected city, region, and country. When all lanes settle below the verified result target, the session may enqueue one bounded expansion stage from untried strategies. It stops when the target is met, the plan is exhausted, or the session budget ends. A sparse valid market remains an honest partial result instead of being padded with unsupported Opportunities.

Country, administrative region, and city choices come from a lazy global geographic snapshot. ASEAN member states are presented first, while every available country remains searchable. The browser adapter loads only the selected hierarchy and the domain module owns the hierarchy invariant.

## Considered options

- A second history table was rejected because `searches` already owns immutable intent, status, counters, and result relationships.
- One static set of retrieval lanes was rejected because source duplication makes target attainment unpredictable.
- A hand-maintained country and city list was rejected because it cannot cover every country accurately or remain current.

## Consequences

Search IDs become stable navigation state, history remains realtime and indexed, and retrieval cost stays bounded. The geographic dataset requires attribution and network access for uncached hierarchy files. Search quality becomes explicit: target met, partial after exhaustion, or failed without valid results.

# Hackathon log

- **Project:** Rantau
- **Event:** Convex All Gas Hackathon
- **What it does:** Finds local and international work pathways, links directly to applications, explains preparation requirements, personalizes from a candidate profile, and tracks applications.
- **Live app:** https://dusty-toad-573.convex.site
- **Repo:** https://github.com/nakafaai/rantau
- **Frontend:** Convex static hosting
- **Convex deployment:** isolated `nakafa:rantau:production` (`dusty-toad-573`, Europe) with development on `precious-gerbil-694`
- **Components:** `@convex-dev/agent`, `@convex-dev/rate-limiter`, `@convex-dev/static-hosting`
- **Convex features:** tables and indexes, actions, mutations, queries, scheduled functions, realtime queries, HTTP routes, file storage, typed environment variables
- **Auth:** Convex Auth v2 password provider with isolated JWT and JWKS keys
- **AI models:** `openai/gpt-5.4-mini` through Vercel AI Gateway with `google/gemini-3.5-flash-lite` fallback
- **Started:** 2026-08-30T04:20:15Z
- **Last updated:** 2026-08-30T14:07:30Z

## Log

### 2026-08-30 - e4a7d53
Named and structured the product as a pnpm and Turborepo monorepo with separate frontend, backend, design-system, and Effect domain modules. Recorded the component-first Convex decision and selected Convex static hosting (`package.json`, `turbo.json`, `CONTEXT.md`, `docs/adr/0001-component-first-convex.md`).

### 2026-08-30 - isolated Convex backend
Created a new Rantau project in the Nakafa team, provisioned its Europe development deployment, and verified it does not target the existing Nakafa project. Mounted Agent, Firecrawl, AgentMail, Rate Limiter, and Static Hosting components. Added Convex Auth v2 keys, source-backed job discovery, direct application URL pinning, readiness plans, profile and PDF CV processing, application tracking, and AgentMail inbox and digest flows. Domain tests pass with 100 percent statement, function, and line coverage and 96 percent branch coverage (`packages/backend/convex`, `packages/domain`).

### 2026-08-30 - bilingual static workspace
Built the English and Indonesian static application shell with Convex Auth, natural-language opportunity search, source-pinned direct apply actions, readiness details, profile and PDF CV controls, and a realtime application tracker. Formatting, Effect source verification, repository quality contracts, Ultracite, all four package typechecks, 27 backend and domain tests, 100 percent statement, function, and line coverage for domain code, Convex code generation, and the complete static Next.js build pass from the local checkout.

### 2026-08-30 - production release and end-to-end proof
Created the isolated Rantau production deployment, configured Convex Auth, Firecrawl, Vercel AI Gateway, and AgentMail without sharing the Nakafa deployment, and published the bilingual Next.js application through the Static Hosting component. Added an explicit CI gate and deployed only exact merged `main` commits. Patched the AgentMail Convex component package so its typed environment and client-facing actions work with the current Convex component isolation contract.

Verified the live application in Chrome from account creation through sign-out and sign-in. Saved a candidate profile, uploaded and privately extracted a synthetic PDF CV, searched a first-party Charite career page through the Firecrawl and Agent components, opened the official direct-apply CTA, saved the opportunity, advanced its tracker status, and delivered an application digest through the AgentMail component. Confirmed both English and Indonesian workspaces, exact refresh-safe static locale assets, and the public cost estimates. The final local and CI gates pass 38 tests, all package typechecks, Ultracite and Biome checks, Effect source verification, supply-chain policy checks, and the static production build.

### 2026-08-30 - CV lifecycle hardening

Re-audited the core opportunity and CV boundaries before handoff. The opportunity result path already uses one bounded Convex subscription with one profile read for all cards. Hardened the CV intake action so failed validation, extraction, or final persistence discards only unreferenced uploads. Added a storage ownership index that prevents a CV already attached to one profile from being attached to another profile, while preserving referenced files during cleanup. Added Convex regression coverage for both failure cleanup and referenced-file protection.

### 2026-08-30 - Nakafa interface and auth parity

Replaced the presentation layer with Nakafa's current themes, typography, button, field, menu, and responsive sidebar primitives while preserving Rantau's bilingual job-search domain. Rebuilt authentication with the same 3-to-4 column Nakafa composition and theme-responsive dithering, while retaining Convex Auth email and password access through a shadcn Field and TanStack Form flow validated by Effect v4 Standard Schema. The password helper and validation error now share one message and are mutually exclusive.

Replaced browser-owned workspace state with clean Next.js routes for search, profile, and applications, and removed the internal provider and cost page from the user interface. Search now starts a durable Convex session, schedules discovery in the background, and renders stable realtime progress before a shadcn and TanStack data table. Added country, pathway, and work-mode filters; direct-apply and preparation Sheets; one-column structured profile controls; localized flags and option labels; and a table-based application tracker. Formatting, Ultracite and Biome checks, all package typechecks, 51 tests, static route generation, and Chrome checks for clean URLs, theme switching, localization, and concise auth validation pass (`apps/www/app`, `apps/www/components`, `packages/backend/convex/opportunities.ts`, `packages/backend/convex/searches.ts`, `packages/domain`).

### 2026-08-30 - canonical production routes

Disabled Static Hosting SPA fallback and registered exact server routes for every generated Next.js workspace page. Production now returns 200 for `/`, `/en/`, `/en/profile/`, `/en/applications/`, and their Indonesian equivalents; redirects extensionless and `index.html` variants to the canonical clean URL with 308; and returns 404 for unknown paths. Deployed backend and static assets from merged commit `983cd407b650c20c0278118f8438cc8ea0f2dde8`, then verified the English auth surface and legacy URL redirect in Chrome.

### 2026-08-30 - working tree

Expanded direct opportunity discovery from one US-biased provider request into a bounded global pipeline across regional search lanes. Firecrawl evidence is analyzed in small isolated Agent batches, bound to verified source URLs, deduplicated, and ranked against explicit filters plus saved profile preferences before one durable Convex search completes (`packages/backend/convex/lib/discover.ts`, `packages/backend/convex/opportunities.ts`, `packages/domain/rank.ts`).

Rebuilt the result experience as a Coss and TanStack table with sorting, pagination, page selection, atomic bulk save, compact row actions, color-coded pathways, source previews, country flags, external company and map links, and a wider detail Sheet. Grouped profile settings into capability-owned Cards, replaced the raw number control with the Coss Number Field, simplified CV intake, and moved application email actions into the page header. The complete verification gate passes 52 tests, all package typechecks, Ultracite and Biome checks, Effect source verification, and the static Next.js production build (`apps/www/components`, `packages/design-system/components/ui`).

### 2026-08-30 - global search production release

Merged the global ranked discovery and workspace revision through PR #22 after the exact head `3a402ce914e1b8e126210b5491d41751c89d0433` passed CI. Deployed the resulting `main` merge commit `65ee819f7057de2d312d168b9f1c91d9b772e9cb` to the isolated Rantau production backend `dusty-toad-573`, then atomically published 84 Next.js static assets with SPA fallback disabled.

Verified the live release in Chrome at `https://dusty-toad-573.convex.site`: English and Indonesian locale switching, system and explicit themes, concise form validation, and a clean browser console. HTTP probes confirmed 200 responses for every canonical workspace route, 308 redirects from legacy `index.html` paths to clean URLs, and a real 404 for unknown routes.

### 2026-08-30 - 76350f0

Removed page and table horizontal overflow and rebuilt search around one compact Nakafa-style header. Query and Vercel-style filter chips now sit above a fixed responsive table whose rows stay one line, hide lower-priority columns by breakpoint, and keep result counts only in the pagination footer.

The complete local gate passes 52 tests, all package typechecks, Ultracite and Biome checks, Effect source verification, repository quality contracts, and the static Next.js production build (`apps/www/components/search.tsx`, `apps/www/components/results.tsx`, `apps/www/components/filters.tsx`, `packages/design-system/components/ui/table.tsx`).

### 2026-08-30 - responsive table production release

Merged PR #24 after exact head `76350f00737e8a10903bf0cedf02f0e23ce15247` passed CI, then deployed merge commit `1b92676d3c475695802f288c3245875310975a8c` to the isolated Rantau production backend and published 84 static assets with SPA fallback disabled.

Production probes return 200 for the locale root, profile, and applications routes, redirect the legacy `index.html` URL to the clean locale URL with 308, and return 404 for an unknown route. Local Chrome geometry checks at 1920 px and 1280 px confirmed that page and table scroll widths equal their client widths and rows remain 56 px tall.

### 2026-08-30 - 297e42e

Traced intermittent password login failures to deployment-specific browser state. Development requires its exact regional Convex origin, while Static Hosting supplies the canonical production origin. Convex Auth now uses a stable Rantau-owned storage namespace, so tokens left under the earlier address-derived namespaces cannot trap the provider in loading or interrupt a new password exchange. Generic auth failures were also replaced with tested, concise credential, account, or connection feedback (`apps/www/lib/auth.ts`, `apps/www/components/auth.tsx`, `apps/www/components/providers.tsx`).

Also repaired the add-filter menu's Base UI group ownership so its label and filter branches open without a runtime crash. The local gate passes 56 tests, all package typechecks, Ultracite and Biome checks, Effect source verification, repository quality contracts, and the static Next.js production build (`apps/www/components/filters.tsx`).

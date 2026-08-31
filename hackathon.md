# Hackathon log

- **Project:** Rantau
- **Event:** Convex All Gas Hackathon
- **What it does:** Finds local and international work pathways, links directly to applications, explains preparation requirements, personalizes from a candidate profile, and tracks applications.
- **Live app:** https://dusty-toad-573.convex.site
- **Repo:** https://github.com/nakafaai/rantau
- **Frontend:** Convex static hosting
- **Convex deployment:** https://dusty-toad-573.convex.cloud
- **Components:** `@convex-dev/agent`, `@convex-dev/auth`, `@convex-dev/rate-limiter`, `@convex-dev/static-hosting`, `@convex-dev/workpool`, `@firecrawl/firecrawl-convex`, `@agentmail/convex`
- **Convex features:** tables and indexes, actions, optimistic mutations, queries, scheduled functions, durable Workpool lanes, incremental realtime results, HTTP routes, file storage, typed environment variables
- **Auth:** latest Convex Auth v2 alpha password provider with isolated JWT and JWKS keys plus resumable legacy password migration
- **AI model:** `google/gemini-3.7-flash` through Vercel AI Gateway
- **Interface:** HeroUI v3 with React Aria, Tailwind CSS 4, Hugeicons, TanStack Table, and TanStack Form
- **Started:** 2026-08-30T04:20:15Z
- **Last updated:** 2026-08-31T17:55:51Z

## Log

### 2026-08-30 - e4a7d53
Named and structured the product as a pnpm and Turborepo monorepo with separate frontend, backend, design-system, and Effect domain modules. Recorded the component-first Convex decision and selected Convex static hosting (`package.json`, `turbo.json`, `CONTEXT.md`, `docs/adr/0001-component-first-convex.md`).

### 2026-08-30 - isolated Convex backend
Created a new Rantau project in the Nakafa team, provisioned its Europe development deployment, and verified it does not target the existing Nakafa project. Mounted Agent, Firecrawl, AgentMail, Rate Limiter, and Static Hosting components. Added Convex Auth v2 keys, source-backed job discovery, direct application URL pinning, readiness plans, profile and PDF CV processing, application tracking, and AgentMail inbox and digest flows. Domain tests pass with 100 percent statement, function, and line coverage and 96 percent branch coverage (`packages/backend/convex`, `packages/domain`).

### 2026-08-30 - bilingual static workspace
Built the English and Indonesian static application shell with Convex Auth, natural-language opportunity search, source-pinned direct apply actions, readiness details, profile and PDF CV controls, and a realtime application tracker. Formatting, Effect source verification, repository quality contracts, Ultracite, all four package typechecks, 27 backend and domain tests, 100 percent statement, function, and line coverage for domain code, Convex code generation, and the complete static Next.js build pass from the local checkout.

### 2026-08-30 - production release and end-to-end proof
Created the isolated Rantau production deployment, configured Convex Auth, Firecrawl, Vercel AI Gateway, and AgentMail without sharing the Nakafa deployment, and published the bilingual Next.js application through the Static Hosting component. Added an explicit CI gate and deployed only exact merged `main` commits. Patched the AgentMail Convex component package so its typed environment and client-facing actions work with the current Convex component isolation contract.

Verified the live application in Chrome from account creation through sign-out and sign-in. Saved a candidate profile, uploaded and privately extracted a synthetic PDF CV, searched a first-party Charite career page through the Firecrawl and Agent components, opened the official direct-apply CTA, saved the opportunity, advanced its tracker status, and delivered an application digest through the AgentMail component. Confirmed both English and Indonesian workspaces and exact refresh-safe static locale assets. The final local and CI gates pass 38 tests, all package typechecks, Ultracite and Biome checks, Effect source verification, supply-chain policy checks, and the static production build.

### 2026-08-30 - CV lifecycle hardening

Re-audited the core opportunity and CV boundaries before handoff. The opportunity result path already uses one bounded Convex subscription with one profile read for all cards. Hardened the CV intake action so failed validation, extraction, or final persistence discards only unreferenced uploads. Added a storage ownership index that prevents a CV already attached to one profile from being attached to another profile, while preserving referenced files during cleanup. Added Convex regression coverage for both failure cleanup and referenced-file protection.

### 2026-08-30 - Nakafa interface and auth parity

Replaced the presentation layer with Nakafa's current themes, typography, button, field, menu, and responsive sidebar primitives while preserving Rantau's bilingual job-search domain. Rebuilt authentication with the same 3-to-4 column Nakafa composition and theme-responsive dithering, while retaining Convex Auth email and password access through a shadcn Field and TanStack Form flow validated by Effect v4 Standard Schema. The password helper and validation error now share one message and are mutually exclusive.

Replaced browser-owned workspace state with clean Next.js routes for search, profile, and applications, and removed the internal provider and cost page from the user interface. Search now starts a durable Convex session, schedules discovery in the background, and renders stable realtime progress before a shadcn and TanStack data table. Added country, pathway, and work-mode filters; direct-apply and preparation Sheets; one-column structured profile controls; localized flags and option labels; and a table-based application tracker. Formatting, Ultracite and Biome checks, all package typechecks, 51 tests, static route generation, and Chrome checks for clean URLs, theme switching, localization, and concise auth validation pass (`apps/www/app`, `apps/www/components`, `packages/backend/convex/opportunities.ts`, `packages/backend/convex/searches.ts`, `packages/domain`).

### 2026-08-30 - canonical production routes

Disabled Static Hosting SPA fallback and registered exact server routes for every generated Next.js workspace page. Production now returns 200 for `/`, `/en/`, `/en/profile/`, `/en/applications/`, and their Indonesian equivalents; redirects extensionless and `index.html` variants to the canonical clean URL with 308; and returns 404 for unknown paths. Deployed backend and static assets from merged commit `983cd407b650c20c0278118f8438cc8ea0f2dde8`, then verified the English auth surface and legacy URL redirect in Chrome.

### 2026-08-30 - working tree

Expanded direct opportunity discovery from one US-biased provider request into a bounded global pipeline across regional search lanes. Firecrawl evidence is analyzed in small isolated Agent batches, bound to verified source URLs, deduplicated, and ranked against explicit filters plus saved profile preferences before one durable Convex search completes (`packages/backend/convex/lib/discover.ts`, `packages/backend/convex/opportunities.ts`, `packages/domain/rank.ts`).

Rebuilt the result experience as a Shadcn and TanStack table with sorting, pagination, page selection, atomic bulk save, compact row actions, color-coded pathways, source previews, country flags, external company and map links, and a wider detail Sheet. Grouped profile settings into capability-owned Cards, replaced the raw number control with the Shadcn Base UI Number Field, simplified CV intake, and moved application email actions into the page header. The complete verification gate passes 52 tests, all package typechecks, Ultracite and Biome checks, Effect source verification, and the static Next.js production build (`apps/www/components`, `packages/design-system/components/ui`).

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

### 2026-08-30 - zero-shift navigation

Replaced route loading placeholders with fixed geometry that matches the destination workspace. Search loading preserves the final table shell with ten fixed-height rows, while profile and application routes reserve their final card structure from the first frame. A viewport-fixed progress overlay reports background work without moving page content or changing document flow (`apps/www/app/[locale]/loading.tsx`, `apps/www/app/[locale]/profile/loading.tsx`, `apps/www/app/[locale]/applications/loading.tsx`, `apps/www/components/skeleton.tsx`).

Merged PR #29 after the exact head `c234e09d10496ea8109c1f0c9eb0e3f936978d6a` passed CI. The production release retained clean canonical routes and showed equal document client and scroll widths in Chrome, with no horizontal overflow.

### 2026-08-30 - Convex Auth v2 production release

Migrated password access to the official Convex Auth v2 alpha core, username, password-provider, and rate-limiter components. Existing Rantau users keep their application identity: the first successful login verifies the legacy Scrypt credential, writes an Argon2id password to the v2 component, and immediately removes the migrated legacy hash. Credentials newly rejected by the stronger common-password policy use a fixed Shadcn dialog and TanStack Form flow that does not shift the page (`packages/backend/convex/auth.ts`, `packages/backend/convex/legacy.ts`, `apps/www/components/rekey.tsx`, `apps/www/components/providers.tsx`).

Merged PR #30 after the exact head `6d718412c02dc63c56ad8d7013bc83fcd57a82a8` passed CI, then deployed merge commit `caf12470f8cb664948517d9f3025b2ef9cd30d87` to the isolated production backend and Convex static hosting. Production exposes the RS256 JWKS endpoint and unauthenticated identity checks resolve normally. The complete gate passes 58 tests, all package typechecks, Ultracite and Biome checks, the static Next.js build, and React Doctor at 100 out of 100.

### 2026-08-30 - current responsive realtime revision

Standardized every maintained Shadcn configuration on `base-nova`, replaced Radix-owned interaction primitives with Base UI, capped interface icons at 16 pixels, and retained one explicit PostCSS framework adapter as the only authored JavaScript-family file. Repository policy now rejects relative TypeScript imports, Radix dependencies, raw Vitest APIs, TSX test files, orphan tests, non-Nova Shadcn configuration, and authored JavaScript outside the named adapter. Effect v4 source verification and colocated `@effect/vitest` suites enforce 100 percent configured coverage without adding presentation tests.

Searches now run as bounded durable Workpool lanes across global markets. Each lane persists verified Firecrawl and Agent results incrementally so the TanStack table updates through one Convex realtime query while the user navigates elsewhere. The viewport-height search and application tables keep stable headers, scrollable bodies, and pagination footers across mobile, tablet, and desktop without horizontal page overflow. Profile writes and application actions use Convex optimistic updates, and profile preferences seed the next search automatically.

Pinned Vercel AI Gateway generation to `google/gemini-3.7-flash` with no GPT fallback. Hardened Convex Auth v2 alpha migration so account mapping, Argon2id password, username, and legacy-hash cleanup can resume safely after an interrupted action. The migration now repairs the partial state that previously produced a generic login error instead of requiring cookie deletion.

### 2026-08-30 - responsive realtime production release

Merged PR #31 after exact head `8627f6359d4043f713e8dbd3dd5ec364331d00c5` passed Verify and React Doctor. Production schema validation then identified 32 opportunity records carrying the retired `fingerprint` field. PR #32 introduced one bounded internal migration, removed all 32 fields, and verified zero remaining records. PR #33 removed the temporary schema allowance and migration function so no compatibility code remained.

Deployed final merge commit `ad020c22f7c027110d8098e96f1db9279df1f9e5` to the isolated Convex backend and Static Hosting component. The deployed Indonesian HTML matches the local production artifact byte for byte. Clean locale, profile, and applications URLs return 200, `/id/index.html` redirects to `/id/`, and unknown paths return 404. Playwright verified zero horizontal overflow across five viewports from 390 by 500 through 1920 by 1080, with no browser errors or warnings.

### 2026-08-31 - 09c5025

Expanded each search into staged, durable Convex Workpool lanes with incremental realtime results, explicit deadlines, bounded recovery from transient Firecrawl failures, deterministic evaluation coverage, and honest partial completion when the verified result target cannot be met (`packages/backend/convex/lib/searchwork.ts`, `packages/backend/convex/searchlane.ts`, `packages/domain/discoveryeval.ts`).

Added indexed, paginated search history and a typed country, region, and city hierarchy that prioritizes selected geographic scopes before bounded expansion. Refined the application tracker with distinct statuses and deletion, removed obsolete AgentMail profile fields, and preserved direct application links (`packages/backend/convex/searchhistory.ts`, `packages/domain/place.ts`, `apps/www/components/search-history.tsx`, `apps/www/components/tracker.tsx`).

Migrated the complete interface from Shadcn and Base UI to native HeroUI v3 compound components, removed the legacy primitive layer and direct Base UI and Radix dependencies, and added desktop and mobile Playwright coverage. Follow-up releases tightened the full-width profile grid, table footer alignment, country-picker copy, and fixed action surfaces (`apps/www/components`, `packages/design-system/styles/globals.css`, `apps/www/e2e/auth.e2e.ts`).

PRs #34 through #49 are merged. Exact-head CI for PR #49 passed Verify and React Doctor. The final local gates pass formatting, Effect source checks, repository policy, all package typechecks, 103 Vitest tests with 100 percent configured coverage, the static Next.js build, four Playwright checks, React Doctor at 100 out of 100, and HeroUI Doctor. Production is published from merge commit `09c50252d0ca6bc2b551b2a3610ef8962e725919` through Convex Static Hosting.

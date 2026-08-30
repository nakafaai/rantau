# Hackathon log

- **Project:** Rantau
- **Event:** Convex All Gas Hackathon
- **What it does:** Finds local and international work pathways, links directly to applications, explains preparation requirements, personalizes from a candidate profile, and tracks applications.
- **Live app:** https://dusty-toad-573.convex.site
- **Repo:** https://github.com/nakafaai/rantau
- **Frontend:** Convex static hosting
- **Convex deployment:** isolated `nakafa:rantau:production` (`dusty-toad-573`, Europe) with development on `precious-gerbil-694`
- **Components:** `@convex-dev/agent`, `@convex-dev/rate-limiter`, `@convex-dev/static-hosting`
- **Convex features:** tables and indexes, actions, mutations, queries, HTTP routes, file storage, typed environment variables
- **Auth:** Convex Auth v2 password provider with isolated JWT and JWKS keys
- **AI models:** `openai/gpt-5.4-mini` through Vercel AI Gateway with `google/gemini-3.5-flash-lite` fallback
- **Started:** 2026-08-30T04:20:15Z
- **Last updated:** 2026-08-30T08:20:12Z

## Log

### 2026-08-30 - working tree
Named and structured the product as a pnpm and Turborepo monorepo with separate frontend, backend, design-system, and Effect domain modules. Recorded the component-first Convex decision and selected Convex static hosting (`package.json`, `turbo.json`, `CONTEXT.md`, `docs/adr/0001-component-first-convex.md`).

### 2026-08-30 - isolated Convex backend
Created a new Rantau project in the Nakafa team, provisioned its Europe development deployment, and verified it does not target the existing Nakafa project. Mounted Agent, Firecrawl, AgentMail, Rate Limiter, and Static Hosting components. Added Convex Auth v2 keys, source-backed job discovery, direct application URL pinning, readiness plans, profile and PDF CV processing, application tracking, and AgentMail inbox and digest flows. Domain tests pass with 100 percent statement, function, and line coverage and 96 percent branch coverage (`packages/backend/convex`, `packages/domain`).

### 2026-08-30 - bilingual static workspace
Built the English and Indonesian static application shell with Convex Auth, natural-language opportunity search, source-pinned direct apply actions, readiness details, profile and PDF CV controls, and a realtime application tracker. Moved the active checkout to `/Users/nabilfatih/Code/rantau` after proving the Documents workspace could offload dependencies as macOS dataless files. Formatting, Effect source verification, repository quality contracts, Ultracite, all four package typechecks, 27 backend and domain tests, 100 percent statement, function, and line coverage for domain code, Convex code generation, and the complete static Next.js build pass from the local checkout.

### 2026-08-30 - production release and end-to-end proof
Created the isolated Rantau production deployment, configured Convex Auth, Firecrawl, Vercel AI Gateway, and AgentMail without sharing the Nakafa deployment, and published the bilingual Next.js application through the Static Hosting component. Added an explicit CI gate and deployed only exact merged `main` commits. Patched the AgentMail Convex component package so its typed environment and client-facing actions work with the current Convex component isolation contract.

Verified the live application in Chrome from account creation through sign-out and sign-in. Saved a candidate profile, uploaded and privately extracted a synthetic PDF CV, searched a first-party Charite career page through the Firecrawl and Agent components, opened the official direct-apply CTA, saved the opportunity, advanced its tracker status, and delivered an application digest through the AgentMail component. Confirmed both English and Indonesian workspaces, exact refresh-safe static locale assets, and the public cost estimates. The final local and CI gates pass 36 tests, all package typechecks, Ultracite and Biome checks, Effect source verification, supply-chain policy checks, and the static production build.

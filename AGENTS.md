# Rantau Agent Guide

Build for longevity. Keep the product direct, typed, accessible, and easy to verify.

## Stack

- Package manager: pnpm 11
- Monorepo: Turborepo
- Frontend: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- Backend: Convex with official components first
- Auth: Convex Auth
- Domain programs: Effect v4
- Internationalization: English and Indonesian through next-intl
- Tests: Vitest and Playwright
- Formatting and linting: Ultracite and Biome

## Architecture

- `apps/www` owns routes and browser interaction.
- `packages/backend` owns Convex schema, functions, auth, and installed Convex components.
- `packages/design-system` owns shadcn/ui primitives and visual tokens.
- `packages/domain` owns Effect schemas, branded values, policies, and deterministic projections.
- `repos/effect` is read-only vendored reference source. Never import application code from it.
- Same-workspace imports use `@/*`. Cross-workspace imports use `@repo/*`.
- Hand-written imports never use relative paths or explicit `.js` or `.ts` extensions.
- Folder and file names use one capability word where possible and never exceed two words.

Read `CONTEXT.md` before changing domain language. Read relevant ADRs before structural work.

## Quality

- Hand-written TypeScript modules should stay below 300 lines when practical. A touched file over 500 lines blocks readiness unless splitting would reduce locality.
- Prefer direct control flow, early returns, schema-derived types, and domain-owned modules.
- Do not add `any`, broad casts, generic errors, silent fallbacks, pass-through modules, or generic helper folders.
- Every expected failure uses a tagged Effect error or an explicit Convex error at the framework seam.
- Every named hand-written function and method has a concise JSDoc contract.
- Use the deletion test before adding a module. A module must concentrate real complexity.

## Convex

- Prefer an official Convex component before custom infrastructure.
- Use object-form Convex functions with both `args` and `returns` validators.
- Use indexes for every query path. Never use an unbounded `.collect()` on a growing table.
- Public functions exist only for direct client calls. Everything else is internal.
- Use Convex storage, realtime queries, search indexes, scheduler, and workflows rather than parallel infrastructure.
- Keep secrets only in Convex environment variables. Never commit or log them.

## Effect v4

- Effectful domain capabilities start with Schema contracts and tagged errors.
- Export named `Effect.fn` programs.
- Run Effects only at browser event, Convex action, CLI, script, or test seams.
- Inspect `repos/effect` before writing or reviewing unfamiliar Effect patterns.
- Read `repos/effect/LLMS.md` and `repos/effect/.agents/AGENTS.md` before Effect work.

## UI

- Reuse design-system primitives before writing custom visual markup.
- Keep one primary action per page.
- Preserve the calm Nakafa shell, readable density, visible focus, and responsive sidebar.
- Verify changed UI in a real browser at desktop and mobile widths.

## Verification

Run the smallest useful check first, then expand:

1. `pnpm format`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`
6. Browser acceptance for the core journey

Before completion, audit Git state, task-owned processes, temporary files, deployments, browser tabs, branches, worktrees, stashes, and generated artifacts.

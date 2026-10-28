---
name: nextjs
description: Finds the right Next.js 16 guide before writing routing, rendering, caching, data fetching, proxy, metadata or route handler code. Use whenever a change touches src/app/, src/proxy.ts, next.config.ts or calls a next/* API.
---

# Next.js in this repository

This app runs Next.js 16 with the App Router. Its APIs differ from older
versions and from most training data. The docs that match the installed
version ship with the package. Read the relevant one before writing code:

```text
board-games-tracker/node_modules/next/dist/docs/01-app/
```

## Which guide to read

| Task                                                | Guide (under `01-app/`)                                                                            |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Server vs client components, `"use client"`         | `01-getting-started/05-server-and-client-components.md`, `02-guides/server-and-client-boundary.md` |
| Loading data in a page                              | `01-getting-started/06-fetching-data.md`                                                           |
| Server actions and forms                            | `01-getting-started/07-mutating-data.md`, `02-guides/server-actions.md`, `02-guides/forms.md`      |
| Revalidating after a mutation                       | `01-getting-started/09-revalidating.md`, `03-api-reference/04-functions/revalidatePath.md`         |
| Caching (this app does not enable Cache Components) | `02-guides/caching-without-cache-components.md`                                                    |
| Rendering on request only                           | `03-api-reference/04-functions/connection.md`                                                      |
| `cookies()` / `headers()` (async)                   | `03-api-reference/04-functions/cookies.md`, `headers.md`                                           |
| Route handlers in `src/app/api/`                    | `01-getting-started/15-route-handlers.md`, `03-api-reference/04-functions/next-response.md`        |
| `src/proxy.ts` (formerly middleware), CSP           | `01-getting-started/16-proxy.md`, `02-guides/content-security-policy.md`                           |
| Errors, `not-found`, `global-error`                 | `01-getting-started/10-error-handling.md`                                                          |
| Metadata and icons                                  | `01-getting-started/14-metadata-and-og-images.md`                                                  |
| Images                                              | `01-getting-started/12-images.md`                                                                  |
| Environment variables                               | `02-guides/environment-variables.md`                                                               |
| Auth and data security                              | `02-guides/authentication.md`, `02-guides/data-security.md`                                        |
| Static export (the demo in `demo/`)                 | `02-guides/static-exports.md`                                                                      |
| Self-hosting with Docker (`output: "standalone"`)   | `02-guides/self-hosting.md`                                                                        |
| Upgrade notes and deprecations                      | `01-getting-started/18-upgrading.md`, `02-guides/upgrading/`                                       |

Search the folder when the table does not cover the task:

```bash
grep -rl "<api name>" board-games-tracker/node_modules/next/dist/docs/01-app
```

## How this app uses Next.js

- Pages under `src/app/(app)/` sit behind `requireUser()` in
  `src/app/(app)/layout.tsx` and the `protectedPrefixes` list in
  `src/proxy.ts`. Add both for a new authenticated area.
- Mutations are server actions in `src/server/actions/`. They refresh pages
  through the helpers in `src/server/revalidate.ts` (library, account, shared
  game, settings, admin, and all routes), not through scattered
  `revalidatePath` calls.
- `src/app/login/page.tsx` calls `await connection()` so the build never
  touches the database. Do the same for any page whose output depends on live
  data at request time.
- `next.config.ts` sets `output: "standalone"` for Docker and wraps the config
  with `next-intl` and Sentry. The demo is a separate static export built with
  `pnpm demo:build`.
- `next dev` rewrites the block between the `nextjs-agent-rules` markers in
  `board-games-tracker/AGENTS.md`. Commit that change; do not fight it.

Then run the `check` skill.

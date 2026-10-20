---
name: check
description: Runs the repository's definition of done and fixes each failure. Use before saying a change is finished, before a commit or push, or when CI's verify job fails.
---

# Check

Every command runs from `board-games-tracker/`.

## The gate

```bash
pnpm check && pnpm test:coverage && pnpm build && pnpm audit --audit-level=moderate
```

CI (`.github/workflows/ci.yml`, job `verify`) runs the same steps plus
`pnpm demo:build`. Run that too when you touch `demo/`, `scripts/prepare-demo.mjs`,
`scripts/seed-demo.ts`, `src/core/demo/` or a component the demo renders.

`pnpm check` is `run-p typecheck lint format:check test knip`, so one failure
can hide behind another's output. Read every block.

## Fixing each failure

| Step        | Command                             | Fix                                                                                                                                                                                         |
| ----------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types       | `pnpm typecheck`                    | Fix the type. No `any`, no `!`, no `as` to silence it, no `@ts-ignore`. `noUncheckedIndexedAccess` is on: handle `undefined`.                                                               |
| Lint        | `pnpm lint`                         | `pnpm lint:fix` for import order, JSX prop order and JSDoc spacing. No warnings are allowed. Missing JSDoc: write a real third-person sentence plus `@param name - …` and `@returns`.     |
| Format      | `pnpm format:check`                 | `pnpm format`. It also covers the root `*.md` files and `.github/`.                                                                                                                         |
| Tests       | `pnpm test`                         | Fix the code, not the assertion, unless the behaviour change is intended. `messages/messages.test.ts` fails when `messages/en.json` and `messages/it.json` differ in keys or ICU arguments. |
| Unused code | `pnpm knip`                         | Delete the unused file, export or dependency. Do not add a Knip ignore to keep dead code.                                                                                                   |
| Coverage    | `pnpm test:coverage`                | Floors in `vitest.config.ts`: branches 65, functions 78, lines 82, statements 81. Add colocated tests for the new paths, failure cases included.                                            |
| Build       | `pnpm build`                        | Needs a valid environment (see `src/env.ts`). CI uses placeholder values; locally `.env.local` is read. Never print `.env*` files.                                                          |
| Audit       | `pnpm audit --audit-level=moderate` | Upgrade the dependency. An `ignoreGhsas` entry in `pnpm-workspace.yaml` needs a nearby comment: the advisory, why the tree is safe, and when to remove it.                                  |

## Hooks

`pnpm install` installs Husky. `pre-commit` runs `lint-staged` (ESLint and
Prettier on staged files), `pre-push` runs `pnpm check`. Never pass
`--no-verify`.

## Platform quirks

- Windows, `ERR_SWC_NATIVE_CACHE` on `pnpm dev` or `pnpm build`: set
  `SWC_NATIVE_BINDING_CACHE` to a short folder you own (see README,
  Troubleshooting).
- Files are LF and UTF-8 (`.editorconfig`, `.gitattributes`). Check new files
  for CRLF on Windows before committing.
- `pnpm-lock.yaml` is in `.prettierignore` on purpose. Do not format it.
- `next dev` may re-add the Next.js block in `AGENTS.md`. Commit it rather than
  fighting it.
- Tests use PGlite through `src/test/database.ts`. They need no database and
  must never read `DATABASE_URL`.

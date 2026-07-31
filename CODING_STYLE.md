# Coding style

Binding rules for every change in this repository — human or agent. They describe
what `pnpm check` already enforces plus the conventions the linter cannot see.
When a rule here disagrees with habit, the rule wins. When a rule here disagrees
with a tool config (`eslint.config.mjs`, `.prettierrc.json`, `tsconfig.json`),
the tool config wins and this file must be corrected.

Every change must pass, before review:

```bash
pnpm check && pnpm build
```

`pnpm check` runs typecheck, ESLint (zero warnings), Prettier, Vitest and Knip in
parallel. `pnpm lint:fix` and `pnpm format` fix the mechanical failures.

---

## 1. Language and type safety

1. TypeScript only. No `.js`/`.jsx` source files outside build configuration.
2. `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` are on
   and must stay on. Index access yields `T | undefined` — handle it, do not
   assert it away.
3. **Never** use `any`. Use `unknown` at boundaries and narrow with a type guard
   or a Zod schema.
4. **Never** use `!` non-null assertions or `as` casts to silence the compiler.
   The one accepted exception is a value the code has provably just written and
   the compiler cannot follow (e.g. a map populated in the preceding statement);
   it needs a comment saying why it is safe.
5. **Never** use `@ts-ignore`, `@ts-expect-error`, or `eslint-disable` without a
   comment on the same construct explaining the reason and the removal
   condition. Prefer fixing the code.
6. Annotate the return type of every exported function, including
   `Promise<void>` and `ReactNode`.
7. Prefer `type` over `interface`. Reserve `interface` for declaration merging.
8. Use `const` by default. `let` only for values that are genuinely reassigned.
   Never `var`.
9. Use numeric separators for magnitudes: `10_000`, `5 * 1024 * 1024`,
   `60 * 60 * 1000`. Never a bare `86400000`.
10. Prefer `for…of`, `map`, `filter`, and `Map`/`Set` over index loops. Use an
    index loop only when the index itself is needed.
11. Use modern platform APIs before reaching for a dependency: `URL`,
    `URLSearchParams`, `AbortSignal.timeout`, `structuredClone`,
    `Intl.NumberFormat`, `node:crypto`. A new dependency needs a justification
    in the pull request.

## 2. File and directory naming

| Kind                   | Location                                   | Naming                         | Example                                       |
| ---------------------- | ------------------------------------------ | ------------------------------ | --------------------------------------------- |
| React component        | `src/components/<layer>/<Name>/<Name>.tsx` | `PascalCase` dir **and** file  | `src/components/atoms/Button/Button.tsx`      |
| Component test         | beside its component                       | `<Name>.test.tsx`              | `src/components/atoms/Button/Button.test.tsx` |
| Shared type / contract | `src/core/<domain>/<domain>[.contract].ts` | `camelCase`                    | `src/core/discovery/discovery.contract.ts`    |
| Server-only module     | `src/server/<area>/<module>.ts`            | `camelCase`                    | `src/server/discovery/searxng.ts`             |
| Server action module   | `src/server/actions/<domain>.ts`           | `camelCase`                    | `src/server/actions/collection.ts`            |
| Isomorphic helper      | `src/utils/<name>.ts`                      | `camelCase`                    | `src/utils/ttlCache.ts`                       |
| Unit test              | beside its source file                     | `<name>.test.ts`               | `src/utils/search.test.ts`                    |
| Route / page           | `src/app/**`                               | Next.js reserved names, lower  | `src/app/(app)/share/[userId]/page.tsx`       |
| Migration              | `drizzle/`                                 | generated — never hand-written | `drizzle/0007_flowery_blizzard.sql`           |

Additional rules:

1. `<layer>` is exactly one of `atoms`, `molecules`, `organisms`, `templates`.
   Atomic Design is mandatory: an atom must not import an organism.
2. One component per file, and the file is named after it. A private helper
   component used only by that file may live beside it in the same file.
3. Import components by their full path
   (`@/components/atoms/Button/Button`). No barrel/`index.ts` re-export files
   anywhere except `src/core/index.ts`, which is the single public contract
   barrel and the Knip entry point.
4. Always import through the `@/` alias. Never use a relative parent path
   (`../../`); a sibling `./` import inside a component folder is fine.
5. Directories are `PascalCase` only for component folders; everywhere else use
   `camelCase`. Never `snake_case` or `kebab-case` in `src/`.
6. Tests live next to the code they cover, never in a separate `__tests__` tree.

## 3. Documentation and comments

JSDoc is enforced by `eslint-plugin-jsdoc` at error level. It is not optional.

1. Every exported function, component, class, and method carries a JSDoc block.
2. The first line is a single sentence in the **third person present tense**
   describing what the code does, ending with a period:
   `/** Parses a canonical BoardGameGeek URL into its stable identity. */`
   Not `// parse url`, not "This function will parse…".
3. Keep the summary to one line under 80 characters. Extra context goes in a
   separate paragraph after a blank line — use it to record _why_, invariants,
   and security properties, not to restate the signature.
4. Every parameter needs a `@param name - Description.` entry, and destructured
   props need one entry per property (`@param root0.currency - …`). Every
   function needs `@returns`, including `Promise<void>` ones.
5. Leave exactly one blank line between the summary and the first tag
   (`jsdoc/tag-lines` with `startLines: 1`).
6. Single-line JSDoc (`/** … */`) for exported constants and types is preferred
   over a multi-line block.
7. Descriptions must add information. `@param value - The 'value' value.` is
   noise; write what the value _is_ and what makes it valid.
8. Implementation comments use `//`, sit on their own line **above** the code,
   and explain intent or a non-obvious constraint. Never place a comment at the
   end of a line of code.
9. Never leave commented-out code, `TODO` without an owner, or a comment that
   narrates the obvious.

## 4. Naming inside code

1. `camelCase` for variables, functions, and object properties.
2. `PascalCase` for types, type aliases, React components, and classes.
3. No `SCREAMING_SNAKE_CASE` for module constants; this codebase uses
   `camelCase` (`const maxEntries = 10_000`). Reserve upper case for values
   mirroring an external contract (env var names, SQL identifiers).
4. Booleans read as predicates: `isExpansion`, `hasSearched`, `shareCollection`.
   Never `flag`, `status`, or a negated name like `notReady`.
5. Functions are verb phrases: `parseBoardGameUrl`, `consumeRateLimit`,
   `getSharedCollection`. React hooks start with `use`.
6. Async functions that fetch return the thing, not the act: `getCollection`,
   not `doGetCollection`.
7. No abbreviations beyond established domain terms (`bgg`, `csv`, `url`, `db`).
   Spell out `request`, `response`, `transaction`, `index`, `error`.
8. Unused-by-contract parameters are prefixed with `_` (`_previous`).
9. Named exports everywhere. `export default` is allowed **only** where a
   framework requires it: `page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`,
   `loading.tsx`, `manifest.ts`, and config files.

## 5. Formatting

Prettier owns formatting; never fight it by hand. Settings: 2-space indent,
double quotes, semicolons, trailing commas everywhere, LF endings, UTF-8, final
newline (`.prettierrc.json`, `.editorconfig`).

1. Imports are sorted and grouped by `simple-import-sort` — run `pnpm lint:fix`
   rather than ordering them yourself. Exports are sorted too.
2. `import "server-only";` is the first statement of every server-only module,
   and `"use client"` / `"use server"` is the first line of the file when used.
3. Type-only imports use `import type { … }`.
4. Tailwind class lists are sorted by `prettier-plugin-tailwindcss`. Never
   build a class string by concatenation when `cn()` from `@/utils/cn` will do.
5. Keep lines within Prettier's default print width; break long boolean
   conditions across lines instead of writing a dense one-liner.

## 6. React and Next.js

This project tracks a Next.js version with breaking changes from public
training data. **Read the relevant guide in `node_modules/next/dist/docs/`
before writing routing, caching, or data-fetching code.**

1. Server Components are the default. Add `"use client"` only when the component
   needs state, effects, or browser APIs, and push it as far down the tree as
   possible.
2. Props are destructured in the function signature — enforced by
   `react/destructuring-assignment` with `destructureInSignature: "always"`.
3. Props are declared as a named `type <Name>Props = { … }` above the component,
   with fields in alphabetical order.
4. JSX props are sorted alphabetically (`react/jsx-sort-props`). Self-close
   childless elements.
5. Conditional rendering uses a ternary ending in `: null`. `{cond && <X />}` is
   a lint error (`react/jsx-no-leaked-render`).
6. Never call `setState` synchronously in an effect body. Derive the value
   during render instead.
7. Effects clean up after themselves: clear timers, abort in-flight fetches.
8. Every interactive element has an accessible name, and every icon-only control
   has `aria-label`. Decorative elements get `aria-hidden="true"`. Loading
   regions get `aria-busy` and live regions `aria-live`.
9. `next/image` for artwork, `next/link` for internal navigation. External links
   carry `rel="noreferrer"` (or `noopener noreferrer`) with `target="_blank"`.

## 7. Internationalisation

1. No user-visible string literal in a component or route. Everything goes
   through `next-intl`: `useTranslations()` in client components,
   `getTranslations()` on the server.
2. `messages/en.json` and `messages/it.json` must stay structurally identical
   with identical ICU arguments — `messages/messages.test.ts` fails otherwise.
3. Keys are `camelCase` and grouped by feature namespace (`sharing.copyFailed`).
4. Format numbers, currency, and dates through `useFormatter()` /
   `next-intl`, never with manual string building.

## 8. Data, contracts, and the database

1. Every shared type and Zod schema lives in `src/core/` and is re-exported by
   `src/core/index.ts`. Import them from `@/core`.
2. Files ending in `.contract.ts` hold Zod schemas; plain `.ts` files in
   `src/core/` hold types only. Contracts are framework-free and must import
   nothing from `src/server/`.
3. Validate **all** untrusted input with Zod at the trust boundary: request
   query and body, `FormData`, file uploads, and every third-party HTTP
   response. Parse once, then pass typed values inward.
4. Prefer `safeParse` in request handlers and actions so failures become
   translated messages instead of stack traces. `parse` is acceptable where a
   throw is the intended outcome.
5. Bound everything that crosses a boundary: string `.max()`, numeric ranges,
   array slices, response size caps, and `AbortSignal.timeout` on every
   outbound `fetch`.
6. Drizzle only — no raw SQL strings except through the `sql` template for
   expressions Drizzle cannot express, and never with interpolated user input.
7. Authorization belongs in the same query as the mutation:
   `where(and(eq(table.id, id), eq(table.userId, session.user.id)))`. Never
   fetch-then-check.
8. Enforce invariants in the database as well as in code — `check`, `unique`,
   and foreign-key constraints — so a bug cannot corrupt state.
9. Schema changes are made in `src/server/db/schema.ts` and then generated with
   `pnpm db:generate`. Never hand-write or edit a file under `drizzle/`.

## 9. Server boundaries and security

1. Anything touching the database, secrets, or `env` server keys starts with
   `import "server-only";`.
2. Server actions start with `"use server"`, call `requireUser()` (or
   `requireAdmin`) first, validate input second, and act third.
3. Rate-limit every action reachable by an unauthenticated or cheap-to-repeat
   path with `consumeRateLimit`.
4. Never log or return secrets, tokens, password hashes, or another user's data.
   Error responses are translated and generic; details go to `log()`.
5. Redact at the source. When data must not be shared, strip it in the query or
   the server module — never merely hide it in the UI.
6. Treat every external URL as hostile: parse with `URL`, allowlist the
   protocol and host, and rebuild the canonical URL from validated parts rather
   than passing the input through.
7. Write an audit event with `writeAuditEvent` for administrative and
   privacy-affecting changes.
8. Any new outbound host must be added to the CSP in `src/proxy.ts`, and any new
   authenticated route prefix to `protectedPrefixes`.
9. Secrets come from `src/env.ts` only. Never read `process.env` directly in
   application code, and never commit an environment file.

## 10. Tests

1. Vitest, colocated, named `<source>.test.ts(x)`.
2. Every non-trivial pure function (parser, validator, money or security path)
   gets at least one test. Trivial one-liners do not.
3. Test names read as behaviour: `it("rejects a spoofed BGG hostname")`.
4. Cover the failure and abuse cases, not just the happy path — that is the
   point of the test.
5. Component tests use Testing Library and query by accessible role or label,
   never by class name or test id.
6. No network in tests. Stub the boundary.

## 11. Errors and logging

1. Catch narrowly. An empty `catch {}` needs a comment explaining why the
   failure is safe to swallow.
2. Optional enrichment fails soft (`.catch(() => fallback)`); anything the user
   asked for fails loud with a translated message.
3. Log through `@/utils/logger`'s `log(level, event, context)`. `event` is a
   `snake_case` identifier (`game_discovery_failed`). Never `console.log`.
4. Never surface a raw upstream error message to the client.

## 12. Dependencies and dead code

1. Knip runs in `pnpm check`: unused files, exports, and dependencies fail the
   build. Delete rather than keep "for later".
2. Prefer deletion to addition. Prefer the standard library to a dependency, and
   an installed dependency to a new one.
3. Lockfile changes are part of the diff and must be reviewed.
4. `pnpm audit --audit-level=moderate` must pass. An `ignoreGhsas` entry in
   `pnpm-workspace.yaml` requires a comment stating the advisory, why the
   installed tree is not exploitable, and the condition for removing it.

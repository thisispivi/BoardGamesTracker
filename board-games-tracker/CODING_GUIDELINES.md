# Coding Guidelines

This is the canonical standard for every change in this repository, whether it
is written by a human or an agent. `AGENTS.md`, `CLAUDE.md`, and
`.github/copilot-instructions.md` are adapters that point here; shared rules
belong only in this file.

Rules use **MUST** for requirements, **SHOULD** for the project default, and
**MAY** for context-dependent choices. Existing violations are not precedent.
When this document and an executable configuration disagree, the configuration
wins for the current run and this document MUST be corrected in the same change.

The application uses the Next.js App Router, React Server Components,
TypeScript, Tailwind CSS, `next-intl`, Better Auth, Drizzle ORM, PostgreSQL,
Zod, Vitest, ESLint, Prettier, and pnpm. It lives in `board-games-tracker/`, and
every path and command in this document is relative to that folder. Its main
boundaries are:

```text
src/app/          Routes, layouts, metadata, and HTTP handlers
src/components/   Atomic Design UI: atoms -> molecules -> organisms -> templates
src/client/       Browser-only authentication and persistence adapters
src/core/         Framework-free shared types and validation contracts
src/hooks/        Client-only React hooks shared by more than one component
src/i18n/         Locale list, request configuration, and taxonomy data
src/server/       Authentication, persistence, actions, and external services
src/test/         Vitest setup shared by every suite
src/utils/        Isomorphic helpers with a single named responsibility
messages/         Structurally identical English and Italian message catalogs
drizzle/          Generated migrations and snapshots
scripts/          Repository operations and maintenance commands
```

Every change must pass, before review:

```bash
pnpm check && pnpm test:coverage && pnpm build && pnpm audit --audit-level=moderate
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

Rules 1 and 4 are enforced by `no-restricted-imports` in `eslint.config.mjs`,
along with the bans on `src/core` importing `src/server` or `src/utils`. Extend
that config rather than this list when a new boundary needs protecting.

### Where a new feature goes

Work outwards from the data. A feature usually touches several of these, in
this order:

| You are adding                                     | It goes in                                                 |
| -------------------------------------------------- | ---------------------------------------------------------- |
| A column, constraint, or index                     | `src/server/db/schema.ts`, then `pnpm db:generate`         |
| A type or Zod schema more than one layer reads     | `src/core/<domain>/`, re-exported from `src/core/index.ts` |
| A query, or anything touching the database         | `src/server/<area>/`                                       |
| A mutation a form submits                          | `src/server/actions/<domain>.ts`                           |
| A JSON endpoint, upload, or download               | `src/app/api/<name>/route.ts`                              |
| A page, and the data it loads                      | `src/app/(app)/<route>/page.tsx`                           |
| A reusable pure function with no React and no `db` | `src/utils/<name>.ts`                                      |
| A React hook used by more than one component       | `src/hooks/use<Name>.ts`                                   |
| UI                                                 | `src/components/<layer>/<Name>/<Name>.tsx`                 |
| User-visible copy                                  | `messages/en.json` **and** `messages/it.json`              |

Dependencies point one way: `app` → `components` → `utils` → `core`, and `app`
→ `server` → `core`. Components may call server actions and browser adapters in
`client`. Only colocated route tests may import `app`. `core` is the innermost
layer: it contains no React or Next.js runtime dependencies and imports nothing
from `server` or `utils`, so a constant both a contract and a helper need lives
in `core`. `utils` holds isomorphic helpers only — a file there that reaches for
the database, `env`, or React is in the wrong place, and a file named for a grab
bag (`helpers.ts`, `misc.ts`) does not belong there at all.

Reach for a shared abstraction when two call sites express the _same_ rule, not
when they merely look alike. Two similar-looking validations of different
domain concepts stay separate.

## 3. Documentation and comments

JSDoc is enforced by `eslint-plugin-jsdoc` at error level. It is part of the
public contract, not filler added to satisfy lint.

1. Every named function, React component, class, constructor, method, type alias,
   interface, and enum MUST carry a JSDoc block, whether exported or private.
   Exported constants need JSDoc as well. Inline anonymous callbacks are the
   only function exception. Named functions use declarations rather than arrows
   so the rule is mechanically enforceable.
2. The summary MUST be a useful sentence in the **third person present tense**,
   end with a period, and describe observable behavior:
   `/** Parses a canonical BoardGameGeek URL into its stable identity. */`
   Do not write "This function will…" or merely turn the symbol name into prose.
3. A simple constant or type uses one-line JSDoc. A function uses a multiline
   block with `/**` and `*/` on their own lines. Put exactly one blank line
   between its description and its tags.
4. Every parameter needs `@param name - Description.`. Destructured props use
   one entry for the object and one per property (`root0.currency`). Every
   non-constructor function needs `@returns`, including functions returning
   `void` or `Promise<void>`.
5. Descriptions MUST add information that is absent from the TypeScript type.
   Banned filler includes "The documented function result", "Component or
   function properties", "The 'value' value", and "The 'x' property".
6. Document boundaries, units, validity, fallback behavior, authorization, and
   security properties where relevant. Do not repeat implementation steps.
7. Human-authored `//` prose comments are forbidden in application and test
   code. Tooling directives such as `@ts-expect-error`, ESLint directives, and
   TypeScript triple-slash references are allowed only when the tool requires
   that syntax and the directive includes its reason and removal condition.
8. Do not leave trailing comments, commented-out code, AI narration, TODOs,
   FIXMEs, or speculative notes. Make intent visible through names, extracted
   functions, tests, and a useful JSDoc contract on the declaration that owns
   the constraint.

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
   Operations involving several accounts must lock the relevant rows and
   recheck authorization inside the transaction. User imports may create missing
   catalog games, but only administrator actions may change existing metadata.
8. Enforce invariants in the database as well as in code — `check`, `unique`,
   and foreign-key constraints — so a bug cannot corrupt state.
9. Schema changes are made in `src/server/db/schema.ts` and then generated with
   `pnpm db:generate`. Never hand-write or edit a file under `drizzle/`.
10. `await response.json()` returns `unknown`. Never cast it — parse it with the
    route's schema from `src/core/api/api.contract.ts`. That applies to this
    application's own routes too: the browser is a separate process, so a
    response is a runtime value, not a compile-time guarantee.
11. When a Zod schema is the runtime contract, it owns the type: put it in a
    `.contract.ts` and export `z.infer` beside it. Do not restate the same
    shape as a hand-written `type`, where the two can drift apart.
12. One concept, one schema. Import or compose the schema that owns a shape
    instead of writing a second one; two rules that only look alike stay
    separate.
13. Bounds that several domains share live once, in
    `src/core/shared/shared.contract.ts`: the BoardGameGeek identifier, game
    title, publication year, purchase price, artwork URL, taxonomy label, and
    the `true`/`false` text that forms, spreadsheet cells, and environment
    variables carry. `emptyAsNull` reads a blank form field as null, and
    `refineGameRanges` rejects a player or duration range whose maximum is
    below its minimum. Reuse these before writing a bound inline, and add a new
    primitive there only when a second domain needs the same rule.
14. A `.refine` callback runs even when an earlier check in the chain failed,
    so it must not throw on malformed input. Parse with `URL.parse` or another
    non-throwing call and return false instead.
15. Validation proves a payload is well-formed, not that the caller may use it.
    A parsed request still goes through the authorization in rule 7.

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
7. Persistence tests use `src/test/database.ts` to apply production migrations
   to an isolated PGlite PostgreSQL runtime. They must never use `DATABASE_URL`.
   PGlite verifies SQL and transaction behavior, but does not replace deployment
   tests of multiple PostgreSQL connections or independent application instances.

## 11. Errors and logging

1. Catch narrowly. Empty catch blocks are forbidden; make the fallback or
   control flow explicit.
2. Optional enrichment fails soft (`.catch(() => fallback)`); anything the user
   asked for fails loud with a translated message.
3. Log through `@/server/logger`'s `log(level, event, context)`. `event` is a
   `snake_case` identifier (`game_discovery_failed`). Never `console.log`.
4. Never surface a raw upstream error message to the client.
5. Every promise is awaited, returned, or explicitly discarded with `void`.
   `no-floating-promises` and `no-misused-promises` are type-aware and run over
   `src`, so an unawaited request cannot slip into review.
6. A handler that talks to the network handles its own failure: clear the
   pending state in `finally` and tell the user what happened. Attach it to JSX
   through a synchronous wrapper (`onSubmit={(event) => void submit(event)}`)
   so a rejection can never escape as an unhandled rejection.

## 12. Dependencies and dead code

1. Knip runs in `pnpm check`: unused files, exports, and dependencies fail the
   build. Delete dead code instead of retaining it "for later".
2. Use Depcheck as a corroborating audit, not as the source of truth. It cannot
   understand every PostCSS, Tailwind, CLI, or framework configuration; verify
   each report against package scripts and configuration before removing it.
3. Prefer deletion to addition, the platform to a package, and an existing
   package to a second tool with overlapping responsibility.
4. Keep dependencies on the newest release compatible with the supported Node,
   Next.js, ESLint, and TypeScript stack. Do not force a major version through
   unmet peer ranges. Record the reason when an apparently newer major is held.
5. Lockfile changes are part of the diff and MUST be reviewed. Never mix npm or
   Yarn lockfiles into this pnpm repository. `pnpm-lock.yaml` is generated, so
   `.prettierignore` skips it: pnpm and Dependabot write it in their own quote
   style, and formatting it would fail every automated dependency update.
6. `pnpm audit --audit-level=moderate` must pass. An `ignoreGhsas` entry in
   `pnpm-workspace.yaml` requires a nearby explanation of the advisory, why the
   installed tree is safe, and the condition for removing the exception.

## 13. Definition of done

Before review, confirm all of the following:

- New code lives in the owning layer and respects the dependency direction.
- Public input is bounded and validated once at its trust boundary.
- Authorization is enforced in the mutation query, not after data is loaded.
- User-visible copy is translated in both message catalogs.
- Interactive UI has keyboard support, an accessible name, and visible focus.
- Named functions and exported declarations have informative JSDoc with no
  placeholder descriptions or prose line comments.
- New behavior and non-trivial failure paths have colocated tests.
- `pnpm check`, `pnpm test:coverage`, `pnpm build`, and
  `pnpm audit --audit-level=moderate` pass.

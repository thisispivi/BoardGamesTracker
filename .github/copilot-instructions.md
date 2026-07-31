# GitHub Copilot instructions

Follow [`CODING_STYLE.md`](../CODING_STYLE.md) in the repository root. It is the
authoritative style guide for this project — read it before proposing code and
apply it to every suggestion. `AGENTS.md` adds framework-specific warnings.

Non-negotiables, repeated here because they are the ones most often missed:

- **This is not the Next.js you know.** Read the relevant guide in
  `node_modules/next/dist/docs/` before writing routing, caching, or
  data-fetching code; APIs differ from public training data.
- Every exported function, component, and class needs a JSDoc block: a
  one-sentence third-person summary, a `@param` per parameter (including one per
  destructured prop, `@param root0.x`), a `@returns`, and one blank line before
  the first tag.
- Components live at `src/components/<atoms|molecules|organisms|templates>/<Name>/<Name>.tsx`;
  tests sit beside their source as `<name>.test.ts(x)`. Import via the `@/`
  alias, never a relative parent path.
- No `any`, no `!` assertions, no `as` casts to silence the compiler, no
  `eslint-disable` without a justifying comment.
- Conditional JSX uses a ternary ending in `: null`, never `&&`. JSX props and
  imports are sorted; run `pnpm lint:fix` and `pnpm format`.
- No user-visible string literals — everything goes through `next-intl`, and
  `messages/en.json` and `messages/it.json` must stay in sync.
- Validate untrusted input with a Zod contract from `src/core/`, and put the
  authorization predicate in the same query as the mutation.
- Server-only modules start with `import "server-only";`; secrets come from
  `src/env.ts`, never `process.env`.

Every change must pass `pnpm check` and `pnpm build`.

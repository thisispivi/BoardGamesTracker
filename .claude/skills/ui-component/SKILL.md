---
name: ui-component
description: Adds or changes a React component or user-visible copy. Use for anything under src/components/, new pages in src/app/, or edits to messages/en.json and messages/it.json.
---

# UI component and copy

Paths are relative to `board-games-tracker/`.

## Steps

1. Pick the Atomic Design layer: `atoms`, `molecules`, `organisms` or
   `templates`. A lower layer never imports a higher one (ESLint
   `no-restricted-imports` enforces it).
2. Create `src/components/<layer>/<Name>/<Name>.tsx` with a test beside it,
   `<Name>.test.tsx`. One component per file, named export, no `index.ts`.
3. Import through `@/` with the full path
   (`@/components/atoms/Button/Button`). No `../`.
4. Server Component by default. Add `"use client"` only for state, effects or
   browser APIs, as low in the tree as possible.
5. Props: `type <Name>Props = { … }` above the component, fields sorted
   alphabetically, destructured in the signature. JSX props sorted.
6. Conditional rendering: `cond ? <X /> : null`, never `cond && <X />`.
7. Classes: `cn()` from `@/utils/cn`, never string concatenation.
8. Copy: no string literals in JSX. Add keys to `messages/en.json` and
   `messages/it.json` under a camelCase feature namespace, with the same
   structure and ICU arguments. Use `useTranslations()` in client components,
   `getTranslations()` on the server, and `useFormatter()` for numbers, money
   and dates.
9. Accessibility: every control has an accessible name, icon-only buttons have
   `aria-label`, decorative elements `aria-hidden="true"`, loading regions
   `aria-busy`, visible focus and keyboard support.
10. `next/image` for artwork, `next/link` for internal links. External links
    with `target="_blank"` carry `rel="noreferrer"`.
11. Tests use Testing Library and query by role or label, never by class or
    test id.
12. Run the `check` skill. If the demo renders the component, also run
    `pnpm demo:build`.

## Hard rules

- JSDoc on the component and its props type. No `//` comments.
- Never call `setState` synchronously in an effect. Effects clean up timers
  and abort fetches.
- Do not hide private data in the UI only. Strip it on the server.

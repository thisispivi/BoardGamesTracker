---
name: server-action
description: Adds or changes a server action that a form or client component calls. Use for any new mutation in src/server/actions/ or any change to an existing action's validation, authorization or side effects.
---

# Server action

Paths are relative to `board-games-tracker/`.

## Steps

1. Put the action in `src/server/actions/<domain>.ts`. The file starts with
   `"use server";`.
2. Order inside the function is fixed: authenticate, validate, act.
   - `const session = await requireUser();` (or `requireAdmin()`) from
     `@/server/session`. Only an action that is public by design
     (`setLocaleAction`, `resetPasswordAction`) skips this, and it must be
     rate-limited.
   - Parse input with a schema from `@/core`. Prefer `safeParse` and return a
     result the UI can translate; `parse` is fine only where a throw is the
     intended outcome.
   - Act with one query that also checks ownership:
     `where(and(eq(table.id, id), eq(table.userId, session.user.id)))`.
     Operations across several accounts lock the rows and recheck
     authorization inside the transaction.
3. Rate-limit anything cheap to repeat or reachable without an account with
   `consumeRateLimit(key, limit, windowMs)` from `@/server/security/rateLimit`.
   Write windows with separators (`10 * 60_000`).
4. Administrative or privacy-affecting changes call `writeAuditEvent` from
   `@/server/audit`.
5. Refresh caches with the helper that fits: `revalidateLibraryRoutes`,
   `revalidateAccountRoutes` or `revalidateSharedGameRoutes` from
   `@/server/revalidate`.
6. Log failures with `log(level, "snake_case_event", context)` from
   `@/server/logger`. Never `console.log`, never log secrets or another user's
   data.
7. Every message the user sees goes in `messages/en.json` and
   `messages/it.json` with the same keys and ICU arguments.
8. Test it in `src/server/actions/<domain>.test.ts`. Follow
   `src/server/actions/preferences.test.ts`: `vi.hoisted` mocks for
   `requireUser`, the PGlite `testDb` from `@/test/database`, and mocks for
   `@/server/audit` and `@/server/revalidate`. Cover the rejected cases:
   invalid input, another user's row, rate limit hit.
9. In the client, attach the handler through a synchronous wrapper
   (`onSubmit={(event) => void submit(event)}`) and clear pending state in
   `finally`.
10. Run the `check` skill.

## Hard rules

- JSDoc on the action: third-person summary, `@param`, `@returns`.
- No `//` comments in application or test code.
- User imports may create missing catalog games only from BoardGameGeek
  metadata; only admin actions may change existing game metadata.

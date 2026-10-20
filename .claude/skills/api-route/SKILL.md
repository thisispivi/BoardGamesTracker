---
name: api-route
description: Adds or changes a JSON endpoint, upload or download under src/app/api/, or any server code that calls a new external host. Use when a route handler, its response contract, the CSP or the protected route list changes.
---

# API route

Paths are relative to `board-games-tracker/`.

## Steps

1. Create `src/app/api/<name>/route.ts` exporting `GET`/`POST` with an
   annotated return type (`Promise<Response>` or `Promise<NextResponse>`). Read the route handler guide in
   `node_modules/next/dist/docs/` first: this Next.js differs from older
   versions.
2. Authenticate with `getSession()` from `@/server/session` and return `401`
   without one. State-changing requests check `hasTrustedOrigin(request)` from
   `@/server/security/origin`.
3. Rate-limit with `consumeRateLimit` from `@/server/security/rateLimit`.
4. Validate query and body with Zod. Bound everything: string `.max()`,
   numeric ranges, array slices. Read uploads with `readBoundedBody` from
   `@/utils/readBoundedBody` and a byte cap such as `10 * 1024 * 1024`.
5. Define the response schema in `src/core/api/api.contract.ts` (see
   `libraryPageResponseSchema`, `userDataImportResponseSchema`). The browser
   parses `await response.json()` with that schema. Never cast it.
6. Error bodies are generic: a fixed code (`{ error: "unauthorized" }`) or a
   translated message. Details go to `log()`. Never return an upstream error
   message.
7. Calling a third-party host:
   - every `fetch` has `signal: AbortSignal.timeout(...)` and a size cap;
   - parse the URL with `URL`, allowlist protocol and host, rebuild it from the
     validated parts;
   - validate the response with Zod;
   - add the host to the CSP in `src/proxy.ts` if the browser loads from it
     (`img-src`, `connect-src`).
8. A new authenticated page prefix goes in `protectedPrefixes` in
   `src/proxy.ts`.
9. Test in a colocated `route.test.ts` (see `src/app/api/user-data/route.test.ts`).
   Stub the network. Cover 401, invalid input, oversize body and rate limit.
10. Run the `check` skill.

## Hard rules

- `import "server-only";` first in any module that touches the database,
  secrets or server `env` keys.
- Secrets come from `env` in `src/env.ts`, never `process.env`.
- Audit admin and privacy-affecting changes with `writeAuditEvent`.

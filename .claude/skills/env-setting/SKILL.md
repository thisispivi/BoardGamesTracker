---
name: env-setting
description: Adds, renames, removes or changes the default of an environment variable. Use whenever src/env.ts, .env.example, docker-compose.yml or the settings tables in DEPLOYMENT.md would change.
---

# Environment setting

Paths are relative to `board-games-tracker/` unless they start with `../`.

A runtime setting the app reads lives in the five places below. Change all of
them in the same commit. Two other kinds differ:

- Compose-only settings (`APP_PORT`, `APP_BIND_ADDRESS`, `BACKUP_*`,
  `POSTGRES_*`) skip step 1 and go only in `.env.example`,
  `docker-compose.yml` and `../DEPLOYMENT.md`.
- Build-time settings read by `next.config.ts` (`SENTRY_*`,
  `NEXT_PUBLIC_*`) also need an `ARG`/`ENV` pair in `Dockerfile` and an entry
  under the `app` service's `build.args` in `docker-compose.yml`.

1. `src/env.ts`: add the key to `server` (or `client`, for `NEXT_PUBLIC_*`)
   with a bounded Zod schema and its default, and add the same key to
   `runtimeEnv`. Reuse `booleanStringSchema`, `httpEndpointSchema`,
   `appOriginSchema` or `databaseUrlSchema` from `@/core` before writing a new
   one. Empty strings are read as unset (`emptyStringAsUndefined: true`).
2. `.env.example`: the key, a safe example value and a one-line comment.
   Never a real secret.
3. `docker-compose.yml`: pass it to the `app` service as
   `KEY: ${KEY:-default}` with the same default as `src/env.ts`, or
   `${KEY:?message}` when it is required.
4. `../DEPLOYMENT.md`: the row in the matching settings table, with the same
   name, and the same default where the table has a Default column.
5. CI: if `pnpm build` needs it, add a placeholder to the `env:` blocks in
   `../.github/workflows/ci.yml`.

Then read it through `env.KEY` and run the `check` skill.

## Hard rules

- Never read `process.env` in application code; `src/env.ts` is the reader.
  The exceptions are listed in `CODING_GUIDELINES.md` rule 9.9.
- Server secrets never get a `NEXT_PUBLIC_` prefix.
- Never log or return a secret.
- Never open, print or commit `.env` or `.env.local`.

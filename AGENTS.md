# Repository instructions

Before writing, reviewing, or suggesting code, read
[`CODING_GUIDELINES.md`](CODING_GUIDELINES.md) completely and follow it as the
authoritative repository standard. Apply it to every file in the scope of the
change, including tests, scripts, documentation, and configuration.

This installed Next.js version may differ from prior knowledge. Read the
relevant guide in `node_modules/next/dist/docs/` before changing framework APIs,
routing, caching, data fetching, rendering, or configuration. Follow bundled
deprecation notices.

Do not finish a change until `pnpm check`, `pnpm build`, and
`pnpm audit --audit-level=moderate` pass.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Coding style

Read [`CODING_STYLE.md`](CODING_STYLE.md) before writing or reviewing code in
this repository. It is the authoritative guide and covers naming, file layout,
mandatory JSDoc, typing rules, i18n, data contracts, security boundaries, and
tests. Follow it exactly; where it disagrees with your defaults, it wins.

Every change must pass `pnpm check` and `pnpm build`.

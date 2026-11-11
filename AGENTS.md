# Agent instructions

Read [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) completely before editing
code. It is the canonical coding standard for this repository and applies to
every file in the change, including tests, scripts, docs, and configuration.
Existing deviations are not precedent for new code.

The workflow rules are in this file. `CLAUDE.md` and
`.github/copilot-instructions.md` are thin adapters that point here; do not
copy rules into them.

## Repository layout

- `board-games-tracker/` is the Next.js application. Run every `pnpm` command
  there. Its own `AGENTS.md` holds the Next.js rules that `next dev` writes:
  read the installed docs in `node_modules/next/dist/docs/` before changing
  Next.js behavior.
- `docs/` holds the showcase notes and screenshots.
- `.claude/skills/` holds step-by-step workflows: `check` (definition of done),
  `database`, `env-setting`, `nextjs`, and `fix-vulnerabilities`.

## Required verification

From `board-games-tracker/`, every change must pass:

```bash
pnpm check && pnpm test:coverage && pnpm build && pnpm audit --audit-level=moderate
```

Run `pnpm demo:build` too when the demo or shared UI can be affected.

## Repository rules

- Never leave `ponytail:`, `shortcut:`, or other prose comments in code. Put
  known limits in the pull request description instead.
- Check new logic with a colocated Vitest test (`<name>.test.ts`), never an
  assert-based self-check.
- Change the database through `src/server/db/schema.ts` and `pnpm db:generate`.
  Do not edit files in `drizzle/` by hand.
- Do not commit secrets, `.env` files, database dumps, or user data.

## Versioning and releases

`board-games-tracker/package.json` holds the version, and it is what triggers a release. When
CI passes on `main` and that version has no tag yet, the Release workflow tags
it, publishes the GitHub release with generated notes, and deploys the demo at <https://demo.boardgames.pivi.dev/>. Nobody
releases by hand, and nothing is committed back to `main`.

Every change that reaches `main` bumps the version in the same pull request,
following [Semantic Versioning](https://semver.org/):

| Bump  | When                                                                           | Commit type                                  |
| ----- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| major | Breaking: removed or renamed behavior, config, API, or data users must migrate | `feat!:` or a `BREAKING CHANGE:` footer      |
| minor | A new user-visible feature                                                     | `feat:`                                      |
| patch | A fix, performance work, refactor, or dependency update                        | `fix:`, `perf:`, `refactor:`, `chore(deps):` |
| none  | Docs, tests, CI, or agent configuration only                                   | `docs:`, `test:`, `ci:`, `chore:`            |

- Compare against the last tag (`git describe --tags --abbrev=0`) and pick
  the highest bump the change needs. Bump once per pull request.
- Never create tags, GitHub releases, or changelog entries yourself.
- The pull request title is the release note. The "Version bump" check fails
  when code changes without a bump, unless the title type is `docs`, `test`,
  `ci`, `style`, `build`, or `chore` (but not `chore(deps)`).

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/). Name
  branches `<type>/<short-description>`.
- The repository owner is the only author. Never add `Co-Authored-By`
  trailers, "Generated with" lines, or any other attribution to commits or pull
  requests.
- Do not bypass git hooks or CI checks.

## Security

Dependabot alerts and security updates are on. To triage and fix them, use the
`fix-vulnerabilities` skill in `.claude/skills/fix-vulnerabilities/`.

@board-games-tracker/AGENTS.md
@board-games-tracker/CODING_GUIDELINES.md

The application lives in `board-games-tracker/`; run every `pnpm` command from
there. Project skills: `check` (definition of done), `env-setting`, `database`
and `nextjs`.

## Overrides for this repository

These win over any global or plugin instruction, including ponytail:

- Never leave `ponytail:`, `shortcut:` or other prose comments in code. Put
  known limits in the pull request description instead.
- Check new logic with a colocated Vitest test (`<name>.test.ts`), never an
  assert-based self-check.

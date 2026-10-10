# Showcase and screenshots

The [public demo](https://demo.boardgames.pivi.dev/) is an isolated
static Next.js export built from the application's UI components. Alex Morgan
is a fictional account with 18 base games, two expansions, and six wishlist
games. Purchase prices, favorites, ratings, played status, and dates are example
data, not somebody's collection.

Visitors can browse every demo page, search, filter, sort, switch languages and
themes, inspect charts, and use the animated game-night picker. Sign-in, account
settings, imports, discovery, and changes to the library require the self-hosted
application and are omitted from the demo. There is no database, public password,
API service, or production authentication bypass in the export.

## Build and preview

Run from `board-games-tracker/`:

```bash
pnpm demo:dev
```

Open <http://localhost:12501>. To build for GitHub Pages:

```bash
pnpm demo:build
```

The demo is served from the root of its custom domain, so no base path is
needed. To host it under a subpath instead, set `DEMO_BASE_PATH` (for example
`/BoardGamesTracker`) before building. Static files are written to `board-games-tracker/demo/out/`.
Only that directory is uploaded by the deployment job. Every push to `main`
deploys after the quality gate; pull requests validate the demo without publishing.
GitHub Pages must use **GitHub Actions** as its publishing source, with
`demo.boardgames.pivi.dev` as its custom domain (a DNS `CNAME` record pointing to
`thisispivi.github.io`). No `gh-pages` branch is needed.

## Reproduce the README screenshots

The six README images are real 1920×1080 viewport captures of the authenticated
application, using the same fictional library. They are not generated mockups.
Use a new, empty local PostgreSQL database named `board_games_tracker_demo`.
The seed command rejects remote hosts and other database names, applies the
production migrations, and never reads `.env.local`.

```powershell
$env:DEMO_DATABASE_URL = 'postgresql://showcase:local-only-password@127.0.0.1:15432/board_games_tracker_demo'
$env:DEMO_PASSWORD = 'choose-a-local-only-demo-password'
pnpm demo:seed

$env:DATABASE_URL = $env:DEMO_DATABASE_URL
$env:BETTER_AUTH_SECRET = 'choose-a-local-secret-with-at-least-32-characters'
$env:BETTER_AUTH_URL = 'http://localhost:12502'
$env:NEXT_PUBLIC_APP_URL = 'http://localhost:12502'
$env:SEARXNG_URL = 'http://localhost:18080'
$env:NEXT_PUBLIC_SENTRY_DSN = ''
$env:SENTRY_DSN = ''
$env:SMTP_HOST = ''
pnpm exec next dev --port 12502
```

Sign in as `alex@example.invalid` using the password set above. Choose English,
use a 1920×1080 viewport, hide the development overlay, and capture Home,
Collection, Wishlist, Pick a game after a spin, Stats, and Collection in dark
mode. Save JPEGs under `docs/screenshots/`. A browser that excludes the scrollbar
from its default screenshot needs an explicit 1920×1080 capture rectangle.
Verify image dimensions before committing. No real account or private library
should appear in the screenshots.

## Example game artwork

`board-games-tracker/src/core/demo/library.json` contains public game metadata
retrieved from BoardGameGeek on 6 October 2026. The bundled JPEGs under
`board-games-tracker/public/demo/games/` are the corresponding box-cover
thumbnails, used solely to illustrate the collection. Original artwork and
trademarks remain the property of their respective owners; the repository's MIT
license does not grant rights to those images. Each demo cover links to its
BoardGameGeek entry. The project is independent of BoardGameGeek and the game
publishers.

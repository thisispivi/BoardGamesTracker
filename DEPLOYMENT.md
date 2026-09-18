# Deployment

How to run Board Games Tracker in production, keep it backed up, upgrade it,
and configure it. The quick start for a first install is in the
[README](./README.md#docker). Run every `docker compose` command below from
`board-games-tracker/`.

## Production checklist

- Put the application behind an HTTPS reverse proxy and set `APP_URL` to the
  public origin.
- Generate unique secrets for PostgreSQL, Better Auth, and SearXNG.
- Keep PostgreSQL and SearXNG on the private Compose network.
- Keep the `backup` service running and copy its dumps off the host.
- Configure Sentry-compatible monitoring only if you want it.
- Configure transactional SMTP before enabling public registration.

The application container runs pending migrations before starting the
production server. Review generated migrations and take a database backup
before every upgrade. [SECURITY.md](./SECURITY.md) has the operator checklist
for hardening the deployment.

## Backups

The `backup` service dumps the database into `board-games-tracker/backups` once
a week and keeps the eight newest dumps, about two months of history. Old dumps
are only removed after a new one succeeds. Change the schedule with
`BACKUP_INTERVAL_DAYS`, `BACKUP_KEEP`, and `BACKUP_DIRECTORY` in `.env`.

Dumps contain account emails and password hashes, so they are readable only by
their owner. Copy them to another machine too: a backup on the same disk does
not survive losing that disk.

Write a dump right now:

```bash
docker compose exec backup sh /usr/local/bin/backup-database.sh --once
```

## Upgrades

Take a fresh backup, then rebuild:

```bash
docker compose pull && docker compose up --build -d
```

If you expect to rebuild often, set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` to a
value from `openssl rand -base64 32` before the first build and keep it.
Next.js derives Server Action identifiers from that key and generates a new
one per build, so without it every rebuild breaks the pages visitors already
have open.

### Moving an existing deployment to the application folder

Earlier versions kept `docker-compose.yml` at the repository root. Compose names
containers after the folder that holds that file, so stop the old stack before
pulling this layout, then start it again from `board-games-tracker/`. The
database volume has a fixed name, so its data carries over.

1. From the repository root, before pulling:

   ```bash
   docker compose down
   ```

2. Pull the new layout and move your settings and backups next to Compose:

   ```bash
   git pull
   mv .env board-games-tracker/.env
   mv backups board-games-tracker/backups
   ```

3. Start the stack again:

   ```bash
   cd board-games-tracker && docker compose up --build -d
   ```

## Restoring a backup

Stop the application, restore a dump over the current database, and start the
application again:

```bash
docker compose stop app
```

```bash
docker compose exec -T database pg_restore --clean --if-exists --no-owner -U board_games_tracker -d board_games_tracker < backups/board-games-tracker-20260911T020000Z.dump
```

```bash
docker compose start app
```

## Configuration

[`.env.example`](./board-games-tracker/.env.example) documents every supported
setting. The application variables that matter most:

| Variable                             | Required | Purpose                                                                    |
| ------------------------------------ | -------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`                       | Yes      | PostgreSQL connection string                                               |
| `BETTER_AUTH_SECRET`                 | Yes      | Authentication signing secret with at least 32 characters                  |
| `BETTER_AUTH_URL`                    | Yes      | Canonical application origin for local or non-Compose runs                 |
| `NEXT_PUBLIC_APP_URL`                | Yes      | Public application origin exposed to the browser                           |
| `SEARXNG_URL`                        | Yes      | Server-side SearXNG endpoint                                               |
| `ADMIN_EMAIL`                        | No       | Additional email address eligible for administrator bootstrap              |
| `ALLOW_SIGN_UP`                      | No       | Enables registration when set to `true`                                    |
| `HEALTH_CHECK_TOKEN`                 | No       | Requires a bearer token on `/api/health`                                   |
| `LOG_LEVEL`                          | No       | Server log verbosity                                                       |
| `SENTRY_DSN`                         | No       | Server-side Sentry-compatible error reporting                              |
| `NEXT_PUBLIC_SENTRY_DSN`             | No       | Browser-side Sentry-compatible error reporting                             |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT`     | No       | Monitoring environment name                                                |
| `NEXT_PUBLIC_SENTRY_RELEASE`         | No       | Monitoring release identifier; defaults to the `package.json` version      |
| `SENTRY_AUTH_TOKEN_FILE`             | No       | File containing the source-map upload token                                |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | No       | Build-time key that keeps Server Action identifiers stable across rebuilds |
| `SMTP_HOST`                          | No       | Transactional SMTP server; enables email flows with `SMTP_FROM_EMAIL`      |
| `SMTP_PORT`                          | No       | SMTP port, normally `465` or `587`                                         |
| `SMTP_SECURE`                        | No       | Uses implicit TLS; set to `true` for port `465`                            |
| `SMTP_REQUIRE_TLS`                   | No       | Requires STARTTLS when implicit TLS is disabled                            |
| `SMTP_USER`                          | No       | SMTP username; must be paired with `SMTP_PASSWORD`                         |
| `SMTP_PASSWORD`                      | No       | SMTP password or provider API credential                                   |
| `SMTP_FROM_NAME`                     | No       | Display name used for transactional messages                               |
| `SMTP_FROM_EMAIL`                    | No       | Verified sender address; enables email flows with `SMTP_HOST`              |
| `SMTP_REPLY_TO`                      | No       | Optional monitored reply address                                           |

Compose deployments use `APP_URL` for the public origin and derive the internal
database and SearXNG addresses automatically. Application URLs must be HTTP(S)
origins without paths, credentials, queries, or fragments.

### Transactional email

Set both `SMTP_HOST` and `SMTP_FROM_EMAIL` to enable email verification and
self-service password recovery. Port `465` normally uses `SMTP_SECURE=true`;
port `587` uses `SMTP_SECURE=false` and `SMTP_REQUIRE_TLS=true`. Credentials are
optional only for SMTP relays that explicitly allow unauthenticated delivery.

For reliable production delivery, verify the sender domain with your email
provider and publish its SPF, DKIM, and DMARC records. Use a dedicated
transactional sender, keep `SMTP_REPLY_TO` monitored if replies should reach a
person, and rotate SMTP credentials as you would any production secret. The
application sends multipart English or Italian messages through a pooled TLS
connection and does not log recipient addresses or action links.

### Error monitoring

Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` to report errors to a
Sentry-compatible service such as a self-hosted Bugsink instance. Every build
reports the `version` field of `board-games-tracker/package.json` as its
release, so an issue names the version it came from. Source-map upload is a
build-time option; see the `SENTRY_*` entries in `.env.example`. Check the
connection from a machine holding the DSN with:

```bash
pnpm bugsink:test
```

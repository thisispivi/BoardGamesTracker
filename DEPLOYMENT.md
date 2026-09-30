# Deployment

For a first install, follow the [quick start](./README.md#quick-start). This
page covers what comes after. Run every command from `board-games-tracker/`.

## Before you go live

1. Put the app behind an HTTPS reverse proxy and set `APP_URL` to its public
   address.
2. Use a different random value for `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`,
   and `SEARXNG_SECRET`.
3. Expose only the app port. PostgreSQL and SearXNG stay on the private Compose
   network.
4. Set up [email](#email) before you set `ALLOW_SIGN_UP=true`.
5. Copy your backups to another machine.

[SECURITY.md](./SECURITY.md) has the full hardening checklist.

## Backups

The `backup` service writes a database dump to `board-games-tracker/backups`
once a week. It keeps the eight newest dumps, about two months. An old dump is
deleted only after a new one succeeds.

Back up right now:

```bash
docker compose exec backup sh /usr/local/bin/backup-database.sh --once
```

Dumps contain account emails and password hashes, so only their owner can read
them. A backup on the same disk does not survive losing that disk, so copy the
dumps elsewhere.

| Setting                | Default     | Meaning                 |
| ---------------------- | ----------- | ----------------------- |
| `BACKUP_INTERVAL_DAYS` | `7`         | Days between dumps      |
| `BACKUP_KEEP`          | `8`         | Dumps kept              |
| `BACKUP_DIRECTORY`     | `./backups` | Where dumps are written |

## Upgrade

1. Back up right now, with the command above.

2. Get the new version:

   ```bash
   git pull
   ```

3. Rebuild and restart:

   ```bash
   docker compose pull && docker compose up --build -d
   ```

The app applies database migrations when it starts.

Set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` once, before your first build, to the
output of `openssl rand -base64 32`. Without it, every rebuild breaks the pages
people already have open.

## Restore a backup

1. Stop the app:

   ```bash
   docker compose stop app
   ```

2. Restore a dump over the current database. Replace the file name with yours:

   ```bash
   docker compose exec -T database pg_restore --clean --if-exists --no-owner -U board_games_tracker -d board_games_tracker < backups/board-games-tracker-20260911T020000Z.dump
   ```

3. Start the app:

   ```bash
   docker compose start app
   ```

## Settings

[`.env.example`](./board-games-tracker/.env.example) lists every setting with a
comment.

With Docker Compose you set the four values from the quick start. Compose
builds the rest from them. `APP_PORT` changes the published port.

Without Compose, these five are required:

| Variable              | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `DATABASE_URL`        | PostgreSQL connection string               |
| `BETTER_AUTH_SECRET`  | Signing secret, at least 32 characters     |
| `BETTER_AUTH_URL`     | The app's address, as the server sees it   |
| `NEXT_PUBLIC_APP_URL` | The app's address, as the browser sees it  |
| `SEARXNG_URL`         | SearXNG address, reachable from the server |

An app address is a plain origin such as `https://games.example.com`, with no
path, query, or credentials.

### Access

| Variable             | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `ALLOW_SIGN_UP`      | `true` lets anyone register. The default is `false`           |
| `ADMIN_EMAIL`        | An account registered with this address becomes administrator |
| `HEALTH_CHECK_TOKEN` | Makes `/api/health` require this bearer token, 16+ characters |
| `LOG_LEVEL`          | `debug`, `info`, `warn`, or `error`                           |

### Email

Email is off by default. Set `SMTP_HOST` and `SMTP_FROM_EMAIL` together to turn
on address verification and password recovery.

| Variable           | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `SMTP_HOST`        | Mail server                                    |
| `SMTP_PORT`        | `465` or `587`                                 |
| `SMTP_SECURE`      | `true` for port `465`                          |
| `SMTP_REQUIRE_TLS` | `true` for port `587`                          |
| `SMTP_USER`        | Username. Set it together with `SMTP_PASSWORD` |

| Variable          | Purpose                       |
| ----------------- | ----------------------------- |
| `SMTP_PASSWORD`   | Password or provider API key  |
| `SMTP_FROM_EMAIL` | Sender address                |
| `SMTP_FROM_NAME`  | Sender name                   |
| `SMTP_REPLY_TO`   | Address that receives replies |

Publish SPF, DKIM, and DMARC records for the sender domain, or your mail is
likely to land in spam. The app never logs recipient addresses or action links.

### Error monitoring

Monitoring is off by default. It works with Sentry and with compatible services
such as a self-hosted Bugsink.

| Variable                         | Purpose                               |
| -------------------------------- | ------------------------------------- |
| `SENTRY_DSN`                     | Reports server errors                 |
| `NEXT_PUBLIC_SENTRY_DSN`         | Reports browser errors                |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Environment name shown on each error  |
| `SENTRY_AUTH_TOKEN_FILE`         | File with the source-map upload token |

Each error carries the app version, such as `v0.1.2`. Check the connection
with:

```bash
pnpm bugsink:test
```

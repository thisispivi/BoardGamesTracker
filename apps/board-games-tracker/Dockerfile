# Build from the repository root: the lockfile and pnpm-workspace.yaml live there.
FROM node:24.22.3-slim AS workspace
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/board-games-tracker/package.json apps/board-games-tracker/
RUN corepack install

FROM workspace AS dependencies
RUN pnpm install --frozen-lockfile --filter board-games-tracker

FROM workspace AS prod-dependencies
RUN pnpm install --frozen-lockfile --prod --ignore-scripts --filter board-games-tracker

FROM dependencies AS builder
ARG APP_URL=http://localhost:12500
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
ARG SENTRY_PROJECT
ARG SENTRY_URL
ARG NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV BETTER_AUTH_SECRET=build-only-secret-not-used-at-runtime-000000000
ENV BETTER_AUTH_URL=${APP_URL}
ENV NEXT_PUBLIC_APP_URL=${APP_URL}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV NEXT_PUBLIC_SENTRY_ENVIRONMENT=${NEXT_PUBLIC_SENTRY_ENVIRONMENT}
ENV SENTRY_PROJECT=${SENTRY_PROJECT}
ENV SENTRY_URL=${SENTRY_URL}
ENV NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=${NEXT_SERVER_ACTIONS_ENCRYPTION_KEY}
COPY apps/board-games-tracker apps/board-games-tracker
WORKDIR /app/apps/board-games-tracker
RUN --mount=type=secret,id=sentry_auth_token,required=false \
    if [ -s /run/secrets/sentry_auth_token ]; then \
      SENTRY_BUILD_TOKEN="$(cat /run/secrets/sentry_auth_token)"; \
      if [ "$SENTRY_BUILD_TOKEN" != "disabled" ]; then \
        export SENTRY_AUTH_TOKEN="$SENTRY_BUILD_TOKEN"; \
      fi; \
    fi && \
    pnpm build

FROM node:24.22.3-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=12500
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
ARG APP=/app/apps/board-games-tracker
COPY --from=prod-dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=prod-dependencies --chown=nextjs:nodejs $APP/node_modules $APP/node_modules
COPY --from=builder --chown=nextjs:nodejs $APP/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs $APP/public $APP/public
COPY --from=builder --chown=nextjs:nodejs $APP/.next/static $APP/.next/static
COPY --from=builder --chown=nextjs:nodejs $APP/drizzle $APP/drizzle
COPY --from=builder --chown=nextjs:nodejs $APP/scripts/migrate.mjs $APP/scripts/migrate.mjs
WORKDIR $APP
USER nextjs
EXPOSE 12500
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "-e", "const t=process.env.HEALTH_CHECK_TOKEN;fetch('http://127.0.0.1:12500/api/health',t?{headers:{authorization:`Bearer ${t}`}}:{}).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["sh", "-c", "node scripts/migrate.mjs && exec node server.js"]

# Security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Contact the repository owner privately with the affected version, reproduction steps, impact, and any suggested mitigation. Avoid accessing data that is not yours and do not run denial-of-service tests.

The maintainer should acknowledge a report within seven days, provide a remediation plan after triage, and coordinate disclosure after supported releases are fixed.

## Supported versions

Only the latest release on the default branch receives security updates.

## Operator checklist

- Terminate TLS at a maintained reverse proxy and never expose production over plain HTTP.
- Generate unique database and Better Auth secrets; store them in a secret manager, not the repository.
- Keep `ALLOW_SIGN_UP=false` in production except during a controlled additional-registration window. An empty installation permits exactly the first administrator setup, so complete bootstrap from a trusted network before exposing it publicly.
- Treat `ADMIN_EMAIL` as a temporary bootstrap credential: every successful registration matching it becomes an administrator. Unset it after creating the intended account, especially before enabling `ALLOW_SIGN_UP=true`.
- Set `HEALTH_CHECK_TOKEN` to protect the database-backed health probe, and configure the orchestrator to send it as a bearer token.
- Restrict inbound traffic to the application port and keep PostgreSQL on a private network.
- Configure log retention and access controls. Audit events can contain user IDs and request IP addresses.
- Back up and test restore procedures before every upgrade.
- Run `pnpm audit`, the test suite, and a production build for each dependency update.
- Rotate `BETTER_AUTH_SECRET` using Better Auth's supported secret-rotation procedure if compromise is suspected.
- Review administrator accounts and recent audit events regularly.

## Deliberate limitations

Registration holds a nonblocking PostgreSQL advisory lock through the complete
Better Auth signup handler. Competing registrations receive HTTP 429 and can
retry. Keep registrations on the application's `/api/auth/sign-up/email`
entry point; a direct server-side Better Auth signup call would bypass this lock.

Administrator role changes, bans, and removals lock and recheck the acting
administrator and target together. Better Auth's separate `/admin/*` endpoints
are disabled because they bypass these application safeguards. An administrator
must be demoted by another administrator before deleting its own account.
Administrator-issued reset tokens are checked again under credential locks;
password replacement and session revocation commit together.

Rate limits are in memory and apply per application instance. Multiple instances
need a shared limiter or equivalent protection at the reverse proxy. Configure
the proxy to replace client-supplied forwarding headers and impose request-body
and connection-time limits before requests reach Node.js.

Email verification and password-reset mail require operator-provided SMTP and
are disabled by default. Without SMTP, an administrator can issue a one-hour,
single-use reset link from the administration console and deliver it through a
trusted channel. Email ownership remains unverified until SMTP verification is
enabled. Configure it before allowing untrusted registrations.

# Security

## Report a vulnerability

1. Do not open a public issue.
2. Open this repository's **Security** tab and choose **Report a
   vulnerability**. If that button is missing, contact the owner through their
   GitHub profile.
3. Include the version, the steps to reproduce it, and the impact.

Expect a reply within seven days. Only the latest release gets security fixes.

While testing, do not read data that is not yours and do not run
denial-of-service tests.

## Harden a deployment

**First start**

- Create the first account from a trusted network, before the app is public.
  An empty installation lets exactly one person register, and that person
  becomes the administrator.
- Use a different random value for every secret, and keep them out of the
  repository.
- Keep `ALLOW_SIGN_UP=false` unless you want open registration.
- Unset `ADMIN_EMAIL` once your administrator exists. Any account registered
  with that address becomes an administrator.

**Network**

- Serve the app over HTTPS from a reverse proxy. Never expose it over plain
  HTTP.
- Expose only the app port. Keep PostgreSQL on a private network.
- Make the proxy overwrite the forwarding headers a client sends, and limit
  request size and connection time.
- Set `HEALTH_CHECK_TOKEN` so `/api/health` is not open to everyone.

**Ongoing**

- Test a restore, not only the backup, before each upgrade.
- Review administrator accounts and the audit log regularly.
- Restrict who can read logs. Audit events hold user IDs and IP addresses.
- If `BETTER_AUTH_SECRET` leaks, rotate it with Better Auth's rotation
  procedure.

## Known limits

- **Rate limits are per process.** They live in memory. If you run several
  instances, add a shared limiter at the reverse proxy.
- **Sign-ups run one at a time.** A second sign-up sent at the same moment gets
  HTTP 429 and can retry. This holds only for the app's
  `/api/auth/sign-up/email` route. A direct server-side Better Auth sign-up
  call would skip it.
- **Without email, addresses are unverified.** An administrator can create a
  one-hour, single-use password reset link and pass it on by hand. Set up email
  before you allow registration by people you do not know.
- **An administrator cannot delete their own account.** Another administrator
  has to demote them first. Better Auth's own `/admin/*` routes are disabled,
  because they skip the app's checks.

/**
 * Rebuilds a framework-issued mail action URL on the configured public origin.
 *
 * @param rawUrl - URL produced by the authentication framework.
 * @param publicAppUrl - Public application base shown to recipients.
 * @param authUrl - Server-side Better Auth base allowed to issue actions.
 * @returns A canonical public URL, or null when its origin or protocol is not trusted.
 */
export function normalizeMailActionUrl(
  rawUrl: string,
  publicAppUrl: string,
  authUrl: string,
): string | null {
  try {
    const candidate = new URL(rawUrl);
    const publicBase = new URL(publicAppUrl);
    const authBase = new URL(authUrl);
    if (
      !["http:", "https:"].includes(candidate.protocol) ||
      ![publicBase.origin, authBase.origin].includes(candidate.origin)
    ) {
      return null;
    }

    return new URL(
      `${candidate.pathname}${candidate.search}`,
      `${publicBase.origin}/`,
    ).toString();
  } catch {
    return null;
  }
}

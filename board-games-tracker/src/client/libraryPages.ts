import type { LibraryPage, LibraryPageRequest } from "@/core";
import { libraryPageResponseSchema } from "@/core";

/** Longest wait, in milliseconds, for one library window before giving up. */
const requestTimeoutMs = 15_000;

/**
 * Requests one window of the signed-in user's library from the application.
 *
 * @param request - Filter state, library section, and result window to load.
 * @param signal - Cancels the request once a newer view supersedes it.
 * @returns The validated page.
 * @throws {Error} When the endpoint fails or answers with an unexpected shape.
 */
export async function fetchLibraryPage(
  request: LibraryPageRequest,
  signal: AbortSignal,
): Promise<LibraryPage> {
  const response = await fetch("/api/library", {
    body: JSON.stringify(request),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.any([signal, AbortSignal.timeout(requestTimeoutMs)]),
  });
  const payload = libraryPageResponseSchema.safeParse(await response.json());
  if (!response.ok || !payload.success || !payload.data.page) {
    throw new Error("library_page_unavailable");
  }
  return payload.data.page;
}

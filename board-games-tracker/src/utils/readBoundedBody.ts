/** Signals that a streamed HTTP body exceeded its permitted byte count. */
export class BodyTooLargeError extends Error {
  /** Creates a payload-size failure without including request data. */
  constructor() {
    super("The HTTP body exceeded its byte limit.");
    this.name = "BodyTooLargeError";
  }
}

/**
 * Reads an HTTP body with a byte limit independent of Content-Length.
 *
 * @param body - Request or response stream, or null for an empty body.
 * @param maxBytes - Maximum number of decoded bytes retained in memory.
 * @returns The complete bytes, cancelling the reader on overflow or failure.
 */
export async function readBoundedBody(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<Uint8Array> {
  if (!body) return new Uint8Array();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.byteLength;
      if (size > maxBytes) throw new BodyTooLargeError();
      chunks.push(result.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

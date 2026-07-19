import { createHash } from "node:crypto";

import type { StoredGameImage } from "@/core";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Validates that a source points to the exact secure BGG image CDN. */
function parseSourceUrl(rawUrl: string): URL {
  if (rawUrl.length > 2_000) {
    throw new Error("The image URL is too long.");
  }
  const url = new URL(rawUrl);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "cf.geekdo-images.com" ||
    url.port ||
    url.username ||
    url.password
  ) {
    throw new Error("The image source is not an approved BGG CDN URL.");
  }
  return url;
}

/** Detects the supported image MIME type from trusted file signatures. */
function detectMimeType(data: Buffer): StoredGameImage["mimeType"] | null {
  if (
    data.length >= 3 &&
    data[0] === 0xff &&
    data[1] === 0xd8 &&
    data[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    data.length >= 8 &&
    data
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  if (
    data.length >= 12 &&
    data.subarray(0, 4).toString("ascii") === "RIFF" &&
    data.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/** Reads a response body while enforcing the configured byte limit. */
async function readBoundedBody(response: Response): Promise<Buffer> {
  if (!response.body) {
    throw new Error("The image response had no body.");
  }
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) {
      break;
    }
    size += result.value.byteLength;
    if (size > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error("The image exceeded the 5 MB limit.");
    }
    chunks.push(Buffer.from(result.value));
  }
  if (size === 0) {
    throw new Error("The image response was empty.");
  }
  return Buffer.concat(chunks, size);
}

/** Downloads and authenticates one bounded image from the BGG image CDN. */
export async function downloadBggImage(
  rawUrl: string,
): Promise<StoredGameImage> {
  const source = parseSourceUrl(rawUrl);
  const response = await fetch(source, {
    cache: "no-store",
    headers: {
      Accept: "image/webp,image/png,image/jpeg",
      "User-Agent": "BoardGamesTracker/0.1 (self-hosted board-game collection)",
    },
    redirect: "error",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    throw new Error(`The BGG image CDN returned ${response.status}.`);
  }

  const declaredSize = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_IMAGE_BYTES) {
    throw new Error("The image exceeded the 5 MB limit.");
  }
  const declaredMime = response.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (!declaredMime || !allowedMimeTypes.has(declaredMime)) {
    throw new Error("The BGG CDN returned an unsupported content type.");
  }

  const data = await readBoundedBody(response);
  const mimeType = detectMimeType(data);
  if (!mimeType || mimeType !== declaredMime) {
    throw new Error("The downloaded file is not a valid supported image.");
  }
  return {
    checksum: createHash("sha256").update(data).digest("hex"),
    data,
    mimeType,
    size: data.byteLength,
    sourceUrl: source.toString(),
  };
}

/** Downloads a bounded image map with limited outbound concurrency. */
export async function downloadBggImages(
  sources: Map<number, string>,
): Promise<Map<number, StoredGameImage>> {
  const entries = [...sources.entries()].slice(0, 500);
  const images = new Map<number, StoredGameImage>();
  let cursor = 0;

  /** Claims and downloads entries until the shared bounded queue is empty. */
  async function worker(): Promise<void> {
    while (cursor < entries.length) {
      const entry = entries[cursor];
      cursor += 1;
      if (!entry) {
        continue;
      }
      const [bggId, sourceUrl] = entry;
      try {
        images.set(bggId, await downloadBggImage(sourceUrl));
      } catch {
        continue;
      }
    }
  }

  await Promise.all(Array.from({ length: 3 }, () => worker()));
  return images;
}

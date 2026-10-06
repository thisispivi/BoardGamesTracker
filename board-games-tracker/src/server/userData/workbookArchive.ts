import { fromBufferPromise } from "yauzl";

const maxExpandedBytes = 32 * 1024 * 1024;
const maxEntries = 256;

/**
 * Bounds XLSX decompression before ExcelJS constructs an in-memory workbook.
 *
 * Every entry is read with size verification, including entries ExcelJS ignores.
 * No archive content is written to disk or interpreted as a filesystem path.
 *
 * @param bytes - Uploaded ZIP bytes awaiting workbook parsing.
 * @returns Completion when the archive fits the expanded-byte and entry limits.
 */
export async function validateWorkbookArchive(
  bytes: Uint8Array,
): Promise<void> {
  const archive = await fromBufferPromise(Buffer.from(bytes), {
    lazyEntries: true,
    validateEntrySizes: true,
    strictFileNames: true,
  });
  let expandedBytes = 0;
  const names = new Set<string>();
  try {
    if (archive.entryCount > maxEntries)
      throw new Error("Too many workbook entries.");
    for await (const entry of archive.eachEntry()) {
      if (names.has(entry.fileName) || entry.isEncrypted()) {
        throw new Error("Ambiguous or encrypted workbook archive.");
      }
      names.add(entry.fileName);
      if (entry.uncompressedSize > maxExpandedBytes - expandedBytes) {
        throw new Error("The expanded workbook is too large.");
      }
      const stream = await archive.openReadStreamPromise(entry);
      for await (const chunk of stream) {
        if (!Buffer.isBuffer(chunk)) throw new Error("Invalid workbook bytes.");
        expandedBytes += chunk.byteLength;
        if (expandedBytes > maxExpandedBytes) {
          throw new Error("The expanded workbook is too large.");
        }
      }
    }
  } finally {
    archive.close();
  }
}

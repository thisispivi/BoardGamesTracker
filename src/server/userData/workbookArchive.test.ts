import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { validateWorkbookArchive } from "@/server/userData/workbookArchive";

describe("workbook archive limits", () => {
  it("accepts a normal compressed workbook", async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Games").addRow(["Catan"]);
    await expect(
      validateWorkbookArchive(
        new Uint8Array(await workbook.xlsx.writeBuffer()),
      ),
    ).resolves.toBeUndefined();
  });

  it("rejects malformed archive bytes", async () => {
    await expect(
      validateWorkbookArchive(new TextEncoder().encode("not a ZIP")),
    ).rejects.toThrow();
  });

  it("rejects an oversized expanded entry before allocating its content", async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Games").addRow(["Catan"]);
    const bytes = Buffer.from(await workbook.xlsx.writeBuffer());
    const signature = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
    let offset = bytes.indexOf(signature);
    while (offset >= 0 && bytes.readUInt16LE(offset + 10) !== 8) {
      offset = bytes.indexOf(signature, offset + 4);
    }
    expect(offset).toBeGreaterThanOrEqual(0);
    bytes.writeUInt32LE(33 * 1024 * 1024, offset + 24);
    await expect(validateWorkbookArchive(bytes)).rejects.toThrow(
      "expanded workbook is too large",
    );
  });
});

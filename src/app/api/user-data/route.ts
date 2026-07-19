import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { formatSchema, type UserDataFormat } from "@/core";
import { writeAuditEvent } from "@/server/audit";
import { hasTrustedOrigin } from "@/server/security/origin";
import { getSession } from "@/server/session";
import {
  getUserDataDocument,
  importUserDataDocument,
} from "@/server/userData/data";
import {
  getExportMetadata,
  parseUserData,
  serializeUserData,
} from "@/server/userData/formats";
const maxImportBytes = 10 * 1024 * 1024;

/** Exports only the signed-in user's portable application data. */
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsedFormat = formatSchema.safeParse(
    request.nextUrl.searchParams.get("format") ?? "json",
  );
  if (!parsedFormat.success) {
    return NextResponse.json({ error: "unsupported_format" }, { status: 400 });
  }

  const document = await getUserDataDocument(session.user.id);
  const output = await serializeUserData(document, parsedFormat.data);
  const metadata = getExportMetadata(parsedFormat.data);
  const date = document.exportedAt.slice(0, 10);
  await writeAuditEvent({
    actorId: session.user.id,
    action: "user_data.exported",
    targetType: "user",
    targetId: session.user.id,
    metadata: { format: parsedFormat.data, items: document.items.length },
  });
  return new Response(Buffer.from(output), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="board-games-tracker-${date}.${metadata.extension}"`,
      "Content-Type": metadata.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** Imports a validated Board Games Tracker export into the current account. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: "cross_origin" }, { status: 403 });
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxImportBytes + 256_000) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > maxImportBytes
  ) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 });
  }
  const format = formatFromFilename(file.name);
  if (!format) {
    return NextResponse.json({ error: "unsupported_format" }, { status: 400 });
  }

  try {
    const document = await parseUserData(
      new Uint8Array(await file.arrayBuffer()),
      format,
    );
    const imported = await importUserDataDocument(session.user.id, document);
    await writeAuditEvent({
      actorId: session.user.id,
      action: "user_data.imported",
      targetType: "user",
      targetId: session.user.id,
      metadata: { format, items: imported },
    });
    for (const path of [
      "/settings",
      "/dashboard",
      "/collection",
      "/wishlist",
      "/stats",
      "/play",
    ]) {
      revalidatePath(path);
    }
    return NextResponse.json({ success: true, imported });
  } catch {
    return NextResponse.json({ error: "invalid_export" }, { status: 400 });
  }
}

/** Maps an upload extension to a supported parser without trusting MIME types. */
function formatFromFilename(filename: string): UserDataFormat | null {
  const extension = filename.toLowerCase().split(".").pop();
  const parsed = formatSchema.safeParse(extension);
  return parsed.success ? parsed.data : null;
}

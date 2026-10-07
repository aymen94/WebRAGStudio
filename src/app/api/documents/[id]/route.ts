import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const doc = db
    .prepare(
      "SELECT id,title,source_data,source_mime FROM documents WHERE id=?",
    )
    .get(id) as
    | {
        id: string;
        title: string;
        source_data: string | null;
        source_mime: string | null;
      }
    | undefined;
  if (!doc)
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  let data: Buffer;
  let contentType = doc.source_mime || "text/plain; charset=utf-8";
  if (doc.source_data) data = Buffer.from(doc.source_data, "base64");
  else {
    const chunks = db
      .prepare(
        "SELECT content FROM chunks WHERE document_id=? ORDER BY ordinal",
      )
      .all(id) as { content: string }[];
    data = Buffer.from(
      chunks.map((chunk) => chunk.content).join("\n\n"),
      "utf8",
    );
  }
  const filename = doc.title.replace(/[\r\n"\\/]/g, "_") || "document.txt";
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(data.byteLength),
      "Cache-Control": "no-store",
    },
  });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const exists = db.prepare("SELECT id FROM documents WHERE id=?").get(id);
  if (!exists)
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM chunks WHERE document_id=?").run(id);
    db.prepare("DELETE FROM documents WHERE id=?").run(id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return NextResponse.json({ ok: true });
}

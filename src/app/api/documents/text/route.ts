import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ingest } from "@/lib/rag";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const body = await req.json();
  if (
    ![body.title, body.collectionId, body.content].every(
      (v) => typeof v === "string",
    ) ||
    !body.title.trim() ||
    !body.content.trim()
  )
    return NextResponse.json(
      { error: "Title, collection and content are required" },
      { status: 400 },
    );
  if (
    !db.prepare("SELECT id FROM collections WHERE id=?").get(body.collectionId)
  )
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  const id = randomUUID();
  db.prepare(
    "INSERT INTO documents (id,collection_id,title,status,error,created_at,source_data,source_mime) VALUES (?, ?, ?, 'PENDING', NULL, ?, ?, 'text/plain; charset=utf-8')",
  ).run(
    id,
    body.collectionId,
    body.title.trim(),
    new Date().toISOString(),
    Buffer.from(body.content, "utf8").toString("base64"),
  );
  try {
    const chunks = await ingest(id, body.collectionId, body.content);
    return NextResponse.json({ id, chunks, status: "READY" }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      {
        id,
        status: "FAILED",
        error: e instanceof Error ? e.message : "Ingestion failed",
      },
      { status: 502 },
    );
  }
}

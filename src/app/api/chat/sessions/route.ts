import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  db.prepare(
    "DELETE FROM chat_sessions WHERE NOT EXISTS (SELECT 1 FROM chat_messages m WHERE m.session_id=chat_sessions.id)",
  ).run();
  const sessions = db
    .prepare(
      `SELECT s.id, s.collection_id, s.title, s.updated_at, c.name AS collection_name,
    (SELECT COUNT(*) FROM chat_messages m WHERE m.session_id=s.id) AS message_count
    FROM chat_sessions s JOIN collections c ON c.id=s.collection_id
    WHERE EXISTS (SELECT 1 FROM chat_messages m WHERE m.session_id=s.id)
    ORDER BY s.updated_at DESC`,
    )
    .all();
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (typeof body?.collectionId !== "string")
    return NextResponse.json(
      { error: "Collection is required" },
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
  const now = new Date().toISOString();
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 120)
      : "New chat";
  db.prepare(
    "INSERT INTO chat_sessions (id,collection_id,title,created_at,updated_at) VALUES (?,?,?,?,?)",
  ).run(id, body.collectionId, title, now, now);
  return NextResponse.json(
    {
      id,
      collection_id: body.collectionId,
      title,
      updated_at: now,
      message_count: 0,
    },
    { status: 201 },
  );
}

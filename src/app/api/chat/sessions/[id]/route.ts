import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Context) {
  const { id } = await params;
  const session = db
    .prepare(
      "SELECT id,collection_id,title,created_at,updated_at FROM chat_sessions WHERE id=?",
    )
    .get(id);
  if (!session)
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  const messages = db
    .prepare(
      "SELECT id,question,answer,sources,created_at FROM chat_messages WHERE session_id=? ORDER BY created_at,id",
    )
    .all(id) as {
    id: string;
    question: string;
    answer: string;
    sources: string;
    created_at: string;
  }[];
  return NextResponse.json({
    ...(session as object),
    messages: messages.map((item) => ({
      ...item,
      sources: JSON.parse(item.sources),
    })),
  });
}

export async function DELETE(_req: Request, { params }: Context) {
  const { id } = await params;
  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM chat_messages WHERE session_id=?").run(id);
    const result = db.prepare("DELETE FROM chat_sessions WHERE id=?").run(id);
    db.exec("COMMIT");
    if (!result.changes)
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

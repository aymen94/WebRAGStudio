import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (
    typeof body?.name !== "string" ||
    !body.name.trim() ||
    body.name.trim().length > 80
  ) {
    return NextResponse.json(
      { error: "Name must be 1–80 characters" },
      { status: 400 },
    );
  }
  const result = db
    .prepare("UPDATE collections SET name=? WHERE id=?")
    .run(body.name.trim(), id);
  if (!result.changes)
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  return NextResponse.json({ id, name: body.name.trim() });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const exists = db.prepare("SELECT id FROM collections WHERE id=?").get(id);
  if (!exists)
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  db.exec("BEGIN");
  try {
    db.prepare(
      "DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE collection_id=?)",
    ).run(id);
    db.prepare("DELETE FROM chat_sessions WHERE collection_id=?").run(id);
    db.prepare("DELETE FROM chunks WHERE collection_id=?").run(id);
    db.prepare("DELETE FROM documents WHERE collection_id=?").run(id);
    db.prepare("DELETE FROM collections WHERE id=?").run(id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return NextResponse.json({ ok: true });
}

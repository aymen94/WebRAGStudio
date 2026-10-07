import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json(
    db
      .prepare(
        "SELECT c.*, COUNT(d.id) AS documents FROM collections c LEFT JOIN documents d ON d.collection_id=c.id GROUP BY c.id ORDER BY c.created_at DESC",
      )
      .all(),
  );
}
export async function POST(req: Request) {
  const body = await req.json();
  if (
    typeof body.name !== "string" ||
    body.name.trim().length < 1 ||
    body.name.length > 80
  )
    return NextResponse.json(
      { error: "Name must be 1–80 characters" },
      { status: 400 },
    );
  const row = {
    id: randomUUID(),
    name: body.name.trim(),
    created_at: new Date().toISOString(),
  };
  db.prepare("INSERT INTO collections VALUES (?, ?, ?)").run(
    row.id,
    row.name,
    row.created_at,
  );
  return NextResponse.json(row, { status: 201 });
}

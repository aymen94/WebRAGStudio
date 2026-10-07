import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("collectionId");
  const select =
    "SELECT d.id,d.title,d.status,d.error,d.created_at,d.collection_id,c.name AS collection_name FROM documents d LEFT JOIN collections c ON c.id=d.collection_id";
  const rows = id
    ? db
        .prepare(`${select} WHERE d.collection_id=? ORDER BY d.created_at DESC`)
        .all(id)
    : db.prepare(`${select} ORDER BY d.created_at DESC`).all();
  return NextResponse.json(rows);
}

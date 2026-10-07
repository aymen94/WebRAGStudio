import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const doc = db
    .prepare(
      "SELECT id,title,collection_id,created_at,status FROM documents WHERE id=?",
    )
    .get(id) as
    | {
        id: string;
        title: string;
        collection_id: string;
        created_at: string;
        status: string;
      }
    | undefined;
  if (!doc)
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  const chunks = db
    .prepare(
      "SELECT id,content,embedding,ordinal FROM chunks WHERE document_id=? ORDER BY ordinal",
    )
    .all(id) as {
    id: string;
    content: string;
    embedding: string;
    ordinal: number;
  }[];
  return NextResponse.json(
    {
      format: "rag-studio-vector-export-v1",
      exportedAt: new Date().toISOString(),
      document: {
        id: doc.id,
        title: doc.title,
        collectionId: doc.collection_id,
        createdAt: doc.created_at,
        status: doc.status,
      },
      vectorCount: chunks.length,
      vectors: chunks.map((chunk) => ({
        id: chunk.id,
        chunkIndex: chunk.ordinal,
        content: chunk.content,
        embedding: JSON.parse(chunk.embedding) as number[],
      })),
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="${doc.title.replace(/[^a-zA-Z0-9._-]/g, "_") || "document"}-vectors.json"`,
        "Cache-Control": "no-store",
      },
    },
  );
}

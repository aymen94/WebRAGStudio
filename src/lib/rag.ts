import { randomUUID } from "node:crypto";
import { embed as aiEmbed } from "ai";
import { db } from "./db";
import { getEmbeddingModel } from "./providers";
import { getAppSettings } from "./settings";

export function chunkText(text: string, size = 700, overlap = 100) {
  const words = text.trim().split(/\s+/).filter(Boolean),
    chunks: string[] = [];
  for (
    let start = 0;
    start < words.length;
    start += Math.max(1, size - overlap)
  ) {
    const content = words.slice(start, start + size).join(" ");
    if (content) chunks.push(content);
  }
  return chunks;
}

export async function embed(text: string): Promise<number[]> {
  const { embedding } = await aiEmbed({
    model: getEmbeddingModel(),
    value: text,
  });
  return embedding;
}

export async function ingest(
  documentId: string,
  collectionId: string,
  text: string,
) {
  db.prepare(
    "UPDATE documents SET status='PROCESSING', error=NULL WHERE id=?",
  ).run(documentId);
  try {
    const settings = getAppSettings();
    const chunks = chunkText(text, settings.chunkSize, settings.chunkOverlap);
    if (!chunks.length)
      throw new Error("No text could be extracted from this document");
    const insert = db.prepare(
      "INSERT INTO chunks (id, document_id, collection_id, content, embedding, ordinal) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (let i = 0; i < chunks.length; i++)
      insert.run(
        randomUUID(),
        documentId,
        collectionId,
        chunks[i],
        JSON.stringify(await embed(chunks[i])),
        i,
      );
    db.prepare("UPDATE documents SET status='READY' WHERE id=?").run(
      documentId,
    );
    return chunks.length;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ingestion failed";
    db.prepare("UPDATE documents SET status='FAILED', error=? WHERE id=?").run(
      message,
      documentId,
    );
    throw e;
  }
}

export async function retrieve(
  collectionId: string,
  question: string,
  topK?: number,
) {
  const settings = getAppSettings();
  const query = await embed(question);
  const rows = db
    .prepare(
      "SELECT c.content, c.embedding, d.title FROM chunks c JOIN documents d ON d.id=c.document_id WHERE c.collection_id=?",
    )
    .all(collectionId) as {
    content: string;
    embedding: string;
    title: string;
  }[];
  const norm = (v: number[]) =>
    Math.sqrt(v.reduce((s, n) => s + n * n, 0)) || 1;
  return rows
    .map((r) => {
      const v = JSON.parse(r.embedding) as number[];
      const score =
        v.reduce((s, n, i) => s + n * (query[i] || 0), 0) /
        (norm(v) * norm(query));
      return { content: r.content, title: r.title, score };
    })
    .filter((result) => result.score >= settings.similarityThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK ?? settings.topK);
}

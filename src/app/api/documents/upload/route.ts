import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ingest } from "@/lib/rag";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "json",
  "pdf",
  "docx",
]);

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected a multipart file upload" },
      { status: 400 },
    );
  }
  const file = form.get("file");
  const collectionId = form.get("collectionId");
  if (!(file instanceof File) || typeof collectionId !== "string")
    return NextResponse.json(
      { error: "File and collection are required" },
      { status: 400 },
    );
  if (file.size > MAX_FILE_SIZE)
    return NextResponse.json(
      { error: "File exceeds the 10 MB upload limit" },
      { status: 413 },
    );
  const safeName =
    file.name
      .replace(/\\/g, "/")
      .split("/")
      .pop()
      ?.replace(/[\u0000-\u001f]/g, "")
      .trim() || "document";
  const extension = safeName.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED.has(extension))
    return NextResponse.json(
      { error: "Supported uploads: PDF, DOCX, TXT, Markdown, CSV and JSON" },
      { status: 415 },
    );
  if (!db.prepare("SELECT id FROM collections WHERE id=?").get(collectionId))
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  let content: string;
  const sourceBytes = Buffer.from(await file.arrayBuffer());
  try {
    if (extension === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(sourceBytes) });
      try {
        content = (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    } else if (extension === "docx") {
      const mammoth = await import("mammoth");
      content = (await mammoth.extractRawText({ buffer: sourceBytes })).value;
    } else content = await file.text();
  } catch {
    return NextResponse.json(
      { error: "Could not parse the file" },
      { status: 422 },
    );
  }
  if (!content.trim())
    return NextResponse.json(
      { error: "The uploaded file is empty" },
      { status: 400 },
    );
  if (extension === "json") {
    try {
      JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
    }
  }
  const id = randomUUID();
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain; charset=utf-8",
    md: "text/markdown; charset=utf-8",
    markdown: "text/markdown; charset=utf-8",
    csv: "text/csv; charset=utf-8",
    json: "application/json; charset=utf-8",
  };
  db.prepare(
    "INSERT INTO documents (id,collection_id,title,status,error,created_at,source_data,source_mime) VALUES (?, ?, ?, 'PENDING', NULL, ?, ?, ?)",
  ).run(
    id,
    collectionId,
    safeName,
    new Date().toISOString(),
    sourceBytes.toString("base64"),
    mimeTypes[extension] || "application/octet-stream",
  );
  try {
    const chunks = await ingest(id, collectionId, content);
    return NextResponse.json({ id, chunks, status: "READY" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        id,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Ingestion failed",
      },
      { status: 502 },
    );
  }
}

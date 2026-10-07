import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  encryptSecret,
  getAppSettings,
  hasSharedApiKey,
  saveSettings,
} from "@/lib/settings";

export const runtime = "nodejs";

const allowedProviders = new Set(["openai", "ollama", "openai-compatible"]);
const textFields = [
  "provider",
  "llmModel",
  "embeddingModel",
  "baseUrl",
] as const;

export async function GET() {
  const settings = getAppSettings();
  const saved = db.prepare("SELECT key FROM settings").all() as {
    key: string;
  }[];
  const savedKeys = new Set(saved.map((row) => row.key));
  return NextResponse.json({
    ...settings,
    apiKey: "",
    apiKeyConfigured: hasSharedApiKey(),
    sharedSaved: [
      "provider",
      "baseUrl",
      "apiKey",
      "llmProvider",
      "llmBaseUrl",
      "llmApiKey",
    ].some((key) => savedKeys.has(key)),
    llmModelSaved: savedKeys.has("llmModel"),
    embeddingModelSaved: savedKeys.has("embeddingModel"),
    ragSaved: ["chunkSize", "chunkOverlap", "topK", "similarityThreshold"].some(
      (key) => savedKeys.has(key),
    ),
  });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  const entries: Record<string, string> = {};

  for (const field of textFields) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== "string" || body[field].trim().length > 500)
      return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
    const val = body[field].trim();
    if (field === "provider" && !allowedProviders.has(val))
      return NextResponse.json(
        { error: "Unsupported provider" },
        { status: 400 },
      );
    if (field === "baseUrl") {
      try {
        const url = new URL(val);
        if (url.protocol !== "http:" && url.protocol !== "https:")
          throw new Error();
      } catch {
        return NextResponse.json(
          { error: `Enter a valid HTTP or HTTPS URL for ${field}` },
          { status: 400 },
        );
      }
    }
    entries[field] = val;
  }

  for (const [field, min, max] of [
    ["chunkSize", 100, 10000],
    ["chunkOverlap", 0, 2000],
    ["topK", 1, 20],
  ] as const) {
    if (body[field] === undefined) continue;
    if (
      !Number.isInteger(body[field]) ||
      body[field] < min ||
      body[field] > max
    )
      return NextResponse.json(
        { error: `${field} must be between ${min} and ${max}` },
        { status: 400 },
      );
    entries[field] = String(body[field]);
  }
  if (body.similarityThreshold !== undefined) {
    if (
      typeof body.similarityThreshold !== "number" ||
      !Number.isFinite(body.similarityThreshold) ||
      body.similarityThreshold < 0 ||
      body.similarityThreshold > 1
    )
      return NextResponse.json(
        { error: "Similarity threshold must be between 0 and 1" },
        { status: 400 },
      );
    entries.similarityThreshold = String(body.similarityThreshold);
  }
  if (body.chunkSize !== undefined || body.chunkOverlap !== undefined) {
    const current = getAppSettings();
    const size = body.chunkSize ?? current.chunkSize;
    const overlap = body.chunkOverlap ?? current.chunkOverlap;
    if (overlap >= size)
      return NextResponse.json(
        { error: "Chunk overlap must be smaller than chunk size" },
        { status: 400 },
      );
  }

  if (body.clearApiKey === true) entries.apiKey = "";
  else if (body.apiKey !== undefined) {
    if (typeof body.apiKey !== "string" || body.apiKey.length > 4096)
      return NextResponse.json({ error: "Invalid API key" }, { status: 400 });
    if (body.apiKey.trim()) entries.apiKey = encryptSecret(body.apiKey.trim());
  }

  if (!Object.keys(entries).length)
    return NextResponse.json(
      { error: "No settings provided" },
      { status: 400 },
    );
  saveSettings(entries);
  return GET();
}

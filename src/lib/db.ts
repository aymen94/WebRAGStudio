import "./env";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "data");
mkdirSync(dir, { recursive: true });
export const db = new DatabaseSync(path.join(dir, "rag-studio.sqlite"));
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS collections (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, collection_id TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL, error TEXT, created_at TEXT NOT NULL, source_data TEXT, source_mime TEXT);
CREATE TABLE IF NOT EXISTS chunks (id TEXT PRIMARY KEY, document_id TEXT NOT NULL, collection_id TEXT NOT NULL, content TEXT NOT NULL, embedding TEXT NOT NULL, ordinal INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS chat_sessions (id TEXT PRIMARY KEY, collection_id TEXT NOT NULL, title TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, question TEXT NOT NULL, answer TEXT NOT NULL DEFAULT '', sources TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL);
`);

// Add original-file storage to databases created by earlier app versions.
const documentColumns = db.prepare("PRAGMA table_info(documents)").all() as {
  name: string;
}[];
if (!documentColumns.some((column) => column.name === "source_data"))
  db.exec("ALTER TABLE documents ADD COLUMN source_data TEXT");
if (!documentColumns.some((column) => column.name === "source_mime"))
  db.exec("ALTER TABLE documents ADD COLUMN source_mime TEXT");

export type Collection = { id: string; name: string; created_at: string };
export type DocumentRow = {
  id: string;
  collection_id: string;
  title: string;
  status: string;
  error: string | null;
  created_at: string;
};

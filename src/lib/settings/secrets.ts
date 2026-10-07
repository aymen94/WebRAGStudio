import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getStoredSetting } from "./storage";

function encryptionKey() {
  const configured = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (configured) return createHash("sha256").update(configured).digest();
  const keyPath = path.join(process.cwd(), "data", "settings.key");
  if (!existsSync(keyPath)) {
    const key = randomBytes(32);
    writeFileSync(keyPath, key, { mode: 0o600, flag: "wx" });
    try {
      chmodSync(keyPath, 0o600);
    } catch {
      /* Windows uses inherited file permissions. */
    }
    return key;
  }
  const key = readFileSync(keyPath);
  if (key.length !== 32)
    throw new Error("Invalid local settings encryption key");
  return key;
}

export function encryptSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  return `enc:v1:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(secret: string) {
  if (!secret.startsWith("enc:v1:")) return secret;
  const [, , iv, tag, data] = secret.split(":");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(data, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function getProviderApiKey(task: "chat" | "embedding") {
  const prefix = task === "chat" ? "LLM" : "EMBEDDING";
  const dbKey = task === "chat" ? "llmApiKey" : "embeddingApiKey";
  const shared = getStoredSetting("apiKey");
  if (shared !== undefined)
    return (
      (shared ? decryptSecret(shared) : "") ||
      process.env[`${prefix}_API_KEY`]?.trim() ||
      (task === "chat" ? process.env.OPENAI_API_KEY?.trim() : "") ||
      ""
    );
  const fromDb = getStoredSetting(dbKey);
  return (
    (fromDb ? decryptSecret(fromDb) : "") ||
    process.env[`${prefix}_API_KEY`]?.trim() ||
    (task === "chat" ? process.env.OPENAI_API_KEY?.trim() : "") ||
    ""
  );
}

export function hasConfiguredApiKey(task: "chat" | "embedding") {
  const prefix = task === "chat" ? "LLM" : "EMBEDDING";
  return Boolean(
    getProviderApiKey(task) ||
    (task === "chat" && process.env.OPENAI_API_KEY?.trim()) ||
    process.env[`${prefix}_API_KEY`]?.trim(),
  );
}

export function hasSharedApiKey() {
  return Boolean(getProviderApiKey("chat") || getProviderApiKey("embedding"));
}

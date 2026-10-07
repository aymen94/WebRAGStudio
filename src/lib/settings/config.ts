import { getStoredSetting } from "./storage";

export type AppSettings = {
  provider: string;
  llmModel: string;
  embeddingModel: string;
  baseUrl: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  similarityThreshold: number;
};

function value(key: string, environmentKey: string, fallback: string) {
  return (
    getStoredSetting(key) || process.env[environmentKey]?.trim() || fallback
  );
}

export function getProviderForTask(task: "chat" | "embedding") {
  return (
    getStoredSetting("provider") ||
    getStoredSetting(task === "chat" ? "llmProvider" : "embeddingProvider") ||
    process.env[`${task === "chat" ? "LLM" : "EMBEDDING"}_PROVIDER`]?.trim() ||
    "openai"
  );
}

export function getAppSettings(): AppSettings {
  const provider =
    getStoredSetting("provider") ||
    getStoredSetting("llmProvider") ||
    process.env.LLM_PROVIDER?.trim() ||
    "openai";
  const embeddingProvider = getProviderForTask("embedding");
  const numberValue = (key: string, env: string, fallback: number) => {
    const parsed = Number(value(key, env, String(fallback)));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return {
    provider,
    llmModel: value(
      "llmModel",
      "LLM_MODEL",
      provider === "ollama" ? "qwen3:8b" : "gpt-4o-mini",
    ),
    embeddingModel: value(
      "embeddingModel",
      "EMBEDDING_MODEL",
      embeddingProvider === "ollama"
        ? "nomic-embed-text"
        : "text-embedding-3-small",
    ),
    baseUrl:
      getStoredSetting("baseUrl") ||
      getStoredSetting("llmBaseUrl") ||
      process.env.LLM_BASE_URL?.trim() ||
      (provider === "ollama"
        ? "http://localhost:11434"
        : provider === "openai"
          ? "https://api.openai.com/v1"
          : "http://localhost:8000/v1"),
    chunkSize: numberValue("chunkSize", "CHUNK_SIZE", 700),
    chunkOverlap: numberValue("chunkOverlap", "CHUNK_OVERLAP", 100),
    topK: numberValue("topK", "TOP_K", 4),
    similarityThreshold: numberValue(
      "similarityThreshold",
      "SIMILARITY_THRESHOLD",
      0,
    ),
  };
}

export function getBaseUrlForTask(task: "chat" | "embedding") {
  return (
    getStoredSetting("baseUrl") ||
    getStoredSetting(task === "chat" ? "llmBaseUrl" : "embeddingBaseUrl") ||
    process.env[`${task === "chat" ? "LLM" : "EMBEDDING"}_BASE_URL`]?.trim() ||
    getAppSettings().baseUrl
  );
}

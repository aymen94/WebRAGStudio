import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  getAppSettings,
  getBaseUrlForTask,
  getProviderApiKey,
  getProviderForTask,
} from "./settings";

export type ProviderTask = "chat" | "embedding";

function config(task: ProviderTask) {
  const settings = getAppSettings();
  const provider = getProviderForTask(task).trim().toLowerCase();
  const model = task === "chat" ? settings.llmModel : settings.embeddingModel;
  let baseURL = getBaseUrlForTask(task);

  if (!baseURL) {
    if (provider === "openai") baseURL = "https://api.openai.com/v1";
    else if (provider === "ollama") baseURL = "http://localhost:11434/v1";
    else baseURL = "http://localhost:8000/v1";
  }
  baseURL = baseURL.replace(/\/+$/, "");
  if (provider === "ollama" && !/\/v1$/i.test(baseURL)) baseURL += "/v1";

  const apiKey = getProviderApiKey(task) || undefined;
  if (provider === "openai" && !apiKey) {
    throw new Error(
      `${task === "chat" ? "LLM" : "EMBEDDING"}_API_KEY or OPENAI_API_KEY is required for the OpenAI provider`,
    );
  }

  const compatible = createOpenAICompatible({
    name: provider.replace(/[^a-z0-9_-]/g, "-") || "custom",
    baseURL,
    ...(apiKey ? { apiKey } : {}),
  });
  return { provider, model, compatible };
}

export function getChatModel() {
  const { model, compatible } = config("chat");
  return compatible.chatModel(model);
}

export function getEmbeddingModel() {
  const { model, compatible } = config("embedding");
  return compatible.embeddingModel(model);
}

export function getProviderSummary() {
  const chat = config("chat");
  const embedding = config("embedding");
  return {
    chatProvider: chat.provider,
    chatModel: chat.model,
    embeddingProvider: embedding.provider,
    embeddingModel: embedding.model,
  };
}

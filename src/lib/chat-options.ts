export type ChatPreset = "fast" | "balanced" | "thinking" | "custom";

export type ChatOptions = {
  preset: ChatPreset;
  topK: number;
  temperature: number;
  maxOutputTokens: number;
  instructions: string;
  showCost: boolean;
};

// Values sent to the server; undefined means "use the configured default".
export type ChatRequestOptions = {
  topK?: number;
  temperature?: number;
  maxOutputTokens?: number;
  instructions?: string;
};

export type ChatUsage = {
  question: number;
  retrieval: number;
  context: number;
  instructions: number;
  prompt: number;
  completion?: number;
  estimated?: boolean;
};

export const USAGE_MARKER = "\u001e";
export const MAX_INSTRUCTIONS_LENGTH = 1000;

export const defaultChatOptions: ChatOptions = {
  preset: "balanced",
  topK: 4,
  temperature: 0.3,
  maxOutputTokens: 1024,
  instructions: "",
  showCost: true,
};

const presetRequests: Record<
  Exclude<ChatPreset, "custom">,
  ChatRequestOptions
> = {
  fast: {
    topK: 2,
    temperature: 0.2,
    maxOutputTokens: 300,
    instructions:
      "Reply fast: answer briefly and directly in a few sentences, without preamble.",
  },
  balanced: {},
  thinking: {
    topK: 6,
    temperature: 0.3,
    maxOutputTokens: 2000,
    instructions:
      "Think carefully step by step before answering: compare the sources, note any gaps, then give a thorough, well-structured answer.",
  },
};

export function resolveChatOptions(options: ChatOptions): ChatRequestOptions {
  const preset =
    options.preset === "custom"
      ? {
          topK: options.topK,
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
        }
      : presetRequests[options.preset];
  const instructions = [
    "instructions" in preset ? preset.instructions : "",
    options.instructions,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("\n");
  return { ...preset, instructions: instructions || undefined };
}

function clampNumber(value: unknown, min: number, max: number, integer = false) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const clamped = Math.min(max, Math.max(min, value));
  return integer ? Math.round(clamped) : clamped;
}

export function sanitizeRequestOptions(raw: unknown): ChatRequestOptions {
  const value = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const instructions =
    typeof value.instructions === "string"
      ? value.instructions.trim().slice(0, MAX_INSTRUCTIONS_LENGTH)
      : "";
  return {
    topK: clampNumber(value.topK, 1, 20, true),
    temperature: clampNumber(value.temperature, 0, 2),
    maxOutputTokens: clampNumber(value.maxOutputTokens, 16, 8192, true),
    instructions: instructions || undefined,
  };
}

// Rough estimate (~4 characters per token) used when the provider reports no usage.
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

export const totalTokens = (usage: ChatUsage) =>
  usage.retrieval + usage.prompt + (usage.completion ?? 0);

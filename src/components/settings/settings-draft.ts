export type SettingsDraft = {
  provider: string;
  baseUrl: string;
  apiKey: string;
  llmModel: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  similarityThreshold: number;
  apiKeyConfigured: boolean;
  sharedSaved: boolean;
  ragSaved: boolean;
  clearApiKey: boolean;
};

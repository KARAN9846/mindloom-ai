import "server-only";

import OpenAI from "openai";

const META_API_BASE_URL = "https://api.meta.ai/v1";

export const META_MODEL = "muse-spark-1.3";

export class MetaApiConfigurationError extends Error {
  constructor() {
    super("MODEL_API_KEY is not configured.");
    this.name = "MetaApiConfigurationError";
  }
}

export function createMetaClient(): OpenAI {
  const apiKey = process.env.MODEL_API_KEY?.trim();

  if (!apiKey) {
    throw new MetaApiConfigurationError();
  }

  return new OpenAI({
    apiKey,
    baseURL: META_API_BASE_URL,
    maxRetries: 0,
    timeout: 30_000,
  });
}

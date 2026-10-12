import type { AIProviderConfig } from './types';

// Provider registry — describes all supported AI providers.
// OpenRouter is the primary gateway — it provides access to many models
// through a single API key, including free models.
// Other providers are supported when their keys are configured directly.

export const OPENROUTER_MODELS = [
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'google/gemini-2.0-flash-exp:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
];

export const PROVIDER_REGISTRY: AIProviderConfig[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: OPENROUTER_MODELS,
    capabilities: {
      streaming: true,
      toolUse: true,
      imageInput: true,
      structuredOutput: true,
    },
    configured: false,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    capabilities: {
      streaming: true,
      toolUse: true,
      imageInput: true,
      structuredOutput: true,
    },
    configured: false,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    capabilities: {
      streaming: true,
      toolUse: true,
      imageInput: true,
      structuredOutput: false,
    },
    configured: false,
  },
  {
    id: 'groq',
    name: 'Groq',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    capabilities: {
      streaming: true,
      toolUse: true,
      imageInput: false,
      structuredOutput: false,
    },
    configured: false,
  },
  {
    id: 'google',
    name: 'Google AI',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
    capabilities: {
      streaming: true,
      toolUse: true,
      imageInput: true,
      structuredOutput: true,
    },
    configured: false,
  },
];

export function getProviderById(id: string): AIProviderConfig | undefined {
  return PROVIDER_REGISTRY.find((p) => p.id === id);
}

export function getDefaultModel(providerId: string): string | undefined {
  const provider = getProviderById(providerId);
  return provider?.models[0];
}

// Flattened model list for the UI selector
export function getAllModels(): { provider: string; providerId: string; model: string }[] {
  return PROVIDER_REGISTRY.flatMap((p) =>
    p.models.map((m) => ({ provider: p.name, providerId: p.id, model: m }))
  );
}

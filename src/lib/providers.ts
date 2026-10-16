import type { AIProviderConfig } from './types';

// All models are accessed through OpenRouter using a single API key.
// OpenRouter proxies to the underlying providers (OpenAI, Anthropic, Google, etc.)

export const OPENROUTER_MODELS = [
  'openrouter/auto',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/gpt-4-turbo',
  'openai/gpt-3.5-turbo',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-opus',
  'anthropic/claude-3-haiku',
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-1.5-pro',
  'google/gemini-1.5-flash',
  'meta-llama/llama-3.3-70b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'groq/llama-3.3-70b-versatile',
  'groq/llama-3.1-8b-instant',
  'groq/mixtral-8x7b-32768',
];

export const PROVIDER_REGISTRY: AIProviderConfig[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter (All Models)',
    models: OPENROUTER_MODELS,
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

export function getAllModels(): { provider: string; providerId: string; model: string }[] {
  return PROVIDER_REGISTRY.flatMap((p) =>
    p.models.map((m) => ({ provider: p.name, providerId: p.id, model: m }))
  );
}

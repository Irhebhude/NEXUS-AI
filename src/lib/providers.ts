import type { AIProviderConfig } from './types';

// All models are accessed through Groq using one server-side API key.

export const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'openai/gpt-oss-safeguard-20b',
  'qwen/qwen3-32b',
  'meta-llama/llama-prompt-guard-2-22m',
  'meta-llama/llama-prompt-guard-2-86m',
  'canopylabs/orpheus-v1-english',
  'canopylabs/orpheus-arabic-saudi',
  'whisper-large-v3',
  'whisper-large-v3-turbo',
];

export const PROVIDER_REGISTRY: AIProviderConfig[] = [
  {
    id: 'groq',
    name: 'Groq (Current Models)',
    models: GROQ_MODELS,
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

// NEXUS AI - Core Type System

export type MessageRole = 'user' | 'assistant' | 'system';

export type IntelligenceMode = 'auto' | 'general' | 'reasoning' | 'research' | 'action';

export interface Conversation {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  metadata: MessageMetadata;
  created_at: string;
}

export interface MessageMetadata {
  [key: string]: unknown;
  model?: string;
  provider?: string;
  tokens_in?: number;
  tokens_out?: number;
  latency_ms?: number;
  verification?: VerificationResult;
  citations?: Citation[];
  reasoning_steps?: ReasoningStep[];
  error?: string;
  cancelled?: boolean;
  intelligence_mode?: IntelligenceMode;
}

export interface Citation {
  title: string;
  url: string;
  snippet?: string;
  published_date?: string;
  source_quality?: 'high' | 'medium' | 'low' | 'unknown';
}

export interface VerificationResult {
  status: VerificationStatus;
  summary: string;
  claims: Claim[];
  checks_performed: string[];
}

export type VerificationStatus =
  | 'supported'
  | 'partially_supported'
  | 'conflicting_evidence'
  | 'insufficient_evidence'
  | 'verification_unavailable'
  | 'deterministic_pass'
  | 'deterministic_fail';

export interface Claim {
  text: string;
  supported: boolean;
  evidence?: string;
  note?: string;
}

export interface ReasoningStep {
  step: string;
  description: string;
  tool?: string;
  result?: string;
  duration_ms?: number;
}

export interface Memory {
  id: string;
  key: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface UsageMetric {
  id: string;
  provider: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost_estimate: number;
  latency_ms: number;
  created_at: string;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  models: string[];
  capabilities: ProviderCapabilities;
  configured: boolean;
}

export interface ProviderCapabilities {
  streaming: boolean;
  toolUse: boolean;
  imageInput: boolean;
  structuredOutput: boolean;
}

export interface ChatCompletionRequest {
  messages: { role: MessageRole; content: string }[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  system_prompt?: string;
  web_research?: boolean;
  intelligence_mode?: IntelligenceMode;
}

export interface ChatCompletionResponse {
  content: string;
  model: string;
  provider: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
  error?: string;
}

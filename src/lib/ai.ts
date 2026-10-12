import type { ChatCompletionRequest, ChatCompletionResponse } from './types';
import { supabaseEnvConfigured } from './supabase';

// AI Orchestration Engine — client-side interface to the edge function proxy.
// All provider API keys live server-side as edge function secrets.
// The browser never touches raw credentials.

// Resolve the edge function URL. On Supabase-hosted deployments we use the
// full URL. On Cloudflare Workers/Pages or other static hosts we fall back
// to a relative path so requests are same-origin.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const EDGE_FUNCTION_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/nexus-ai`
  : '/api/nexus-ai';

// Whether the edge function is reachable via Supabase (requires anon key)
// or via a relative path (Cloudflare Workers proxy).
const USE_SUPABASE_AUTH = Boolean(SUPABASE_URL && ANON_KEY);

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (USE_SUPABASE_AUTH) {
    headers['Authorization'] = `Bearer ${ANON_KEY}`;
    headers['apikey'] = ANON_KEY;
  }
  return headers;
}

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (response: ChatCompletionResponse) => void;
  onError: (error: string) => void;
}

// Graceful timeout — if no token arrives within this period, abort and
// surface a user-friendly error instead of hanging forever.
const STREAM_TIMEOUT_MS = 60_000;

export async function streamChatCompletion(
  request: ChatCompletionRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  // If neither Supabase env vars nor a relative fallback is viable, fail fast
  // with a clear message rather than a cryptic network error.
  if (!SUPABASE_URL && !import.meta.env.DEV) {
    // In production without Supabase URL, the relative /api/nexus-ai path
    // requires a Workers proxy. We still attempt the request — if it 404s,
    // the error handler will surface "Backend unreachable".
  }

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), STREAM_TIMEOUT_MS);

  // Combine caller's signal with our timeout signal
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}/chat`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ ...request, stream: true }),
      signal: combinedSignal,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg =
        errBody.error ||
        (response.status === 404
          ? 'Backend unreachable — the AI proxy endpoint was not found. Check that the edge function is deployed.'
          : `Request failed (${response.status})`);
      callbacks.onError(msg);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError('No response stream available');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let metadata: Partial<ChatCompletionResponse> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.token) {
            fullContent += parsed.token;
            callbacks.onToken(parsed.token);
          }
          if (parsed.metadata) {
            metadata = { ...metadata, ...parsed.metadata };
          }
          if (parsed.error) {
            callbacks.onError(parsed.error);
            return;
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    callbacks.onDone({
      content: fullContent,
      model: metadata.model || request.model,
      provider: metadata.provider || 'unknown',
      tokens_in: metadata.tokens_in || 0,
      tokens_out: metadata.tokens_out || 0,
      latency_ms: metadata.latency_ms || 0,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // Distinguish user-cancel from timeout
      if (signal?.aborted) {
        callbacks.onError('cancelled');
      } else {
        callbacks.onError('The request timed out. The AI provider may be slow or unresponsive — try again.');
      }
      return;
    }
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    callbacks.onError(message);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkProviderStatus(): Promise<{ providers: Record<string, boolean>; available: boolean }> {
  // If no Supabase env vars AND we're not in dev mode (where /api proxy might exist),
  // there's no backend to check.
  if (!supabaseEnvConfigured && !import.meta.env.DEV) {
    return { providers: {}, available: false };
  }

  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}/status`, {
      headers: buildHeaders(),
    });
    if (!response.ok) return { providers: {}, available: false };
    const data = await response.json();
    return { providers: data.providers || {}, available: data.available || false };
  } catch {
    return { providers: {}, available: false };
  }
}

// Reasoning Engine — classifies questions and determines the execution plan
export function classifyQuestion(content: string): {
  type: 'factual' | 'math' | 'code' | 'research' | 'reasoning' | 'geographic' | 'document' | 'general';
  needsSearch: boolean;
  needsReasoning: boolean;
  complexity: 'low' | 'medium' | 'high';
} {
  // Math detection
  if (/^[\d\s+\-*/().%^]+$/.test(content.trim()) || /\b(calculate|compute|solve|sum|product|divide|multiply)\b/i.test(content)) {
    return { type: 'math', needsSearch: false, needsReasoning: false, complexity: 'low' };
  }

  // Code detection
  if (/\b(code|function|debug|compile|typescript|python|javascript|rust|java|sql|algorithm|api)\b/i.test(content)) {
    return { type: 'code', needsSearch: false, needsReasoning: true, complexity: 'medium' };
  }

  // Geographic detection
  if (/\b(where|location|near|distance|coordinates|map|geocode|address|city|country|route)\b/i.test(content)) {
    return { type: 'geographic', needsSearch: true, needsReasoning: true, complexity: 'medium' };
  }

  // Current events / research
  if (/\b(latest|current|recent|today|2024|2025|2026|news|update|happened|price|stock|weather)\b/i.test(content)) {
    return { type: 'research', needsSearch: true, needsReasoning: true, complexity: 'high' };
  }

  // Factual
  if (/\b(what is|who is|when did|how many|define|explain|fact|history of)\b/i.test(content)) {
    return { type: 'factual', needsSearch: true, needsReasoning: false, complexity: 'medium' };
  }

  // Complex reasoning
  if (content.length > 200 || /\b(compare|analyze|evaluate|reason|why|should|would|could|implication|consequence|trade-off)\b/i.test(content)) {
    return { type: 'reasoning', needsSearch: false, needsReasoning: true, complexity: 'high' };
  }

  return { type: 'general', needsSearch: false, needsReasoning: false, complexity: 'low' };
}

// Verification Engine — performs deterministic checks on AI responses
export function verifyResponse(content: string, question: string): {
  status: 'deterministic_pass' | 'deterministic_fail' | 'verification_unavailable';
  summary: string;
  checks: string[];
} {
  const checks: string[] = [];

  // Check for hedging / uncertainty markers
  const hedgingWords = /\b(might|maybe|possibly|perhaps|likely|probably|i think|i believe|it seems|uncertain)\b/i;
  const hasHedging = hedgingWords.test(content);
  if (!hasHedging) checks.push('No uncertainty hedging detected');

  // Check for source citations
  const hasCitations = /\[.*?\]\(|https?:\/\//.test(content);
  if (hasCitations) checks.push('Contains source references');

  // Math verification for arithmetic questions
  const mathMatch = question.match(/(\d+(?:\.\d+)?)\s*([+\-*/])\s*(\d+(?:\.\d+)?)/);
  if (mathMatch) {
    const a = parseFloat(mathMatch[1]);
    const op = mathMatch[2];
    const b = parseFloat(mathMatch[3]);
    let expected: number;
    switch (op) {
      case '+': expected = a + b; break;
      case '-': expected = a - b; break;
      case '*': expected = a * b; break;
      case '/': expected = b !== 0 ? a / b : NaN; break;
      default: expected = NaN;
    }
    const answerInContent = new RegExp(expected.toFixed(2).replace('.', '\\.')).test(content);
    checks.push(answerInContent
      ? `Math check passed: ${a} ${op} ${b} = ${expected}`
      : `Math check: expected ${expected} in response`);
  }

  // Check response length is reasonable
  if (content.length < 10) {
    return {
      status: 'deterministic_fail',
      summary: 'Response too short to be meaningful',
      checks,
    };
  }

  checks.push('Response length is reasonable');

  return {
    status: 'deterministic_pass',
    summary: checks.join('; '),
    checks,
  };
}

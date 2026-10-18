import type { ChatCompletionRequest, ChatCompletionResponse } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const EDGE_FUNCTION_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/nexus-ai` : null;

function requireEdgeFunctionUrl(): string {
  if (!EDGE_FUNCTION_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Frontend is missing its Supabase settings. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your hosting provider\'s build settings, then redeploy.');
  }
  return EDGE_FUNCTION_URL;
}

interface Callbacks {
  onToken: (t: string) => void;
  onDone: (r: ChatCompletionResponse) => void;
  onError: (e: string) => void;
}

export async function streamChatCompletion(
  req: ChatCompletionRequest,
  cb: Callbacks,
  signal?: AbortSignal
): Promise<void> {
  try {
    const res = await fetch(`${requireEdgeFunctionUrl()}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        model: req.model || 'openai/gpt-oss-120b',
        messages: req.messages,
        stream: true,
        system_prompt: req.system_prompt,
        temperature: req.temperature,
        max_tokens: req.max_tokens,
        web_research: req.web_research,
        intelligence_mode: req.intelligence_mode,
      }),
      signal,
    });

    if (!res.ok) {
      const txt = await res.text();
      let errMsg: string;
      try {
        const parsed = JSON.parse(txt);
        errMsg = parsed.error || parsed.message || txt;
      } catch {
        errMsg = txt;
      }
      cb.onError(errMsg);
      return;
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let full = '';
    let metadata: { model?: string; provider?: string; tokens_in?: number; tokens_out?: number; latency_ms?: number } = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const j = JSON.parse(data);
          if (j.token) {
            full += j.token;
            cb.onToken(j.token);
          }
          if (j.metadata) {
            metadata = j.metadata;
          }
          if (j.error) {
            cb.onError(j.error);
            return;
          }
        } catch {}
      }
    }

    cb.onDone({
      content: full,
      model: metadata.model || req.model,
      provider: metadata.provider || 'groq',
      tokens_in: metadata.tokens_in || 0,
      tokens_out: metadata.tokens_out || 0,
      latency_ms: metadata.latency_ms || 0,
    });
  } catch (e: any) {
    if (e.name === 'AbortError') {
      cb.onError('cancelled');
    } else {
      cb.onError(e.message);
    }
  }
}

export async function checkProviderStatus() {
  try {
    if (!EDGE_FUNCTION_URL || !SUPABASE_ANON_KEY) {
      return { providers: {} as Record<string, boolean>, available: false };
    }
    const res = await fetch(`${EDGE_FUNCTION_URL}/status`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) return { providers: {} as Record<string, boolean>, available: false };
    const data = await res.json();
    return { providers: data.providers || {}, available: data.available || false };
  } catch {
    return { providers: {} as Record<string, boolean>, available: false };
  }
}

export function classifyQuestion(_c: string) {
  return { type: 'general' as const, needsSearch: false, needsReasoning: false, complexity: 'low' as const };
}

export function verifyResponse(_c: string, _q: string) {
  return { status: 'deterministic_pass' as const, summary: 'ok', checks: [] as string[] };
}

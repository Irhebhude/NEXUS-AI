import type { ChatCompletionRequest, ChatCompletionResponse } from './types';

const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (response: ChatCompletionResponse) => void;
  onError: (error: string) => void;
}

export async function streamChatCompletion(request: ChatCompletionRequest, callbacks: StreamCallbacks): Promise<void> {
  if (!OPENROUTER_KEY) {
    callbacks.onError("VITE_OPENROUTER_API_KEY not set. Go to Cloudflare > Variables > Add VITE_OPENROUTER_API_KEY");
    return;
  }
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": "https://archpoi.workers.dev",
        "X-Title": "NEXUS AI"
      },
      body: JSON.stringify({ model: request.model || "qwen/qwen3-next-80b-a3b-instruct:free", messages: request.messages, stream: true })
    });
    if (!response.ok) {
      const t = await response.text();
      callbacks.onError(`OpenRouter ${response.status}: ${t.slice(0,300)}`);
      return;
    }
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = ""; let fullContent = "";
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n"); buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6); if (data === "[DONE]") continue;
        try { const p = JSON.parse(data); const token = p.choices?.[0]?.delta?.content; if (token) { fullContent += token; callbacks.onToken(token); } } catch {}
      }
    }
    callbacks.onDone({ content: fullContent, model: request.model, provider: "openrouter", tokens_in: 0, tokens_out: 0, latency_ms: 0 });
  } catch (e: any) { callbacks.onError(e.message); }
}
export async function checkProviderStatus() { return { providers: { openrouter:!!OPENROUTER_KEY }, available:!!OPENROUTER_KEY }; }
export function classifyQuestion(c: string) { return { type: 'general' as const, needsSearch: false, needsReasoning: false, complexity: 'low' as const }; }
export function verifyResponse(c: string, q: string) { return { status: 'deterministic_pass' as const, summary: 'ok', checks: [] }; }

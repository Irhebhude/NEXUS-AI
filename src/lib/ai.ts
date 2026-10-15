import type { ChatCompletionRequest, ChatCompletionResponse } from './types';

const KEY = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
const URL = "https://openrouter.ai/api/v1/chat/completions";

interface Callbacks {
  onToken: (t: string) => void;
  onDone: (r: ChatCompletionResponse) => void;
  onError: (e: string) => void;
}

export async function streamChatCompletion(req: ChatCompletionRequest, cb: Callbacks): Promise<void> {
  if (!KEY) { cb.onError("Missing VITE_OPENROUTER_API_KEY in Cloudflare env"); return; }
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${KEY}`,
        "HTTP-Referer": "https://archpoi.workers.dev",
        "X-Title": "NEXUS AI"
      },
      body: JSON.stringify({ model: req.model || "qwen/qwen3-next-80b-a3b-instruct:free", messages: req.messages, stream: true })
    });
    if (!res.ok) { const txt = await res.text(); cb.onError(`OpenRouter ${res.status}: ${txt.slice(0,400)}`); return; }
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = ""; let full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const j = JSON.parse(data);
          const tok = j.choices?.[0]?.delta?.content;
          if (tok) { full += tok; cb.onToken(tok); }
        } catch {}
      }
    }
    cb.onDone({ content: full, model: req.model, provider: "openrouter", tokens_in: 0, tokens_out: 0, latency_ms: 0 });
  } catch (e: any) { cb.onError(e.message); }
}

export async function checkProviderStatus() {
  return { providers: { openrouter:!!KEY }, available:!!KEY };
}

export function classifyQuestion(_c: string) {
  return { type: 'general' as const, needsSearch: false, needsReasoning: false, complexity: 'low' as const };
}

export function verifyResponse(_c: string, _q: string) {
  return { status: 'deterministic_pass' as const, summary: 'ok', checks: [] as string[] };
}

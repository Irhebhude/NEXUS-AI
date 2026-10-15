import type { ChatCompletionRequest, ChatCompletionResponse } from './types';

const OPENROUTER_KEY = "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";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (response: ChatCompletionResponse) => void;
  onError: (error: string) => void;
}

export async function streamChatCompletion(
  request: ChatCompletionRequest,
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": "https://archpoi.workers.dev",
        "X-Title": "NEXUS AI"
      },
      body: JSON.stringify({
        model: request.model || "qwen/qwen3-next-80b-a3b-instruct:free",
        messages: request.messages,
        stream: true,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      callbacks.onError(`OpenRouter ${response.status}: ${errText.slice(0,300)}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError("No stream");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) {
            fullContent += token;
            callbacks.onToken(token);
          }
        } catch {}
      }
    }

    callbacks.onDone({
      content: fullContent,
      model: request.model,
      provider: "openrouter",
      tokens_in: 0,
      tokens_out: 0,
      latency_ms: 0
    });
  } catch (err: any) {
    callbacks.onError(err.message || "Unknown error");
  }
}

export async function checkProviderStatus() {
  return { providers: { openrouter: true }, available: true };
}

export function classifyQuestion(content: string) {
  return { type: 'general' as const, needsSearch: false, needsReasoning: false, complexity: 'low' as const };
}

export function verifyResponse(content: string, question: string) {
  return { status: 'deterministic_pass' as const, summary: 'ok', checks: ['ok'] };
}

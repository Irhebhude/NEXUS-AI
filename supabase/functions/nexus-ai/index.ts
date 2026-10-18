const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage { role: "user" | "assistant" | "system"; content: string; }
interface ChatRequest { messages: ChatMessage[]; model?: string; temperature?: number; max_tokens?: number; system_prompt?: string; }

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const GROQ_CHAT_MODELS = new Set([
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-safeguard-20b",
]);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function getKey(): string | null {
  return Deno.env.get("GROQ_API_KEY")?.trim() || null;
}

async function normalizeStream(upstream: Response, model: string): Promise<ReadableStream<Uint8Array>> {
  const reader = upstream.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  void (async () => {
    let buffer = "";
    let tokensOut = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              tokensOut += 1;
              await writer.write(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
            }
          } catch {
            continue;
          }
        }
      }
      await writer.write(encoder.encode(`data: ${JSON.stringify({ metadata: { model, provider: "groq", tokens_in: 0, tokens_out: tokensOut, latency_ms: 0 } })}\n\n`));
      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } finally {
      await writer.close();
    }
  })();

  return stream.readable;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  const path = new URL(request.url).pathname.replace(/^\/nexus-ai/, "") || "/";
  const key = getKey();
  if ((path === "/" || path === "/status") && request.method === "GET") {
    return json({ providers: { groq: Boolean(key) }, available: Boolean(key) });
  }
  if (path !== "/chat" || request.method !== "POST") return json({ error: "Not found" }, 404);
  if (!key) return json({ error: "Groq API key is not configured." }, 503);

  try {
    const body: ChatRequest = await request.json();
    const model = body.model && GROQ_CHAT_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;
    const messages = body.system_prompt
      ? [{ role: "system" as const, content: body.system_prompt }, ...body.messages]
      : body.messages;
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, temperature: body.temperature ?? 0.7, max_tokens: body.max_tokens, stream: true }),
    });
    if (!upstream.ok) {
      if (upstream.status === 401) return json({ error: "Invalid Groq API key." }, 401);
      if (upstream.status === 404) return json({ error: `Groq model not found: ${model}` }, 404);
      return json({ error: "Groq could not complete the request." }, upstream.status);
    }
    return new Response(await normalizeStream(upstream, model), { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
  } catch {
    return json({ error: "The AI request could not be completed." }, 500);
  }
});

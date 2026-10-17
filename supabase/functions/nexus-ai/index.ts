const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getGroqKey(): string | null {
  const key = Deno.env.get("GROQ_API_KEY")?.trim();
  console.info("[nexus-ai] Groq key configured:", Boolean(key));
  return key || null;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/nexus-ai/, "") || "/";

  if ((path === "/" || path === "/status") && request.method === "GET") {
    return json({ providers: { groq: Boolean(getGroqKey()) }, available: Boolean(getGroqKey()) });
  }

  if (path !== "/chat" || request.method !== "POST") {
    return json({ error: "Not found" }, 404);
  }

  try {
    const apiKey = getGroqKey();
    if (!apiKey) {
      return json({ error: "Groq API key is not configured. Add GROQ_API_KEY as a server secret." }, 503);
    }

    const body: ChatRequest = await request.json();
    const messages = body.system_prompt
      ? [{ role: "system" as const, content: body.system_prompt }, ...body.messages]
      : body.messages;
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model || DEFAULT_MODEL,
        messages,
        temperature: body.temperature ?? 0.7,
        max_tokens: body.max_tokens,
        stream: true,
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 401) return json({ error: "Invalid Groq API key. Replace GROQ_API_KEY with a valid key." }, 401);
      if (upstream.status === 404) return json({ error: `Groq model not found: ${body.model || DEFAULT_MODEL}` }, 404);
      return json({ error: "Groq could not complete the request. Please try again." }, upstream.status);
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch {
    return json({ error: "The AI request could not be completed. Please try again." }, 500);
  }
});

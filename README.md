# NEXUS AI

Universal AI Intelligence, Reasoning, Research & Verification Platform

## Overview

NEXUS AI is a provider-independent AI platform with a ChatGPT-style conversational interface. It supports multiple AI providers (OpenAI, Anthropic, Groq, Google AI) through a single server-side proxy, with built-in question classification, answer verification, persistent memory, and conversation history.

## Architecture

```
┌─────────────────────────────────────────────┐
│                   Frontend                    │
│  React + TypeScript + Tailwind CSS (Vite)    │
│                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Sidebar  │  │ Chat Area│  │ Composer │   │
│  │ (convos) │  │ (messages│  │ (input)  │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                               │
│  ┌──────────────────────────────────────┐   │
│  │           AI Orchestration            │   │
│  │  Question Classification → Routing    │   │
│  │  Verification Engine → Deterministic  │   │
│  └──────────────────────────────────────┘   │
└───────────────────┬───────────────────────────┘
                    │ fetch (SSE streaming)
┌───────────────────▼───────────────────────────┐
│              Edge Function (Deno)              │
│  nexus-ai/index.ts                            │
│                                               │
│  • Provider detection (runtime key check)     │
│  • Request routing & fallback                 │
│  • Streaming proxy (OpenAI/Anthropic/Groq/    │
│    Google AI)                                 │
│  • CORS headers on all responses              │
└───────────────────┬───────────────────────────┘
                    │
┌───────────────────▼───────────────────────────┐
│              Supabase (PostgreSQL)             │
│                                               │
│  Tables:                                      │
│  • conversations (title, model, timestamps)   │
│  • messages (role, content, metadata)         │
│  • memories (key, content, category)          │
│  • usage_metrics (provider, tokens, latency)  │
│  • verification_results (status, claims)      │
│                                               │
│  All tables have RLS enabled.                 │
└───────────────────────────────────────────────┘
```

## Implemented Systems (13 Technology Stack)

| # | System | Status | Description |
|---|--------|--------|-------------|
| 1 | AI Orchestration Engine | **Active** | Multi-provider proxy with automatic fallback, streaming, and provider health detection |
| 2 | Evidence-Based Reasoning Engine | **Active** | Question classification (factual, math, code, research, reasoning, geographic, general) with task-based routing |
| 3 | Independent Answer Verification Engine | **Active** | Deterministic checks: math verification, citation detection, hedging detection, response length validation |
| 4 | Intelligent Web Research Engine | **Interface Ready** | UI toggle for web research; requires a search API key to be configured as an edge function secret |
| 5 | Universal Knowledge Retrieval Engine | **Interface Ready** | Document ingestion architecture defined; requires embedding provider configuration |
| 6 | Contradiction & Truth Assessment Engine | **Interface Ready** | Verification result types support contradiction states; full implementation requires multi-source comparison |
| 7 | Multimodal Intelligence Engine | **Interface Ready** | Attachment button in composer; requires vision-capable model configuration |
| 8 | Persistent Memory Engine | **Active** | Cross-conversation memory with create/delete operations, stored in Supabase |
| 9 | Controlled Autonomous Task Execution Engine | **Interface Ready** | Question decomposition logic implemented; multi-step execution requires tool-use capable model |
| 10 | Adaptive Evaluation & Optimization Engine | **Interface Ready** | Usage metrics tracked in database; benchmark dataset and regression tests require configuration |
| 11 | POI Geo-Intelligence Engine | **Interface Ready** | Geographic question classification active; geocoding requires API key |
| 12 | AI Security & Integrity Engine | **Active** | Server-side key management, RLS on all tables, input validation, error normalization |
| 13 | Developer Integration & Deployment Engine | **Active** | Edge function API with /status and /chat endpoints, documented schemas, CORS headers |

## Setup

### Prerequisites

- Node.js 18+
- Supabase project (already provisioned)

### Installation

```bash
npm install
```

### Development

The dev server runs automatically. No manual start required.

### Build

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

## Environment Variables

All Supabase variables are pre-populated. To enable AI providers, add the
appropriate API key as an edge function secret:

| Secret Name | Provider | Where to Get Key |
|-------------|----------|-----------------|
| `OPENAI_API_KEY` | OpenAI | https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY` | Anthropic | https://console.anthropic.com/ |
| `GROQ_API_KEY` | Groq | https://console.groq.com/keys |
| `GOOGLE_AI_API_KEY` | Google AI | https://aistudio.google.com/apikey |

At least one provider key must be configured for AI responses to work.
The platform automatically detects which keys are available and routes
requests accordingly.

## API Reference

### Edge Function: `nexus-ai`

**Base URL:** `{SUPABASE_URL}/functions/v1/nexus-ai`

#### `GET /status`

Returns which AI providers are configured.

```json
{
  "providers": {
    "openai": true,
    "anthropic": false,
    "groq": false,
    "google": false
  },
  "available": true
}
```

#### `POST /chat`

Sends a chat completion request with streaming (SSE) response.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "model": "gpt-4o-mini",
  "system_prompt": "You are NEXUS AI...",
  "temperature": 0.7,
  "stream": true
}
```

**Response (SSE stream):**
```
data: {"token": "Hello"}
data: {"token": "!"}
data: {"metadata": {"model": "gpt-4o-mini", "provider": "openai", "latency_ms": 1234}}
data: [DONE]
```

## Database Schema

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `conversations` | Chat sessions | id, title, model, created_at, updated_at |
| `messages` | Individual messages | id, conversation_id, role, content, metadata (jsonb) |
| `memories` | Persistent user memory | id, key, content, category |
| `usage_metrics` | AI usage tracking | provider, model, tokens_in, tokens_out, latency_ms |
| `verification_results` | Verification outcomes | message_id, status, claims (jsonb), summary |

All tables have Row Level Security enabled.

## Dependency Inventory

| Dependency | Version | License | Purpose |
|-----------|---------|---------|---------|
| react | ^18.3.1 | MIT | UI framework |
| react-dom | ^18.3.1 | MIT | React DOM renderer |
| @supabase/supabase-js | ^2.57.4 | MIT | Supabase client |
| lucide-react | ^0.446.0 | ISC | Icon library |
| vite | ^5.4.2 | MIT | Build tool |
| typescript | ^5.5.3 | Apache-2.0 | Type checking |
| tailwindcss | ^3.4.1 | MIT | CSS framework |

## Known Limitations

1. **Web Research Engine** — The UI toggle exists, but no search API is
   configured. A search provider key (e.g., Tavily, Serper) must be added
   as an edge function secret to enable live web research.

2. **Knowledge Retrieval Engine** — Document upload and vector search are
   not yet active. The type system and database schema support it, but
   an embedding provider and vector store integration are required.

3. **Multimodal Engine** — The attachment button is present but file
   processing is not implemented. A vision-capable model is needed for
   image analysis.

4. **Geo-Intelligence Engine** — Geographic question classification works,
   but geocoding requires a provider API key (e.g., Google Maps, Nominatim).

5. **Task Execution Engine** — Question decomposition and classification
   are implemented, but multi-step autonomous execution requires a
   tool-use capable model and tool definitions.

6. **Single-tenant** — The current deployment does not require
   authentication. All data is accessible via the anon key. For
   multi-user deployment, add Supabase Auth and update RLS policies
   to use `auth.uid()` ownership checks.

7. **No automated test suite** — Tests are not included in this build.
   The type checker and build process verify code correctness but not
   feature correctness.

## Project Structure

```
src/
├── components/
│   ├── Composer.tsx        # Message input with model selector
│   ├── EmptyState.tsx      # Welcome screen with example prompts
│   ├── MessageBubble.tsx   # Message rendering with markdown & verification
│   ├── SettingsPanel.tsx   # Settings drawer (theme, providers, memory)
│   └── Sidebar.tsx         # Conversation list with search & rename
├── hooks/
│   └── useChat.ts          # Main chat orchestration hook
├── lib/
│   ├── ai.ts               # AI orchestration, classification, verification
│   ├── db.ts               # Database access layer (Supabase queries)
│   ├── markdown.ts         # Markdown renderer with syntax highlighting
│   ├── providers.ts        # Provider registry and model catalog
│   ├── supabase.ts         # Supabase client singleton
│   ├── theme.ts            # Light/dark theme color system
│   └── types.ts            # Shared TypeScript types
├── App.tsx                 # Root component
├── main.tsx                # Entry point
└── index.css               # Global styles + markdown styles

supabase/
├── config.toml             # Edge function configuration
├── functions/
│   └── nexus-ai/
│       └── index.ts        # AI proxy edge function (Deno)
└── migrations/
    └── *.sql               # Database schema migrations
```

## Security Notes

- All AI provider API keys are stored as Supabase edge function secrets
  and never exposed to the browser.
- Row Level Security is enabled on every database table.
- The edge function includes mandatory CORS headers on all responses.
- Provider error messages are normalized before reaching the client.
- Request cancellation is supported via AbortController.
- No credentials, tokens, or secrets are committed to source control.

<div align="center">

# 🔍 Scout — AI Research Agent

**An autonomous, multi-step research assistant powered by Gemini 2.5 Flash and LangGraph.**

Ask Scout a question. It decomposes it into sub-questions, searches the web in parallel, synthesizes the findings, and streams the answer — live — back to your browser.

[![CI](https://img.shields.io/github/actions/workflow/status/rdtank/scout-ai-agent/ci.yml?branch=main&label=CI&style=flat-square)](https://github.com/rdtank/scout-ai-agent/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![LangGraph](https://img.shields.io/badge/LangGraph-1.4-8b5cf6?style=flat-square)](https://langchain-ai.github.io/langgraphjs/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285f4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-f69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)

</div>

---

## Demo

> **Live app:** [scout-ai-agent-pied.vercel.app](https://scout-ai-agent-pied.vercel.app/)

---

## What is Scout?

Scout is a full-stack AI agent that conducts real research — not just a chatbot that rephrases its training data. When you ask a question, it:

1. **Plans** — breaks the question into 2–4 focused sub-questions using Gemini
2. **Researches** — searches the live web (via Tavily) for each sub-question
3. **Synthesizes** — combines findings into a single, well-structured answer with citations
4. **Remembers** — stores your past research in Redis so follow-up questions are smarter
5. **Streams** — sends every step to your browser in real-time via Server-Sent Events

---

## Architecture

```
Browser (React 19 + Vite)
        │  SSE stream
        ▼
Express API  ──►  LangGraph StateGraph
                       │
              ┌────────┼────────────────┐
              ▼        ▼                ▼
          Memory    Planner        Researcher ──► Tavily Web Search
          (Redis)   (Gemini)       (Gemini)          │
                        │              │ ×N           │
                        └──────────────┘             ▼
                                               Synthesizer (Gemini)
                                                      │
                                               Supabase / Redis
                                              (memory persistence)
```

**Agent graph nodes:**

| Node          | Role                                                                             |
| ------------- | -------------------------------------------------------------------------------- |
| `memory`      | Loads the user's past research from Redis before the agent starts                |
| `planner`     | Calls Gemini to decompose the question into 2–4 sub-questions                    |
| `researcher`  | Searches the web and summarises findings — runs in a loop, once per sub-question |
| `synthesizer` | Merges all findings + memory context into the final answer, then saves it        |

---

## Features

- **Agentic reasoning** — multi-step planner → researcher → synthesizer pipeline with a LangGraph `StateGraph`
- **Live SSE streaming** — the UI updates in real time as each node completes; no polling, no waiting
- **Persistent memory** — per-user research history stored in Redis (7-day TTL, last 10 entries)
- **Guardrails** — input validation (Zod), tool allowlist, max step cap, 120 s stream timeout
- **Markdown answer rendering** — headings, bold, italic, code, and lists rendered without any extra library
- **Dockerised backend** — multi-stage Alpine Dockerfile; deploy to Railway in one click
- **CI/CD** — GitHub Actions: type-check → unit tests → build → Playwright E2E, all on every push

---

## Tech Stack

### Backend

| Layer               | Technology                                   |
| ------------------- | -------------------------------------------- |
| Runtime             | Node.js 22 + TypeScript ESM                  |
| Framework           | Express 4                                    |
| AI Model            | Gemini 2.5 Flash (`@langchain/google-genai`) |
| Agent Orchestration | LangGraph 1.4 (`StateGraph`)                 |
| Web Search          | Tavily API                                   |
| Memory Store        | Redis (ioredis)                              |
| Vector DB           | Supabase (pgvector)                          |
| Validation          | Zod                                          |
| Tests               | Vitest                                       |
| Build               | tsup                                         |
| Container           | Docker (multi-stage Alpine)                  |

### Frontend

| Layer      | Technology                                     |
| ---------- | ---------------------------------------------- |
| Framework  | React 19                                       |
| Build Tool | Vite 8                                         |
| Language   | TypeScript 6                                   |
| Streaming  | `EventSource` / Server-Sent Events             |
| Styling    | Vanilla CSS (custom design system, dark theme) |
| Tests      | Playwright (E2E)                               |

### Infrastructure

| Service        | Purpose                                 |
| -------------- | --------------------------------------- |
| Railway        | Backend (Docker) + Redis                |
| Vercel         | Frontend (static)                       |
| Supabase       | Postgres + pgvector for document search |
| GitHub Actions | CI/CD pipeline                          |

---

## Project Structure

```
scout-ai-agent/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── agent/
│   │   │   │   ├── graph.ts        # LangGraph StateGraph — all four nodes
│   │   │   │   ├── memory.ts       # Redis read/write helpers
│   │   │   │   ├── guardrails.ts   # Input schema, tool allowlist, step cap
│   │   │   │   └── prompt.ts       # System prompts for each node
│   │   │   ├── api/routes/
│   │   │   │   └── agent.ts        # POST /api/agent/stream (SSE endpoint)
│   │   │   ├── tools/
│   │   │   │   ├── webSearch.ts    # Tavily search tool
│   │   │   │   ├── docSearch.ts    # pgvector document search
│   │   │   │   └── calculator.ts   # Math expression evaluator
│   │   │   └── lib/
│   │   │       ├── env.ts          # Validated environment variables
│   │   │       ├── redis.ts        # ioredis client
│   │   │       └── db.ts           # Postgres/pgvector client
│   │   └── Dockerfile
│   └── frontend/
│       ├── src/
│       │   ├── App.tsx             # Root component + search state
│       │   ├── components/
│       │   │   ├── SearchForm.tsx  # Input + submit (useFormStatus)
│       │   │   ├── ActivityFeed.tsx# Live research cards (status/tool/error)
│       │   │   └── Answer.tsx      # Markdown renderer + answer panel
│       │   └── hooks/
│       │       └── useAgentStream.ts # EventSource hook, SSE parser
│       └── e2e/                    # Playwright tests
├── .github/workflows/ci.yml        # GitHub Actions CI pipeline
├── docker-compose.yml
└── pnpm-workspace.yaml
```

---

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 11+ (`npm i -g pnpm`)
- A [Gemini API key](https://aistudio.google.com/app/apikey) (free tier works)
- A [Tavily API key](https://tavily.com/) (free tier works)
- Redis (local Docker or [Railway](https://railway.app/))

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/scout-ai-agent.git
cd scout-ai-agent
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# fill in the values below
```

### 3. Start development servers

```bash
# Backend (port 3001)
pnpm --filter @scout/backend dev

# Frontend (port 5173) — in a new terminal
pnpm --filter @scout/frontend dev
```

Open [http://localhost:5173](http://localhost:5173) and ask Scout anything.

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable         | Required | Description                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `GEMINI_API_KEY` | Yes      | Google AI Studio API key                           |
| `TAVILY_API_KEY` | Yes      | Tavily web search API key                          |
| `REDIS_URL`      | Yes      | Redis connection string (`redis://localhost:6379`) |
| `DATABASE_URL`   | No       | Supabase Postgres URL (for document search)        |
| `PORT`           | No       | HTTP port (default `3001`)                         |

### Frontend (`apps/frontend/.env`)

| Variable       | Required | Description                                           |
| -------------- | -------- | ----------------------------------------------------- |
| `VITE_API_URL` | No       | Backend base URL (leave empty for same-origin in dev) |

---

## Deployment

### Backend → Railway

1. Create a new Railway project
2. Add a **Redis** service
3. Add a **GitHub** service pointed at this repo
4. Set **Root Directory** to blank, **Dockerfile Path** to `apps/backend/Dockerfile`
5. Add environment variables: `GEMINI_API_KEY`, `TAVILY_API_KEY`, `REDIS_URL` (from the Railway Redis service)

### Frontend → Vercel

1. Import the repo in Vercel
2. Set **Framework** to `Vite`, **Root Directory** to `apps/frontend`
3. Add environment variable: `VITE_API_URL` = your Railway backend URL

---

## Testing

```bash
# Backend unit tests (Vitest)
pnpm --filter @scout/backend test

# Frontend E2E tests (Playwright)
pnpm --filter @scout/frontend test:e2e

# All tests (run by CI)
pnpm test
```

The E2E suite mocks the SSE endpoint so tests run fast with no real API calls.

---

## How the Streaming Works

The frontend opens an `EventSource` connection to `POST /api/agent/stream`. The backend pipes LangGraph's `streamMode: "updates"` output through Express `res.write()` as `data: <json>\n\n` chunks:

```
data: {"type":"status","data":{"message":"Starting research..."}}

data: {"type":"status","data":{"message":"Research plan ready","subQuestions":["...","..."]}}

data: {"type":"tool_result","data":{"step":1,"total":3,"subQuestion":"..."}}

data: {"type":"answer","data":{"text":"## Answer\n\n..."}}
```

Each card in the activity feed animates in as its event arrives.

---

## Guardrails

Scout enforces safety limits at every layer:

| Guardrail          | Value                                  | Where enforced                                         |
| ------------------ | -------------------------------------- | ------------------------------------------------------ |
| Min query length   | 3 chars                                | Zod schema on `POST /stream`                           |
| Max query length   | 500 chars                              | Zod schema on `POST /stream`                           |
| Max research steps | 8                                      | `shouldContinueResearch` edge in LangGraph             |
| Tool allowlist     | `webSearch`, `docSearch`, `calculator` | `isToolAllowed()` check before each tool call          |
| Stream timeout     | 120 seconds                            | `setTimeout` in the SSE route, closes with error event |

---

## Key Design Decisions

**Why LangGraph?** The research pipeline is a graph with a loop (`researcher` runs N times). LangGraph makes the loop, state accumulation, and conditional edges explicit and testable rather than buried in recursive function calls.

**Why SSE instead of WebSockets?** Research is unidirectional (server → client). SSE is simpler, HTTP-native, and works through Vercel/Railway proxies without configuration.

---

## Roadmap

- [ ] Streaming token-by-token answer (not just full node output)
- [ ] Document upload + pgvector RAG pipeline
- [ ] Multi-turn conversation memory (not just single-query history)
- [ ] Rate limiting + auth middleware

---

<div align="center">

Built with TypeScript, LangGraph, Gemini, and a lot of tea.

</div>

---
phase: "01"
plan: "02"
subsystem: capture-api
tags: [openai, extraction, zod, api-route, auth]
dependency_graph:
  requires:
    - "01-01"  # Drizzle schema + DB singleton
  provides:
    - "POST /api/capture/extract"
    - "KnowledgeItemCandidate type"
    - "capture-client.ts OpenAI utilities"
  affects:
    - "01-03"  # Text paste UI (calls extract endpoint)
    - "01-04"  # Confirmation UI (uses KnowledgeItemCandidate type)
tech_stack:
  added:
    - "openai v6.32.0 - OpenAI SDK for GPT-4o-mini structured output"
  patterns:
    - "zod/v3 import path for zodResponseFormat compatibility with Zod v4 project"
    - "chat.completions.parse (openai v6 API — not beta.chat)"
    - "Paragraph-boundary text chunking at 3000 chars"
    - "Supabase service-role auth check pattern from paypal routes"
key_files:
  created:
    - src/app/api/capture/capture-client.ts
    - src/app/api/capture/extract/route.ts
  modified: []
decisions:
  - "Used chat.completions.parse instead of beta.chat.completions.parse — openai v6.32.0 moved structured output to non-beta path"
  - "zod/v3 import required for zodResponseFormat — openai SDK vendored schema converter not yet updated for Zod v4"
  - "temperature: 0 enforced to prevent LLM hallucination in extraction"
  - "source field is optional in schema — model should not invent URLs"
metrics:
  duration: "3 minutes"
  completed: "2026-03-22"
  tasks_completed: 2
  files_created: 2
---

# Phase 1 Plan 02: AI Extraction Pipeline Summary

**One-liner:** GPT-4o-mini structured extraction with zod/v3 + paragraph chunking, returning KnowledgeItemCandidate[] via authenticated POST endpoint.

---

## What Was Built

### `src/app/api/capture/capture-client.ts`

OpenAI client module providing the AI extraction utilities:

- **OpenAI singleton** — `new OpenAI({ apiKey: process.env.OPENAI_API_KEY })`
- **KnowledgeItemCandidateSchema** — Zod schema (using `zod/v3` import) for a single extracted item
- **ExtractionResultSchema** — wrapper schema with `items` array
- **KnowledgeItemCandidate** — TypeScript type inferred from the schema
- **CaptureError** — domain error class with `code` and `statusCode` fields
- **chunkText(text, maxChars=3000)** — splits text at paragraph boundaries (`\n\n+`) into chunks of at most 3000 characters
- **extractKnowledgeItems(text, sourceUrl?)** — orchestrates chunking, per-chunk OpenAI calls, and deduplication by title

### `src/app/api/capture/extract/route.ts`

`POST /api/capture/extract` handler:

**Request shape:**
```typescript
// POST /api/capture/extract
// Headers: Authorization: Bearer <supabase-token>
// Body: { text: string; sourceUrl?: string }
```

**Response shapes:**
```typescript
// 200 Success
{ items: KnowledgeItemCandidate[] }

// 200 No items extracted (graceful)
{ error: string; code: "NO_ITEMS_EXTRACTED"; items: [] }

// 400 Bad request
{ error: string; code: "MISSING_TEXT" | "TEXT_TOO_SHORT" }

// 401 Unauthorized
{ error: string; code: "UNAUTHORIZED" }

// 413 Text too long
{ error: string; code: "TEXT_TOO_LONG" }

// 422 Model refused
{ error: string; code: "MODEL_REFUSED" }

// 500 Internal error
{ error: string; code: "INTERNAL_ERROR" }
```

---

## KnowledgeItemCandidate Type

```typescript
interface KnowledgeItemCandidate {
  title: string;
  content: string;   // max 200 chars — optimized for FSRS spaced repetition
  source?: string;   // optional — AI only fills if explicitly present in source text
  domain: string;    // e.g. "React", "Marketing", "Economics"
  tags: string[];    // 2-5 keywords, AI-generated
}
```

---

## Critical Note: zod/v3 Import Path

**Must use `import { z } from "zod/v3"` in any file calling `zodResponseFormat`.**

The project has `zod@4.3.6` installed. The `zodResponseFormat` helper from `openai/helpers/zod` uses a bundled `zod-to-json-schema` that still expects `ZodFirstPartyTypeKind` which was removed in Zod v4. Using the normal `"zod"` import produces a runtime API error:

```
Invalid schema for response_format: schema must be a JSON Schema of 'type: "object"', got 'type: "None"'
```

Zod v4 ships a backward-compat shim at `"zod/v3"` specifically for this case. This pattern is documented in OpenAI's official `helpers.md` as the workaround.

---

## openai v6 API Note

In `openai` v6.32.0, structured output parsing is accessed via `client.chat.completions.parse()` — **not** `client.beta.chat.completions.parse()`. The `beta` namespace in v6 contains `realtime`, `chatkit`, and `assistants` — `chat` is no longer under `beta`. Using the `beta.chat` path causes a TypeScript error and runtime failure.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect OpenAI API path**

- **Found during:** Task 1 (TypeScript check after writing capture-client.ts)
- **Issue:** Plan specified `openai.beta.chat.completions.parse` but openai v6.32.0 moved this to `openai.chat.completions.parse`. TypeScript error: `Property 'chat' does not exist on type 'Beta'`.
- **Fix:** Changed call site to `openai.chat.completions.parse(...)`.
- **Files modified:** `src/app/api/capture/capture-client.ts`
- **Commit:** e3bb594

---

## Known Stubs

None — this plan creates server-side logic only; no UI rendering paths. The extracted items are returned as JSON for Plan 04 (ConfirmationCards) to render.

---

## Self-Check: PASSED

- FOUND: `src/app/api/capture/capture-client.ts`
- FOUND: `src/app/api/capture/extract/route.ts`
- FOUND: commit e3bb594 (capture-client.ts)
- FOUND: commit 04ead6c (extract route)

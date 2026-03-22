# Technology Stack

**Project:** 笔记助手 (bijiassistant) — AI Learning Assistant with Voice Transcription
**Researched:** 2026-03-22
**Confidence:** HIGH (all core recommendations verified against official docs or npm registry)

---

## Existing Stack (Already In Place — Do Not Change)

The codebase has an established foundation. These are confirmed from `package.json` and `CLAUDE.md`.

| Technology | Version (installed) | Purpose |
|------------|--------------------|---------|
| Next.js | 16.2.0 | App framework, App Router, API routes |
| React | 19.2.4 | UI |
| TypeScript | ^5 (strict) | Type safety |
| Tailwind CSS | ^4 | Styling |
| @opennextjs/cloudflare | ^1.17.1 | Cloudflare Workers deployment adapter |
| @supabase/supabase-js | ^2.99.3 | Auth, DB client, Storage client |
| drizzle-orm | ^0.45.1 | ORM (schemas not yet written) |
| drizzle-kit | ^0.31.10 | Migration tooling |
| zod | ^4.3.6 | Schema validation |
| zustand | ^5.0.12 | Client-side state management |
| react-hook-form | ^7.71.2 | Form handling |
| wrangler | ^4.76.0 | Cloudflare CLI |

**Constraint:** All new packages must be compatible with the Cloudflare Workers Node.js runtime (`nodejs_compat_v2`). Do not introduce packages that require native Node.js addons (`.node` binaries) or that use unsupported Node.js APIs at the edge.

---

## Recommended Stack for New Features

### Audio Capture (Browser)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| MediaRecorder API | Browser native | Record audio in-browser | No library needed; universally supported in Chrome/Firefox/Safari 2025; `audio/webm;codecs=opus` supported by all modern browsers and accepted by OpenAI Whisper without conversion |

**Pattern:** Use `MediaRecorder.isTypeSupported()` with priority order: `audio/webm;codecs=opus` → `audio/webm` → `audio/mp4` → `audio/wav`. Record in 2-second chunks for resilience. Stop all stream tracks after recording ends to release mic.

**Do NOT use:** `Recorder.js` (unmaintained), `RecordRTC` (adds 50kb+ bundle for what is native in 2025).

**Confidence:** HIGH (MDN, Chrome Developers blog, multiple 2025 integration guides verified)

---

### Audio Storage (Upload)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Storage | Already installed | Store audio blobs | Already integrated; supports up to 5GB files; S3-compatible; RLS-aware |

**Upload Pattern:** Use signed URL approach via a Server Action — generate the signed upload URL server-side (after auth check), return it to the client, then client uploads directly to Supabase Storage. This bypasses Next.js Server Action's 1MB body limit.

```typescript
// Server Action: generate signed URL only
const { data } = await supabaseAdmin.storage
  .from("audio")
  .createSignedUploadUrl(`${userId}/${filename}`);
// Client uses data.signedUrl to PUT the audio blob directly
```

**Do NOT use:** Route handler with raw binary body (hits Cloudflare Workers 100MB request body limit, also bypasses auth logic cleanly).

**Confidence:** HIGH (Supabase official docs verified)

---

### Transcription API

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| openai (npm) | ^6.32.0 (latest) | Whisper / GPT-4o transcription | Official SDK; server-side only; Cloudflare Workers compatible via `nodejs_compat_v2` |
| Model: `gpt-4o-mini-transcribe` | — | Speech-to-text | OpenAI's recommended model as of March 2025; better accuracy than legacy `whisper-1`; $0.006/min pricing; supports 50+ languages; 25 MB file limit |

**Installation:**
```bash
npm install openai
```

**API Route Pattern:** POST `/api/transcribe` receives audio URL from Supabase Storage (not raw audio), downloads it server-side, sends to OpenAI. Keep API key in Wrangler secrets for Cloudflare deployment.

**Why not `whisper-1`:** OpenAI now recommends `gpt-4o-mini-transcribe` over the legacy Whisper-1 model for better accuracy. Both support the same `audio/transcriptions` endpoint.

**Why not Cloudflare Workers AI:** Workers AI transcription model (`@cf/openai/whisper`) is a community tier offering with no SLA guarantees and lower accuracy than OpenAI's hosted models. Reserve as a cost-optimization fallback only.

**25 MB chunking:** Audio files from typical learning sessions (5-30 minutes) will exceed 25 MB in WebM/Opus format. Implement server-side chunking before calling the API, or limit recording sessions to ~20 minutes (estimated ~10 MB at Opus default bitrate 32kbps).

**Confidence:** HIGH (OpenAI API reference + multiple 2025 integration guides verified)

---

### AI Knowledge Extraction

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| openai (npm) | ^6.32.0 | GPT-4o structured extraction | Same package as transcription; no extra dependency |
| Model: `gpt-4o-mini` | — | Extract knowledge items from transcript | Cost-optimal; Structured Outputs guarantee 100% schema compliance; sufficient for knowledge extraction vs. `gpt-4o` |
| `openai/helpers/zod` | bundled with openai | `zodResponseFormat()` helper | Converts Zod schema directly to OpenAI response_format; eliminates manual JSON schema authoring |
| zod | ^4.3.6 (already installed) | Define extraction output schema | Already in the codebase; Zod 4 is 14x faster than Zod 3 |

**Pattern:** Define the knowledge item schema in Zod, pass it through `zodResponseFormat`, use `client.beta.chat.completions.parse()` for guaranteed structured output:

```typescript
import { zodResponseFormat } from "openai/helpers/zod";
const KnowledgeItem = z.object({
  title: z.string(),
  summary: z.string(),
  domain: z.string(),
  tags: z.array(z.string()),
  keyPoints: z.array(z.string()),
});
const extraction = await openai.beta.chat.completions.parse({
  model: "gpt-4o-mini",
  messages: [...],
  response_format: zodResponseFormat(KnowledgeItem, "knowledge_item"),
});
```

**Do NOT use:** `response_format: { type: "json_object" }` (old JSON mode, no schema guarantees). Always check `message.refusal` before parsing (model may return refusal instead of JSON).

**Confidence:** HIGH (OpenAI official Structured Outputs guide verified)

---

### Spaced Repetition Scheduler

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ts-fsrs | ^5.2.3 (latest) | FSRS spaced repetition algorithm | Pure TypeScript, zero dependencies, ESM/CJS/UMD, Cloudflare Workers compatible; FSRS is the modern successor to SM-2 with superior retention prediction based on DSR memory model |

**Installation:**
```bash
npm install ts-fsrs
```

**Why FSRS over SM-2:** FSRS models memory with three variables (Difficulty, Stability, Retrievability) derived from real user data. SM-2's fixed formula dates from 1987 and doesn't adapt. Anki switched to FSRS as its default in 2023. The `ts-fsrs` package is the reference TypeScript implementation from the open-spaced-repetition organization.

**Why not `supermemo` (SM-2 npm package):** SM-2 is scientifically outdated. FSRS achieves better retention rates on the same review frequency. The project doc cites "Ebbinghaus forgetting curve" — FSRS implements this more accurately than SM-2.

**Why not custom implementation:** ts-fsrs is the actively maintained reference implementation. Writing a custom scheduler is unnecessary complexity with high probability of correctness bugs.

**Rating scale:** FSRS uses 1-4 ratings (Again / Hard / Good / Easy), simpler for users than SM-2's 0-5 scale.

**Confidence:** HIGH (npm registry confirmed v5.2.3; GitHub repo verified active maintenance; Anki's adoption of FSRS well-documented)

---

### Database Schema & ORM

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| drizzle-orm | ^0.45.1 (already installed) | Type-safe Postgres queries | Already in codebase; zero-dependency; tree-shakeable; Cloudflare Workers compatible; produces SQL-like TypeScript |
| drizzle-kit | ^0.31.10 (already installed) | Migration generation | Pairs with drizzle-orm |
| drizzle-zod | ^0.7.x | Zod schema generation from Drizzle tables | Generates insert/select validation schemas automatically from table definitions; eliminates manual duplication |
| postgres (npm) | ^3.4.x | Node.js Postgres driver | Required for Drizzle + Supabase direct connection; disable `prepare: false` for Supabase's Transaction pool mode |

**Installation (missing pieces):**
```bash
npm install drizzle-zod postgres
```

**Critical Config:** Supabase connection pooling uses Transaction mode by default. Must set `prepare: false` on the postgres client, otherwise prepared statements will error.

```typescript
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle({ client });
```

**Schema location:** `src/db/schema.ts` — single file covering all 5 planned tables (users, transcriptions, payments, subscriptions, user_balances).

**Migration output:** `supabase/migrations/` — aligns with Supabase CLI conventions.

**Confidence:** HIGH (Drizzle official docs, Supabase docs both verified)

---

### Notification / Reminder System

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase Cron (pg_cron) | Built into Supabase | Scheduled review reminder jobs | Free tier includes pg_cron; runs SQL/Edge Functions on schedule; no external job queue needed for MVP |
| Supabase Edge Functions | Built into Supabase | Send review reminder emails | Lightweight Deno functions triggered by pg_cron; can call Resend/SendGrid for email |

**MVP reminder flow:** pg_cron runs daily → queries `knowledge_items` where `next_review_at <= NOW()` → calls Edge Function → sends email via transactional email provider.

**Why not a dedicated job queue (BullMQ, etc.):** Requires Redis and a persistent Node.js worker process — incompatible with Cloudflare Workers' stateless model and overengineered for MVP scale. Supabase cron jobs are simpler and already available.

**Transactional email (pick one):**
- Resend (`npm install resend`) — Developer-friendly API, generous free tier (3,000 emails/month), React Email template support
- SendGrid — More enterprise, more complex setup

**Recommendation:** Resend for MVP. Simple API, good DX.

**Confidence:** MEDIUM (Supabase pg_cron documentation exists; Edge Function + email pattern is established but not verified end-to-end for this exact stack)

---

### Client-Side State

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| zustand | ^5.0.12 (already installed) | Recording state, UI state | Already in codebase; minimal boilerplate; works well for audio recording state machine (idle → recording → uploading → processing) |

**Do NOT use:** React Context for recording state (causes unnecessary re-renders during audio processing). Zustand's subscription model is better suited.

**Confidence:** HIGH (package already in codebase; pattern is well-established)

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Transcription | OpenAI `gpt-4o-mini-transcribe` | Cloudflare Workers AI Whisper | Lower accuracy, no SLA, community tier only |
| Transcription | OpenAI `gpt-4o-mini-transcribe` | AssemblyAI | Adds vendor dependency; OpenAI already required for extraction; consolidating to one AI vendor reduces complexity |
| Spaced repetition | `ts-fsrs` (FSRS) | `supermemo` (SM-2) | SM-2 is outdated; FSRS has better retention prediction per scientific literature |
| Spaced repetition | `ts-fsrs` (FSRS) | Custom SM-2 | Unnecessary work when reference implementation exists |
| Job scheduling | Supabase pg_cron | BullMQ + Redis | Requires persistent worker process incompatible with Cloudflare Workers |
| Job scheduling | Supabase pg_cron | Cloudflare Workers Cron Triggers | Would work, but requires writing cron logic in Workers; pg_cron keeps scheduling closer to the data |
| Email | Resend | SendGrid | SendGrid has heavier setup overhead; Resend is designed for developer tooling, simpler API |
| ORM | drizzle-orm | Prisma | Prisma requires a query engine binary; incompatible with Cloudflare Workers without workarounds |

---

## Full Dependency Summary

### New Packages to Install

```bash
# Runtime dependencies
npm install openai ts-fsrs postgres drizzle-zod resend

# No new dev dependencies needed
```

### Already Installed (Confirmed from package.json)

```
next@16.2.0, react@19.2.4, @supabase/supabase-js@^2.99.3
drizzle-orm@^0.45.1, drizzle-kit@^0.31.10, zod@^4.3.6
zustand@^5.0.12, react-hook-form@^7.71.2
@opennextjs/cloudflare@^1.17.1, wrangler@^4.76.0
```

---

## Cloudflare Workers Compatibility Notes

All recommended packages are compatible with Cloudflare Workers Node.js runtime (`nodejs_compat_v2`):

- `openai` SDK: Uses `fetch` internally, works in Workers. No native binaries.
- `ts-fsrs`: Pure TypeScript, zero dependencies, explicitly supports edge runtimes.
- `postgres`: Connects to Supabase via TCP; Cloudflare Workers supports outbound TCP connections via `nodejs_compat_v2`.
- `drizzle-zod`: Pure TypeScript code generation utility.
- `resend`: HTTP-based email API, works in any fetch-capable environment.

**Never use in Cloudflare Workers context:** Libraries with native `.node` addons, `fs` module for local file system access, or anything requiring a persistent process.

---

## Sources

- OpenAI Speech-to-Text Guide: https://developers.openai.com/api/docs/guides/speech-to-text/
- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- openai npm package: https://www.npmjs.com/package/openai (v6.32.0 verified)
- ts-fsrs GitHub: https://github.com/open-spaced-repetition/ts-fsrs (v5.2.3 verified)
- ts-fsrs npm: https://www.npmjs.com/package/ts-fsrs
- Drizzle ORM + Supabase: https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
- Supabase Storage Standard Uploads: https://supabase.com/docs/guides/storage/uploads/standard-uploads
- Supabase Storage S3 Uploads: https://supabase.com/docs/guides/storage/uploads/s3-uploads
- OpenNext Cloudflare: https://opennext.js.org/cloudflare
- Cloudflare Workers Node.js compatibility 2025: https://blog.cloudflare.com/nodejs-workers-2025/
- MediaRecorder API (MDN): https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- drizzle-orm npm (v0.45.1): https://www.npmjs.com/package/drizzle-orm
- zod npm (v4.3.6): https://www.npmjs.com/package/zod
- Signed URL uploads pattern: https://medium.com/@olliedoesdev/signed-url-file-uploads-with-nextjs-and-supabase-74ba91b65fe0

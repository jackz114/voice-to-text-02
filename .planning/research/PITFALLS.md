# Domain Pitfalls

**Domain:** AI Learning Assistant / Personal Knowledge Management (PKM) with Spaced Repetition
**Project:** 笔记助手 (bijiassistant)
**Researched:** 2026-03-22
**Overall Confidence:** HIGH (verified across multiple official sources + peer-reviewed research)

---

## Critical Pitfalls

Mistakes that cause rewrites, user abandonment, or architectural dead-ends.

---

### Pitfall 1: Cloudflare Workers Audio Upload Bypass Needed

**What goes wrong:** Audio files routed through the Cloudflare Worker API route for upload hit Workers' 128 MB memory limit and I/O object-scoping constraints. Developers assume a standard `multipart/form-data` POST to an API route is fine — it works locally with Node.js, then silently fails or corrupts in production on Workers.

**Why it happens:** Cloudflare Workers run in an isolated V8 environment. I/O objects (streams, request bodies) created in one request context cannot be passed to another context. Buffering a 20–50 MB audio file in Worker memory exceeds safe limits. The `@opennextjs/cloudflare` adapter uses the Node.js runtime compatibility layer, but audio buffering through the Worker is still unsafe.

**Consequences:**
- Upload silently times out or returns a 500 with no meaningful error in production
- Partial file writes to Supabase Storage cause corrupted audio files
- Transcription API receives malformed input, returns errors or garbage

**Prevention:** Upload audio directly from the browser to Supabase Storage using the TUS resumable upload protocol (files > 6 MB) or standard upload (files < 6 MB). The API route should only receive the Supabase Storage path after upload completes — not the audio bytes themselves. Use `supabase.storage.from('bucket').createSignedUploadUrl()` server-side, return the signed URL to the client, then upload from the client directly to Storage.

**Detection (warning signs):**
- Uploads that succeed in dev (`npm run dev`) fail in `npm run cf:dev` or production
- Worker memory errors in Cloudflare dashboard logs
- `Cannot perform I/O on behalf of a different request` errors in Workers logs

**Phase:** Implement correctly from the start when building the audio upload feature (Phase 1 of transcription work). Do not "fix later."

---

### Pitfall 2: Whisper API 25 MB File Size Limit Without Chunking Strategy

**What goes wrong:** A user records 30–60 minutes of audio while watching a tutorial. The file exceeds OpenAI Whisper's hard 25 MB limit. The API call fails with a 413 error. No chunking logic exists, so the transcription job crashes entirely.

**Why it happens:** Developers build the happy path (short recordings) and discover the limit only when real users record longer sessions. A 30-minute MP3 at 128 kbps is ~28 MB. A WebM recording from MediaRecorder in Chrome at default settings is even larger.

**Consequences:**
- Silent or confusing failure for longer recordings
- Either re-recording burden (bad UX) or feature unusability for the core use case (learning from long tutorial videos)
- No clear error message to the user

**Prevention:**
1. Pre-process audio client-side before upload: convert to mono, resample to 16 kHz, use low-bitrate MP3 or Opus (32–64 kbps is sufficient for speech). This reduces a 30-minute file to ~7 MB.
2. Build a chunking pipeline server-side for files that still exceed 25 MB: split into overlapping 10-minute segments, transcribe each, rejoin with overlap deduplication.
3. Set browser MediaRecorder to use `audio/webm;codecs=opus` at low bitrate and enforce a maximum recording duration in the UI as a soft guard.

**Detection (warning signs):**
- Files from `MediaRecorder` default settings exceeding 10–15 minutes
- Transcription job failure rate rising with recording duration
- User reports of "transcription failed" on longer sessions

**Phase:** Must be addressed in Phase 1 (audio recording + transcription MVP). Chunking pipeline can be deferred but the audio pre-processing must be in from day one.

---

### Pitfall 3: Whisper Cost Overrun from Unprocessed Audio

**What goes wrong:** Audio is sent to Whisper with silence, music, or background noise intact. OpenAI charges for the full audio duration including non-speech. A user records an hour of audio while watching a video — if they forget to mute or have long pauses, 40% of the billed time may be silence.

**Why it happens:** Developers assume transcription cost = speech duration. OpenAI bills for total submitted audio duration, not detected speech. Real-world developer reports show ~70% cost overrun vs. estimates due to this, retry overhead, and billing rounding.

**Consequences:**
- Per-user transcription costs 2x–3x projections
- Pricing model for the subscription tier is under-priced relative to actual cost
- Cost becomes uneconomical at scale before the product is profitable

**Prevention:**
1. Apply Voice Activity Detection (VAD) client-side before upload to strip silence. The `@ricky0123/vad-web` library (WebAssembly Silero VAD) runs in the browser and can reduce audio duration by 20–40% for typical learning sessions.
2. Enforce mono audio recording and downsample to 16 kHz (Whisper's native rate) before upload.
3. Track cost per user per month in the database from day one so pricing decisions are data-driven.

**Detection (warning signs):**
- OpenAI billing exceeding projections in the first month of real usage
- Transcription costs > $0.006/minute per user

**Phase:** Phase 1. Cost tracking infrastructure in Phase 2 at the latest.

---

### Pitfall 4: LLM Knowledge Extraction Producing Hallucinated Facts

**What goes wrong:** The AI extracts "knowledge items" from a transcript. The LLM generates structured items that were never said in the recording — inferred facts, plausible-sounding but fabricated details, or entity names invented to fill a schema field. The user's knowledge base silently accumulates false information.

**Why it happens:** Schema-driven few-shot prompting is particularly prone to hallucination. When the LLM is given a structured output schema and a transcript with ambiguous or sparse content, it fills empty fields with plausible-but-invented values rather than leaving them empty or flagging uncertainty.

**Consequences:**
- User's knowledge base becomes untrustworthy
- If users discover a false fact attributed to their own recording, trust in the product is permanently damaged
- Spaced repetition rehearses false information, cementing wrong knowledge

**Prevention:**
1. Always ground extraction in verbatim quotes from the source transcript. The prompt must instruct the model: "Only extract facts explicitly stated in the transcript. Do not infer, expand, or add context. If a field cannot be filled from the transcript, leave it empty."
2. Return the source sentence/timestamp alongside each extracted item so users can verify.
3. Use structured output with strict schemas (JSON Schema with `additionalProperties: false`) to constrain model output.
4. Build a user-facing review step before knowledge items are committed to the database — do not auto-commit AI extractions without confirmation.
5. Use temperature 0 for extraction tasks.

**Detection (warning signs):**
- Extracted items contain entities not mentioned in the source content
- Users editing extracted items frequently (high edit rate = low extraction quality)
- Items contain plausible details that are not verifiable against the source

**Phase:** Phase 2 (AI extraction). The review/confirmation UI is non-negotiable before this feature ships.

---

### Pitfall 5: Notification Fatigue Killing Retention

**What goes wrong:** The spaced repetition system schedules reviews correctly, but the notification system fires reminders for every due item every day. Users receive 5–10 review reminders daily, begin ignoring them, then disable notifications entirely. Without reminders, the review loop breaks and users churn.

**Why it happens:** Developers treat notifications as a purely technical problem (scheduling, delivery) rather than a UX problem. They implement "send notification when item is due" without thinking about batching, frequency caps, or user control.

**Consequences:**
- 10% of users disable the app's notifications after receiving too many (industry data)
- 6% uninstall
- Without reminders, spaced repetition has no mechanism to re-engage users — the product's core value loop breaks
- Churn rate climbs after week 2 as reminder fatigue sets in

**Prevention:**
1. Batch all due items into a single daily digest notification, not one notification per item.
2. Let users choose their preferred daily review time (e.g., "remind me at 9 AM").
3. Default to 1 notification/day maximum. Never send at night (11 PM–7 AM).
4. Add a "snooze" mechanism that defers review without marking items as missed.
5. Show a count ("You have 7 items to review today") rather than listing items in the notification.

**Detection (warning signs):**
- Notification opt-out rate > 20% within first month
- DAU/MAU ratio dropping after day 7
- Users completing no reviews despite having due items

**Phase:** Phase 3 (reminder system). Design notification UX before implementing the delivery mechanism.

---

## Moderate Pitfalls

---

### Pitfall 6: Using SM-2 Instead of FSRS for Spaced Repetition

**What goes wrong:** SM-2 (the classic Anki algorithm from 1987) is used because it is simple and well-documented. Users notice their review schedules feel wrong — items they know well keep appearing, items they struggle with don't appear often enough.

**Why it happens:** SM-2 is the first algorithm developers find when researching spaced repetition. It is well-documented and simple to implement. FSRS (Free Spaced Repetition Scheduler, 2022) is newer and requires understanding stability/retrievability parameters.

**Consequences:**
- FSRS requires 20–30% fewer reviews for the same retention rate (benchmark: 349 million reviews)
- SM-2 schedules based on fixed formulas, not individual forgetting curves — poor fit for users with varied learning histories
- Users defect to Anki or RemNote when review quality feels worse than free tools

**Prevention:** Implement FSRS from the start. The core algorithm is arithmetic (no ML inference needed at runtime — parameters are pre-computed). Reference implementation exists in JavaScript. The additional complexity over SM-2 is low; the user experience improvement is significant.

**Detection (warning signs):**
- Users reporting reviews feel "random" or "too easy/too hard"
- Low review completion rates despite low item counts

**Phase:** Phase 2 (spaced repetition scheduling). Choose FSRS before writing the first scheduling function.

---

### Pitfall 7: Knowledge Capture Friction Above 10 Seconds Kills Usage

**What goes wrong:** The recording start-to-capture flow takes more than two UI interactions. Users are in "learning mode" (watching a video, reading an article) and won't interrupt their flow to navigate to a dashboard, log in, select a topic, then start recording. After the first week, usage drops to zero.

**Why it happens:** Product teams optimize for the processing/output UI (knowledge graph, review dashboard) rather than the capture entry point. The entry point is the most friction-sensitive moment in the product.

**Consequences:**
- 68% of PKM tool users abandon within six months (Forte Labs survey) — the primary cause is friction at the capture step
- Product has technically correct features but no content to process
- The transcription and AI extraction pipeline sits idle

**Prevention:**
1. The record button must be reachable in 1 tap/click from any page.
2. No authentication wall before starting a recording — if not logged in, let recording begin and prompt auth at save time.
3. Paste-article flow must accept raw pasted text with zero formatting requirements.
4. Default category/topic can be assigned later — do not require it at capture time.

**Detection (warning signs):**
- Analytics showing users landing on the home page but not initiating recordings
- Session recordings showing users clicking through 3+ pages before recording
- High bounce rate on the recording page

**Phase:** Phase 1. The capture UX is the entire MVP.

---

### Pitfall 8: Auto-Classification Errors Eroding Trust in AI Categorization

**What goes wrong:** AI assigns knowledge items to categories/domains. It regularly misclassifies items — putting a React hook explanation under "Business" or a copywriting tip under "Programming." Users spend time correcting classifications. After enough corrections, they stop trusting the AI categories and use the system as a flat list (defeating the knowledge organization value).

**Why it happens:** LLM topic classification is prompt-sensitive and works poorly for short, context-free items ("use useCallback to memoize event handlers" — is this React, JavaScript, or Performance?). Classification is also highly personal: one user's "Marketing" is another user's "Business."

**Consequences:**
- High manual correction overhead
- Users abandon the category/domain feature
- Knowledge search ("find everything I know about X") becomes unreliable

**Prevention:**
1. Show classification as a suggestion, not a committed assignment — always one-click correctable.
2. Seed classification from the recording context (e.g., "What were you learning about?") rather than inferring from content alone.
3. Learn from user corrections: when a user reclassifies an item, use that as a training signal to adjust future suggestions for that user.
4. Limit initial taxonomy to 5–8 broad domains. Granular sub-categories come later.

**Detection (warning signs):**
- High rate of category edits (> 30% of items manually reclassified)
- Users creating many custom categories that duplicate built-in ones
- Users leaving categories blank

**Phase:** Phase 2 (AI extraction and categorization).

---

### Pitfall 9: Database Schema Not Designed for Spaced Repetition State

**What goes wrong:** The `transcriptions` table is built first to capture audio → text. When spaced repetition is added later, `knowledge_items` and `review_state` are bolted on as separate tables with weak foreign keys. The scheduling query (find all items due for review by user X today) becomes a multi-join nightmare with poor performance, and the forgetting curve calculation requires fields that don't exist.

**Why it happens:** The schema is designed sequentially, phase by phase, without considering downstream requirements. Spaced repetition requires per-item mutable state (last reviewed, current interval, stability, difficulty, retrievability) that needs to be designed alongside the knowledge item schema.

**Consequences:**
- Schema migration debt accumulates
- Review scheduling query performance degrades as user knowledge bases grow
- FSRS parameters cannot be stored per-item without a schema rewrite

**Prevention:** Design the full data model upfront before writing Drizzle schema files:
- `knowledge_items`: id, user_id, source_id (transcript/paste), content, domain, created_at
- `review_state`: item_id (1:1 with knowledge_items), stability, difficulty, retrievability, last_reviewed_at, next_review_at, review_count
- Index `review_state.next_review_at` + `user_id` for the "due today" query

**Detection (warning signs):**
- Adding columns to `transcriptions` to track review state
- Review queries needing more than 2 JOINs
- No column to store FSRS stability/difficulty parameters

**Phase:** Phase 1 (database schema). Design all 7 tables before the first Drizzle migration.

---

### Pitfall 10: MediaRecorder Browser API Inconsistency Across Browsers

**What goes wrong:** Recording works perfectly in Chrome. In Safari, the audio format is different (Safari defaults to `audio/mp4` not `audio/webm`). In Firefox, the audio is recorded but the MIME type negotiation fails silently. Whisper rejects some formats or produces garbled output from others.

**Why it happens:** `MediaRecorder` support is inconsistent: Chrome supports `audio/webm;codecs=opus`; Safari supports `audio/mp4;codecs=aac`; Firefox supports both but behaves differently. Developers test in Chrome, ship, then receive bug reports from Safari users.

**Consequences:**
- Safari users (a significant share of the target indie developer audience on Mac) cannot record or get failed transcriptions
- Silent failures are the worst — the recording appears to succeed but transcription returns empty or error

**Prevention:**
1. Use `MediaRecorder.isTypeSupported()` to detect the best available codec.
2. Probe in priority order: `audio/webm;codecs=opus` → `audio/ogg;codecs=opus` → `audio/mp4` → `audio/webm` (no codec spec).
3. Always set the `mimeType` in the `MediaRecorder` constructor explicitly rather than relying on browser defaults.
4. Test recording and transcription in Chrome, Safari, and Firefox before shipping.

**Detection (warning signs):**
- Whisper returning empty transcription for non-Chrome users
- `NotSupportedError` on `MediaRecorder` construction in Safari
- Audio file size anomalies (e.g., 0-byte files from Safari)

**Phase:** Phase 1 (audio recording). Must be in the initial implementation, not a later fix.

---

## Minor Pitfalls

---

### Pitfall 11: Supabase Free Tier File Size Limit (50 MB)

**What goes wrong:** On the Supabase Free plan, the global file upload limit is 50 MB. After applying audio optimization (mono, 16 kHz, low bitrate), most recordings will be under this limit. However, a 2-hour session at even low bitrate can approach the limit. Developers do not discover this until a user files a bug report.

**Prevention:** Document the 50 MB limit in the system. Add client-side validation that shows a clear error ("Recording too long — maximum 2 hours on the free plan, upgrade for unlimited") before attempting upload. Upgrade to Supabase Pro plan when real users arrive — the limit increases to 500 GB.

**Phase:** Phase 1. Add the validation check before the first upload implementation.

---

### Pitfall 12: Transcription Jobs Blocking the API Route

**What goes wrong:** Transcription via Whisper API can take 5–30 seconds for longer files. The Next.js API route awaits the Whisper response synchronously. The user sits on a loading screen for 30 seconds and may close the tab, losing the transcription result.

**Prevention:** Make transcription async. The upload API route should: (1) store the audio file path in the database with status `pending`, (2) return a `jobId` immediately to the client, (3) trigger transcription via a background job (Cloudflare Queue, Supabase Edge Function, or a simple polling-based approach). The client polls the job status and shows progress.

**Phase:** Phase 1, or Phase 2 at the latest. Do not ship synchronous transcription to real users.

---

### Pitfall 13: Knowledge Items Growing Without Pruning Leading to Review Debt

**What goes wrong:** A user captures 50 knowledge items in week one. The spaced repetition system starts scheduling reviews. By month 2, the user has 400 items and 80 due reviews per day. This is overwhelming. The user stops doing reviews entirely, and the whole system stops working.

**Prevention:**
1. Cap daily reviews at a user-configurable limit (default: 20 items/day). Excess due items are deferred by one day.
2. Show users their review load projection ("At your current capture rate, you'll have 40 reviews/day in 30 days") as a visual indicator.
3. Allow users to archive or "graduate" items they feel fully confident about, removing them from the active queue.

**Phase:** Phase 2 (spaced repetition). The review cap must be in the scheduling algorithm, not an afterthought.

---

### Pitfall 14: Turnstile Test Key in Production Authentication

**What goes wrong:** The Cloudflare Turnstile sitekey `1x00000000000000000000AA` in `LoginForm.tsx:127` is a testing key that passes all challenges without validation. In production, this means any bot can bypass the signup form without human verification. This is already documented in CLAUDE.md but is included here as a pitfall because it is easy to overlook before launch.

**Prevention:** Replace before production launch with a real Turnstile sitekey from the Cloudflare dashboard. Add it to the pre-launch checklist (already exists in CLAUDE.md).

**Phase:** Pre-launch (tracked in CLAUDE.md checklist).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Audio recording UI | MediaRecorder cross-browser incompatibility (#10) | Codec detection before `new MediaRecorder()` |
| File upload implementation | Routing audio bytes through Worker (#1) | Client-direct upload to Supabase Storage |
| Transcription API integration | 25 MB limit and cost overrun (#2, #3) | Client-side pre-processing + chunking pipeline |
| Database schema creation | Missing FSRS fields + no review scheduling index (#9) | Design full schema before first migration |
| AI knowledge extraction | Hallucinated facts in structured output (#4) | Source-grounded prompts + user review step |
| Categorization feature | AI misclassification eroding trust (#8) | Suggestions, not auto-commits; learn from corrections |
| Spaced repetition algorithm | SM-2 scheduling quality (#6) | Use FSRS from day one |
| Reminder/notification system | Notification fatigue (#5) | Daily digest + user-controlled timing |
| Capture UX design | Friction above 10 seconds (#7) | One-tap record from any page |
| Scaling active knowledge base | Review debt buildup (#13) | Daily review cap in scheduling algorithm |

---

## Sources

- [Supabase Storage File Limits](https://supabase.com/docs/guides/storage/uploads/file-limits) — HIGH confidence (official docs)
- [Supabase Resumable Uploads (TUS)](https://supabase.com/docs/guides/storage/uploads/resumable-uploads) — HIGH confidence (official docs)
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) — HIGH confidence (official docs)
- [OpenAI Whisper API Pricing 2026](https://costbench.com/software/ai-transcription-apis/openai-whisper/) — MEDIUM confidence (third-party benchmark, aligns with official pricing page)
- [OpenAI Whisper Rate Limits](https://platform.openai.com/docs/guides/rate-limits) — HIGH confidence (official docs)
- [FSRS vs SM-2 Algorithm Comparison](https://memoforge.app/blog/fsrs-vs-sm2-anki-algorithm-guide-2025/) — HIGH confidence (backed by 349M review benchmark)
- [FSRS Algorithm Benchmark](https://expertium.github.io/Benchmark.html) — HIGH confidence (primary benchmark source, peer-reviewed methodology)
- [LLM Hallucination in Structured Extraction (2025)](https://labelyourdata.com/articles/llm-fine-tuning/llm-hallucination) — HIGH confidence (multiple peer-reviewed papers)
- [PKM User Abandonment Research](https://medium.com/@ann_p/pkm-in-2025-why-were-not-just-taking-notes-anymore-f7dae509f622) — MEDIUM confidence (industry survey, Forte Labs 68% stat widely cited)
- [Push Notification Fatigue Data](https://retenshun.com/blog/push-notification-frequency-sweet-spot) — MEDIUM confidence (industry data, multiple corroborating sources)
- [5 Common AI Assistant Implementation Pitfalls](https://www.glean.com/perspectives/5-common-pitfalls-in-ai-assistant-implementation-and-how-to-overcome-them) — MEDIUM confidence (practitioner source)
- [Ebbinghaus Forgetting Curve Implementation Notes](https://doubletapp.medium.com/how-to-remember-and-not-forget-implementing-and-automating-the-spaced-repetition-system-4c011afff83e) — MEDIUM confidence (developer implementation post)

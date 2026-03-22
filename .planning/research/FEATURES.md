# Feature Landscape

**Domain:** AI learning assistant with voice capture, knowledge extraction, and spaced repetition
**Project:** 笔记助手 (bijiassistant) — for independent developers learning tech and business
**Researched:** 2026-03-22

---

## Table Stakes

Features users expect from any serious AI learning/PKM tool. Missing any of these = product feels incomplete and users leave.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Voice/audio capture | Core input mechanism; users expect natural capture while watching tutorials | Medium | MediaRecorder API on web; upload to Supabase Storage; already planned |
| Auto transcription | Converting speech to text is the baseline — without it voice capture is useless | Low-Med | OpenAI Whisper API ($0.006/min); already identified in constraints |
| AI knowledge extraction | Users expect AI to do the heavy lifting of structuring raw transcript into usable notes | High | LLM call after transcription; map-reduce approach for long audio |
| Spaced repetition scheduling | In 2026 this is no longer a differentiator — it IS the standard for retention-focused apps | High | Use FSRS algorithm (superior to SM-2); calculate next review dates automatically |
| Proactive review reminders | Without timely nudges the entire forgetting-curve loop breaks | Medium | Email or browser push notifications; evening timing shown to work best |
| Knowledge library / browse | Users must be able to see what they've captured, organized by topic | Medium | Grid/list view of items grouped by domain |
| Mark review complete | Closing the loop — users confirm they reviewed; system updates next interval | Low | Simple button action; triggers FSRS reschedule |
| Text/article paste as input | Not everyone uses voice; paste-and-extract is expected alongside audio | Low-Med | Same LLM pipeline as transcription post-processing |
| Authentication | Any data-retaining app requires login | Low | Already implemented with Supabase Auth |
| Data ownership clarity | Users expect to know their notes are private and theirs | Low | Supabase RLS already planned; surface this in UI |

---

## Differentiators

Features that set this product apart from generic note-taking tools or raw Anki. Not baseline expected, but highly valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| FSRS algorithm (vs SM-2) | Users doing fewer reviews for the same retention level — measurably better outcomes | Medium | FSRS is open algorithm; implement server-side; don't use deprecated SM-2 |
| Zero-friction capture while learning | Record audio without stopping the tutorial — no typing, no app switching | Low | Simple record button + background upload; keeps user in flow state |
| Domain/topic auto-classification | AI tags each knowledge item to a domain (e.g., "React", "SEO", "Product") without user effort | Medium | LLM prompt for classification; user can override |
| Semantic knowledge search | "What do I know about React hooks?" — natural language query over personal notes | High | Vector embeddings per knowledge item; semantic similarity search (pgvector in Supabase) |
| Knowledge graph visualization | See how topics connect; motivating to see your library grow visually | High | Defer to post-MVP; complex to implement well |
| AI-generated review questions | Instead of just re-reading a fact, AI generates a quiz question for active recall | Medium | Active recall proven 30-40% more effective than passive re-reading |
| Capture-to-card in under 30 seconds | Measure and surface this as a feature — speed matters for in-flow capture | Low | UX/performance goal, not new code |
| Audio upload from existing files | Support uploading recorded lectures/podcasts, not just live recording | Low | Same Whisper pipeline; file input instead of MediaRecorder |
| Confidence rating on review | User rates how well they remembered (1-4 scale like Anki) to feed FSRS | Low | Part of FSRS implementation; critical for algorithm accuracy |
| Daily review queue | One focused view showing "what to review today" — reduces cognitive overhead | Medium | Derived from scheduled review dates; sort by due date |

---

## Anti-Features

Features to explicitly NOT build. These are common traps that waste dev time, harm retention, or create the wrong product.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Gamification (points, badges, streaks, leaderboards) | Research shows gamification drives engagement metrics, not actual retention. It creates dark patterns and users optimize for streaks rather than learning. Indie developer users will see through this immediately. | Show honest analytics: items due today, retention rate %, days since last review. Respect users' intelligence. |
| Social/sharing features | Explicitly out of scope. This is a personal tool. Social adds auth complexity, moderation, and shifts product focus. | N/A — reference PROJECT.md out-of-scope rationale |
| Real-time transcription | Adds streaming complexity, cost, and latency concerns. Audio quality during live capture is worse. | Upload-after-capture flow is simpler, cheaper, and good enough |
| Video file upload | Large storage costs, transcoding complexity, copyright edge cases | Audio recording captures the same learning signal at a fraction of the complexity |
| Complex flashcard editor | Manual card creation is the #1 reason users abandon spaced repetition apps. The whole point is AI does this. | AI auto-generates cards; user can edit but shouldn't need to |
| Mobile native app | Doubles scope. Web-first covers 90% of use cases for an indie dev sitting at their computer. | Responsive web works; defer native to post-product-market-fit |
| Collaboration / shared vaults | Changes privacy model, adds complexity, not the user persona | Stay single-user with strong RLS |
| Quiz/test mode before input pipeline is solid | Building review UI before you have enough cards to review is premature | Get capture → extract → schedule working first |
| Unlimited free tier | Transcription (Whisper) and LLM extraction both cost money per use | Design pricing from day one: minutes balance model (already in DB schema) |
| Note linking / bidirectional links (Obsidian-style) | Deep rabbit hole. Requires users to maintain links manually or complex AI inference. Indie dev persona doesn't need to build a "second brain" — they need to not forget what they learned last Tuesday. | Categorization by domain + semantic search covers the retrieval need without link maintenance overhead |

---

## Feature Dependencies

```
Authentication (Supabase Auth)
  └── All data features (every item is user-scoped)

Audio Capture (MediaRecorder → Supabase Storage)
  └── Transcription (Whisper API)
        └── AI Knowledge Extraction (LLM post-processing)
              └── Domain Classification (LLM prompt)
              └── Knowledge Item Creation (DB write)
                    └── FSRS Scheduling (calculate first review date)
                          └── Review Queue (query items due today)
                                └── Review UI (mark complete + confidence rating)
                                      └── FSRS Reschedule (update next review date)
                                            └── Proactive Reminders (notify before forgetting)

Text Paste Input
  └── AI Knowledge Extraction (same pipeline as transcription output)

Knowledge Library Browse
  └── Knowledge Item Creation (needs items to exist)

Semantic Search
  └── Knowledge Item Creation (needs embeddings generated at creation time)
  └── pgvector extension in Supabase (infrastructure prerequisite)

Payment / Minutes Balance (already implemented)
  └── Transcription + LLM (consume minutes per use)
```

---

## MVP Recommendation

The core loop that delivers the value promise: "learn something → capture it → don't forget it."

**Phase 1 — Capture pipeline (must come first):**
1. Audio recording and upload
2. Whisper transcription
3. Basic knowledge item storage (even without AI extraction — raw transcript is better than nothing)

**Phase 2 — Intelligence layer:**
4. LLM extraction of structured knowledge items from transcripts
5. Domain auto-classification
6. Text/article paste as alternate input

**Phase 3 — Retention loop:**
7. FSRS scheduling (calculate review dates at item creation)
8. Daily review queue view
9. Confidence-rated mark-complete (feeds FSRS reschedule)
10. Proactive reminders (email/push when items are due)

**Phase 4 — Discoverability:**
11. Knowledge library browse with domain filter
12. Semantic search ("what do I know about X?")

**Defer until after product-market-fit:**
- AI-generated quiz questions (active recall)
- Knowledge graph visualization
- Audio file upload (vs live recording)
- pgvector semantic search (needs infra setup and ongoing embedding cost)

**Why this order:**
- Without capture, nothing else matters. Users must be able to get content in.
- Without extraction, the content is raw and unstructured — hard to review.
- Without FSRS + reminders, users will not return on their own (core retention loop broken).
- Search and browse are "nice to have" — users will tolerate starting from category lists.

---

## Algorithm Notes: FSRS vs SM-2

Use FSRS (Free Spaced Repetition Scheduler), not the classic SM-2 algorithm that Anki uses by default.

**Why FSRS:**
- SM-2 was published in 1987 and abandoned by SuperMemo decades ago
- FSRS users do fewer reviews than SM-2 users to achieve the same retention rate
- FSRS handles missed reviews and review delays far better (a real-world concern for indie devs with irregular schedules)
- FSRS is open-source and well-documented; JavaScript/TypeScript implementations exist
- Anki itself added FSRS as an optional feature in version 23.10 (late 2023)

**FSRS parameters that matter for implementation:**
- Stability (S): how long until 90% retention (grows with each successful review)
- Difficulty (D): inherent difficulty of the item (affects interval growth)
- Retrievability (R): current estimated recall probability

The confidence rating the user provides (1=Again, 2=Hard, 3=Good, 4=Easy) feeds directly into FSRS to update S and D.

---

## Notification Strategy

Based on research from 2025 studies on learning app retention:

- **Timing:** Evening reminders (6-9pm local time) work best — users are done with work and more receptive
- **Frequency:** Once per day maximum; only send if user has items due
- **Message:** Be specific, not generic. "You have 5 items due today from React hooks and SEO basics" beats "Time to review!"
- **Channel for MVP:** Email (simplest, no native app needed); add browser push notifications when web app is stable
- **Do not:** Send reminders if user already reviewed today (no double-nudging)
- **Do not:** Send reminders for items not yet due (this destroys trust in the algorithm)

---

## Pricing Model Implication

The minutes-balance model already in the DB schema (`user_balances.total_minutes`, `used_minutes`, `remaining_minutes`) maps well to the feature set:

- Each transcription minute consumes 1 minute from balance
- Each LLM extraction call could consume a flat fee (e.g., 2 minutes per extraction job)
- Review, browse, and search are free (no AI cost at those points)
- This gives users predictable costs and natural upgrade incentives

**Anti-pattern to avoid:** Do not make review frequency or reminder delivery paywalled. These are the retention mechanism — blocking them harms the core value prop.

---

## Sources

- [Spaced Repetition App Guide 2025-2026](https://makeheadway.com/blog/spaced-repetition-app/) — MEDIUM confidence (WebSearch-verified)
- [Anki FSRS Algorithm FAQ](https://faqs.ankiweb.net/what-spaced-repetition-algorithm) — HIGH confidence (official documentation)
- [Anki Manual: Background](https://docs.ankiweb.net/background.html) — HIGH confidence (official documentation)
- [Best AI Note Taking Apps 2025](https://amical.ai/blog/best-ai-note-taking-app) — MEDIUM confidence (WebSearch-verified)
- [Otter.ai AI Notetaker](https://otter.ai/) — HIGH confidence (official product page)
- [Whisper Notes vs Otter.ai comparison](https://whispernotes.app/whisper-notes-vs-otter-ai) — MEDIUM confidence (WebSearch-verified)
- [SuperWhisper vs Otter AI 2026](https://willowvoice.com/blog/superwhisper-vs-otter-ai-comparison-2025) — MEDIUM confidence (WebSearch-verified)
- [Best AI Transcription Services 2025](https://axis-intelligence.com/best-ai-transcription-services-2025/) — MEDIUM confidence (WebSearch)
- [AssemblyAI LLM Meeting Summarization](https://www.assemblyai.com/blog/summarize-meetings-llms-python) — HIGH confidence (official docs)
- [PKM Tools Comparison 2026](https://dasroot.net/posts/2026/03/obsidian-vs-notion-vs-markdown-files-2026-pkm-comparison/) — MEDIUM confidence (WebSearch, recent)
- [12 Best PKM Tools 2025](https://blog.obsibrain.com/other-articles/personal-knowledge-management-tools) — MEDIUM confidence (WebSearch-verified)
- [Best Spaced Repetition Apps 2025 Tegaru](https://tegaru.app/en/blog/best-spaced-repetition-apps-2025) — MEDIUM confidence (WebSearch)
- [Anki vs SuperMemo FlashRecall analysis](https://flashrecall.app/blog/anki-vs-supermemo) — MEDIUM confidence (WebSearch)
- [RemNote FSRS / SM-2 documentation](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm) — HIGH confidence (official help docs)
- [Graphiti Knowledge Graph (Zep)](https://github.com/getzep/graphiti) — HIGH confidence (official GitHub)
- [RAG in 2026 State of Play](https://squirro.com/squirro-blog/state-of-rag-genai) — MEDIUM confidence (WebSearch)
- [WhatsApp/app reminders spaced repetition study](https://joecy.org/index.php/joecy/article/view/1283) — MEDIUM confidence (academic, WebSearch)
- [10 Best Microlearning Apps 2026](https://raccoongang.com/blog/best-microlearning-apps-and-platforms/) — LOW confidence (WebSearch only)
- [Conversational AI Informal Learning Study 2025](https://arxiv.org/html/2506.11789v1) — HIGH confidence (academic paper)

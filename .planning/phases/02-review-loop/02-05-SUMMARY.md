---
phase: 02-review-loop
plan: "05"
subsystem: audio
tags: [mediarecorder, whisper, supabase-storage, signed-url, web-audio-api, openai, transcription]

# Dependency graph
requires:
  - phase: 01-capture-pipeline
    provides: "Capture page (/capture), TextPasteInput component, DB schema (transcriptions table), supabase singleton"
  - phase: 02-review-loop
    provides: "Auth pattern from confirm/route.ts, capture-client.ts OpenAI pattern"
provides:
  - "POST /api/audio/signed-url — issues Supabase Storage signed upload URLs for the audio bucket"
  - "POST /api/audio/transcribe — server-side Whisper transcription via gpt-4o-mini-transcribe model"
  - "AudioRecorder component with codec detection, waveform visualization, pause/resume, and direct browser-to-Supabase upload"
  - "/capture page updated with side-by-side text paste + audio recorder layout"
affects: [03-notifications, future-audio-improvements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Signed URL upload: API route issues token, browser uploads directly to Supabase (no audio bytes through Cloudflare Worker)"
    - "Codec detection: MediaRecorder.isTypeSupported() probe list (webm/opus → webm → mp4 → ogg/opus → wav)"
    - "Blob assembly in onstop handler (not after stop() call) to prevent empty Blob pitfall"
    - "key-based TextPasteInput remount to populate transcript without setState-in-effect anti-pattern"

key-files:
  created:
    - src/app/api/audio/signed-url/route.ts
    - src/app/api/audio/transcribe/route.ts
    - src/components/capture/AudioRecorder.tsx
  modified:
    - src/app/capture/page.tsx
    - src/components/capture/TextPasteInput.tsx

key-decisions:
  - "OPENAI_API_KEY used for Whisper (gpt-4o-mini-transcribe) even though extraction uses DEEPSEEK_API_KEY — different API providers for different tasks"
  - "key-based remount for TextPasteInput transcript population (avoids setState-in-effect ESLint error)"
  - "Container widened from max-w-3xl to max-w-5xl to accommodate two-column grid layout"

patterns-established:
  - "Signed URL pattern: POST /api/audio/signed-url returns {signedUrl, token, path}; client calls supabase.storage.uploadToSignedUrl(path, token, blob)"
  - "Transcription pattern: POST /api/audio/transcribe accepts {audioPath}; downloads from storage, calls Whisper, persists to transcriptions table"

requirements-completed: [AUDIO-01, AUDIO-02, AUDIO-03, TRANS-01, TRANS-02, TRANS-03]

# Metrics
duration: 14min
completed: 2026-03-23
---

# Phase 02 Plan 05: Audio Capture Summary

**MediaRecorder component with signed URL direct upload to Supabase Storage, Web Audio API waveform, and gpt-4o-mini-transcribe Whisper integration populating the capture text area**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-23T08:36:24Z
- **Completed:** 2026-03-23T08:50:08Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Audio capture pipeline: record → signed URL → direct browser upload to Supabase Storage → Whisper transcription → populate text input
- AudioRecorder component with codec auto-detection (webm/opus preferred), 32kbps recording, animated waveform, pause/resume, 25MB pre-upload guard
- Two API routes: signed-url (issues Supabase upload tokens) and transcribe (downloads from storage, calls gpt-4o-mini-transcribe, persists to transcriptions table)
- Capture page updated to show text paste area and audio recorder side by side in responsive two-column grid

## Task Commits

Each task was committed atomically:

1. **Task 1: Create signed-url and transcribe API routes** - `e1ba183` (feat)
2. **Task 2: Create AudioRecorder component** - `c420b5b` (feat)
3. **Task 3: Update /capture page** - `f9bfe1a` (feat)

## Files Created/Modified

- `src/app/api/audio/signed-url/route.ts` - POST handler: authenticates user, generates Supabase Storage signed upload URL for audio bucket
- `src/app/api/audio/transcribe/route.ts` - POST handler: downloads audio from Storage, checks 25MB limit, calls gpt-4o-mini-transcribe, persists result to transcriptions table
- `src/components/capture/AudioRecorder.tsx` - Client component: codec detection, Web Audio API waveform, pause/resume, direct uploadToSignedUrl, onTranscriptReady callback
- `src/app/capture/page.tsx` - Updated to two-column grid with AudioRecorder alongside TextPasteInput; authToken state from Supabase session
- `src/components/capture/TextPasteInput.tsx` - Added optional initialValue prop for transcript population via key-based remount

## Decisions Made

- `OPENAI_API_KEY` env var used for Whisper transcription — the project uses `DEEPSEEK_API_KEY` for extraction but `gpt-4o-mini-transcribe` is an OpenAI-only model; both can coexist
- Used key-based TextPasteInput remount (`key={inputText || "empty"}`) to populate the textarea with transcript without triggering the `react-hooks/set-state-in-effect` lint error
- Container widened to `max-w-5xl` to give the two-column grid adequate width

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added initialValue prop to TextPasteInput**
- **Found during:** Task 3 (capture page layout update)
- **Issue:** TextPasteInput manages its own text state internally; no mechanism to populate it from transcript without modifying the component
- **Fix:** Added `initialValue?: string` prop to TextPasteInput, used `useState(initialValue)` with key-based remount pattern in capture page to avoid setState-in-effect anti-pattern
- **Files modified:** src/components/capture/TextPasteInput.tsx, src/app/capture/page.tsx
- **Verification:** ESLint passes with no errors; component receives transcript and populates on remount
- **Committed in:** f9bfe1a (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical functionality)
**Impact on plan:** Auto-fix was required for onTranscriptReady callback to actually populate the text area — without it the feature would work up to transcription but never show the result in the UI.

## Issues Encountered

- The project uses `DEEPSEEK_API_KEY` for AI extraction but Whisper requires OpenAI — `OPENAI_API_KEY` is used for the transcription route. User will need to add this env var for transcription to work.

## User Setup Required

Before audio transcription works end-to-end:

1. **Supabase Storage bucket:** Create private bucket named `audio` in Supabase Dashboard → Storage → New bucket (Public: OFF)
2. **RLS INSERT policy:**
   ```sql
   CREATE POLICY "Users can upload own audio"
   ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```
3. **RLS SELECT policy:**
   ```sql
   CREATE POLICY "Users can read own audio"
   ON storage.objects FOR SELECT TO authenticated
   USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```
4. **OPENAI_API_KEY** env var: Add to `.env.local` for Whisper transcription (separate from `DEEPSEEK_API_KEY` used for extraction)

## Next Phase Readiness

- Audio capture pipeline fully implemented and ready for end-to-end testing once user setup is complete
- Transcription results flow directly into the existing extraction pipeline (TextPasteInput → handleExtract → confirmation cards → DB write)
- Requirements AUDIO-01/02/03 and TRANS-01/02/03 complete

## Self-Check: PASSED

All created files exist and all task commits are present in git history.

---
*Phase: 02-review-loop*
*Completed: 2026-03-23*

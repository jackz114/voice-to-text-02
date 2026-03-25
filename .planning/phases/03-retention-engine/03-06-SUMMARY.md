---
phase: 03
plan: 03-06
phase_name: retention-engine
plan_name: Cron Trigger & Daily Email
status: completed
completed_at: "2026-03-24"
dependencies: ["03-01", "03-05"]
requirements:
  - NOTIFY-01
  - NOTIFY-02
  - NOTIFY-03
tags: [cron, email, notifications, cloudflare]
tech-stack:
  added: [Cloudflare Cron Triggers, Resend]
  patterns: [timezone conversion, hourly scheduling]
key-files:
  created:
    - src/app/api/cron/daily-email/route.ts
    - src/app/api/notifications/send-daily/route.ts
  modified:
    - wrangler.jsonc
metrics:
  duration: 15m
  tasks: 3
  files: 3
  commits: 3
---

# Phase 03 Plan 03-06: Cron Trigger & Daily Email Summary

## One-Liner

Configured Cloudflare Cron Trigger (hourly) and implemented daily reminder email system with timezone-aware scheduling and user preference filtering.

## What Was Built

### Cloudflare Cron Configuration
- Added `"triggers": { "crons": ["0 * * * *"] }` to `wrangler.jsonc`
- Runs every hour at minute 0 to check for users whose reminder time has arrived

### Daily Email Cron Handler (`src/app/api/cron/daily-email/route.ts`)
- **Security**: Protected by `CRON_SECRET` Bearer token verification
- **Timezone Logic**: Converts user local reminder time to UTC for accurate scheduling
  - Uses `Intl.DateTimeFormat` to calculate timezone offsets
  - Supports any IANA timezone (default: Asia/Shanghai)
- **Query Strategy**: Joins `review_state` with `knowledge_items` to find due items
- **User Filtering**:
  - Skips users with `emailNotificationsEnabled: false`
  - Only sends at user's preferred `dailyReminderTime` in their `reminderTimezone`
  - Filters domains by `includedDomains` preference
- **Email Generation**: Uses existing `renderDailyReminderEmail` with personalized content
- **Batch Processing**: Sends emails sequentially with per-user error handling
- **Logging**: Comprehensive console logging for debugging

### Manual Trigger API (`src/app/api/notifications/send-daily/route.ts`)
- Admin-only endpoint protected by `ADMIN_SECRET`
- Forwards to cron handler for manual testing
- Useful for testing without waiting for cron schedule

## Requirements Satisfied

| Requirement | Implementation |
|-------------|----------------|
| NOTIFY-01 | Cron runs hourly; users receive emails at their preferred local time |
| NOTIFY-02 | Only sends when due items exist; respects `emailNotificationsEnabled` flag |
| NOTIFY-03 | Email includes count and domain list via `renderDailyReminderEmail` |

## Key Design Decisions

### Timezone Conversion Strategy
- Calculate current hour in user's timezone vs UTC
- Determine offset dynamically (handles DST automatically via Intl API)
- Compare expected UTC hour with current UTC hour
- 1-hour sending window ensures emails don't get missed due to timing skew

### Security Model
- `CRON_SECRET` protects cron endpoint from unauthorized access
- `ADMIN_SECRET` protects manual trigger endpoint
- Both secrets configured via Cloudflare wrangler secrets (not in code)

### Error Handling
- Per-user email failures don't block other users
- Failed sends logged with error details
- Summary returned with sent/failed/skipped counts

## Environment Variables Required

```bash
# Required for cron handler
CRON_SECRET=your-random-secret-here
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_APP_URL=...

# Required for manual trigger
ADMIN_SECRET=your-admin-secret-here
```

## Deployment Notes

```bash
# Set secrets in Cloudflare
wrangler secret put CRON_SECRET
wrangler secret put ADMIN_SECRET
wrangler secret put RESEND_API_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# Deploy to activate cron trigger
npm run deploy
```

After deployment, verify cron trigger appears in Cloudflare Dashboard under Workers & Pages > Triggers.

## Testing

```bash
# Test cron endpoint locally
curl -X POST http://localhost:3000/api/cron/daily-email \
  -H "Authorization: Bearer your-cron-secret"

# Test manual trigger
curl -X POST http://localhost:3000/api/notifications/send-daily \
  -H "Authorization: Bearer your-admin-secret"
```

## Deviations from Plan

None - plan executed exactly as written.

## Known Limitations

- Cron trigger runs hourly; users may receive emails up to 59 minutes after their preferred time
- No retry logic for failed email sends (Resend handles retries internally)
- No rate limiting on manual trigger endpoint (admin-only, low risk)

## Verification Checklist

- [x] `wrangler.jsonc` includes cron trigger `"0 * * * *"`
- [x] POST `/api/cron/daily-email` endpoint implemented
- [x] Timezone conversion logic implemented
- [x] User preference filtering (notifications enabled, reminder time, domains)
- [x] Email content includes count and domains
- [x] CRON_SECRET protects endpoint
- [x] Manual trigger API for testing

## Self-Check: PASSED

- All created files exist: YES
- All commits recorded: YES (3 commits)
- No type errors in new files: YES (errors in unrelated files)
- Dependencies exist: YES (email.ts, email-templates.ts, schema.ts, db/index.ts)

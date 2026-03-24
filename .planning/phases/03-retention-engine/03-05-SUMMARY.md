---
phase: 03
plan: 03-05
subsystem: notifications
tags: [email, resend, react-email, templates]
dependencies: []
key-files:
  created:
    - src/lib/email.ts
    - src/lib/email-templates.ts
    - src/components/notifications/DailyReminderEmail.tsx
    - src/components/notifications/index.ts
  modified:
    - package.json
    - package-lock.json
    - .env.local
decisions:
  - Use Resend SDK for email delivery (free tier 3,000/month)
  - Use React Email for type-safe email templates with Tailwind CSS
  - 3-level username fallback: displayName > formatted email prefix > "Learner"
  - Inline CSS via React Email Tailwind component for email client compatibility
  - Batch email support for future digest features (100 per batch)
metrics:
  duration: 25m
  completed: 2026-03-24
---

# Phase 03 Plan 03-05: Email Template & Service Summary

**One-liner:** Installed Resend SDK and React Email, created DailyReminderEmail template with inline CSS and username generation, built email service wrapper with error handling and batch support.

## What Was Built

### 1. Email Service Wrapper (`src/lib/email.ts`)

- Resend client initialization with environment validation
- `sendEmail()` function with HTML/text versions and comprehensive error handling
- `sendBatchEmails()` for future digest features (processes in batches of 100)
- `EmailResult` interface for consistent return types
- `EMAIL_CONFIG` with from/reply-to addresses

### 2. Daily Reminder Email Template (`src/components/notifications/DailyReminderEmail.tsx`)

- React Email component with Tailwind CSS styling
- Personalized greeting with username (D-09)
- Urgency-based color coding (red for 10+, amber for 5+, blue for <5)
- Domain badges display (D-07)
- Estimated time to complete (count * 0.5 minutes)
- Primary CTA button with deep link to `/review?session=daily&source=email` (D-08)
- Settings and unsubscribe links in footer
- Preview text for email clients

### 3. Email Rendering Utilities (`src/lib/email-templates.ts`)

- `generateUsername()` - 3-level fallback for personalized greetings:
  1. displayName if available
  2. Formatted email prefix (alex_smith -> Alex Smith)
  3. "Learner" fallback
- `formatDueDate()` - Chinese locale date formatting
- `renderDailyReminderEmail()` - Renders React component to HTML + plain text
- `generatePlainText()` - Creates text version for email clients

### 4. Environment Configuration

- Added `RESEND_API_KEY` to `.env.local`
- Packages added: `resend@^6.9.4`, `@react-email/components@^1.0.10`

## Verification Results

### Type Check
- `npm run type-check` passes for all email-related files
- Pre-existing `lucide-react` errors in other components are unrelated to this plan

### Template Features Verified
- [x] HTML output contains inline CSS via React Email Tailwind
- [x] Plain text version generated with all key information
- [x] Deep link to `/review?session=daily&source=email` present
- [x] Unsubscribe link present in footer
- [x] Username formatting with 3-level fallback
- [x] Domain badges shown (no content preview per D-07)
- [x] Error handling in email service wrapper

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. All functionality is fully implemented.

## Self-Check: PASSED

- [x] src/lib/email.ts exists
- [x] src/lib/email-templates.ts exists
- [x] src/components/notifications/DailyReminderEmail.tsx exists
- [x] src/components/notifications/index.ts exists
- [x] Commit a8a6a3c exists: "feat(03-05): install Resend SDK and create email service"

## Commits

| Hash | Message |
|------|---------|
| a8a6a3c | feat(03-05): install Resend SDK and create email service |

## Requirements Fulfilled

- **NOTIFY-04**: 支持邮件作为提醒渠道 - Implemented via Resend SDK and email service wrapper

## Next Steps

This plan provides the foundation for:
- Plan 03-06: Daily email cron handler (uses `sendEmail()` and `renderDailyReminderEmail()`)
- Plan 03-07: Notification preferences UI (settings links already in email footer)

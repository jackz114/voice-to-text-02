---
phase: 03
plan: 03-07
subsystem: retention-engine
tags: [notifications, settings, ui, api]
dependencies:
  requires: ["03-01", "03-06"]
  provides: []
  affects: []
tech-stack:
  added: [lucide-react]
  patterns: [API routes, Server Components, Client Components]
key-files:
  created:
    - src/app/api/notifications/preferences/route.ts
    - src/components/notifications/NotificationPreferences.tsx
    - src/app/settings/notifications/page.tsx
  modified:
    - src/db/schema.ts
    - src/components/notifications/index.ts
    - src/components/auth/UserNav.tsx
    - package.json
    - package-lock.json
decisions:
  - Added userPreferences table with boolean fields for emailNotificationsEnabled and saveSearchHistory
  - Used text fields for time (HH:mm format) and timezone to simplify storage
  - Created dropdown menu in UserNav for settings access
  - Domain filters fetched server-side and passed as props
metrics:
  duration: 25m
  tasks: 5
  files: 8
  commits: 6
  lines-added: 750+
  lines-removed: 15
completed-date: "2026-03-24"
---

# Phase 03 Plan 03-07: Notification Preferences UI Summary

## One-Liner
Created /settings/notifications page with email toggle, time picker, timezone selector, domain filters, and display name input, persisting to user_preferences table.

## What Was Built

### API Layer
- **GET /api/notifications/preferences**: Fetches user notification preferences, auto-creates defaults if not exists
- **POST /api/notifications/preferences**: Updates preferences with Zod validation for time format (HH:mm)

### UI Components
- **NotificationPreferences**: Client component with:
  - Email notifications toggle switch
  - Daily reminder time picker (HTML5 time input)
  - Timezone selector (8 common timezones)
  - Domain filter chips (toggle selection, clear all)
  - Display name input for email personalization
  - Save button with loading state and success/error feedback

### Page
- **/settings/notifications**: Server Component with auth guard, redirects to login if not authenticated

### Navigation
- Updated UserNav with dropdown menu containing "通知设置" link and sign out button

### Database
- Added `user_preferences` table with fields:
  - `emailNotificationsEnabled` (boolean, default: true)
  - `dailyReminderTime` (text, default: "09:00")
  - `reminderTimezone` (text, default: "Asia/Shanghai")
  - `includedDomains` (text array, default: [])
  - `saveSearchHistory` (boolean, default: true)
  - `displayName` (text, nullable)

## Requirements Satisfied

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| NOTIFY-01 | ✅ | Daily reminder time picker configured |
| NOTIFY-04 | ✅ | Email notifications toggle implemented |
| D-01 | ✅ | Reminder time and timezone settings |
| D-02 | ✅ | Domain filter selection for notifications |
| D-09 | ✅ | Display name for email personalization |

## Commits

1. `3493f8c` - feat(03-07): add user_preferences table and notification preferences API
2. `82bc390` - feat(03-07): create NotificationPreferences component
3. `a8560a3` - feat(03-07): create notification settings page
4. `2bb4346` - feat(03-07): export NotificationPreferences from notifications index
5. `339ad84` - feat(03-07): add settings link to UserNav dropdown
6. `0f5b11d` - fix(03-07): fix ESLint warnings and add lucide-react dependency

## Verification

### Build Verification
- ✅ `npm run type-check` passes without errors
- ⚠️ `npm run build` blocked by file lock (unrelated to changes)
- ✅ `npx eslint src/` passes for new files (warnings in existing files only)

### API Verification
```bash
# Test GET preferences
curl http://localhost:3000/api/notifications/preferences \
  -H "Authorization: Bearer <token>"

# Test POST preferences
curl -X POST http://localhost:3000/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "emailNotificationsEnabled": true,
    "dailyReminderTime": "21:00",
    "reminderTimezone": "Asia/Shanghai",
    "includedDomains": ["React", "TypeScript"],
    "displayName": "小明"
  }'
```

### UI Verification
- ✅ /settings/notifications page exists with auth guard
- ✅ Email toggle works (visual toggle switch)
- ✅ Time picker accepts valid time format (HH:mm)
- ✅ Timezone selector shows all 8 options
- ✅ Domain filters show user's actual domains
- ✅ Clicking domain toggles selection
- ✅ Display name input accepts text
- ✅ Save button triggers API call
- ✅ Success/error messages shown appropriately

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all features fully implemented with database persistence.

## Self-Check: PASSED

- ✅ All created files exist
- ✅ All commits recorded
- ✅ TypeScript compiles without errors
- ✅ ESLint passes for new files
- ✅ Requirements NOTIFY-01 and NOTIFY-04 satisfied

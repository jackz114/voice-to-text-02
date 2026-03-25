// src/app/api/cron/daily-email/route.ts
// Cloudflare Cron Trigger handler for daily reminder emails

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviewState, knowledgeItems, userPreferences } from "@/db/schema";
import { eq, lte, and, sql, inArray } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import {
  renderDailyReminderEmail,
  generateUsername,
  formatDueDate,
} from "@/lib/email-templates";

// Initialize Supabase admin client for fetching user emails (lazy loading)
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Missing Supabase environment variables");
    }
    supabaseAdmin = createClient(url, key);
  }
  return supabaseAdmin;
}

interface DueItemsByUser {
  userId: string;
  email: string;
  displayName: string | null;
  count: number;
  domains: string[];
  reminderTime: string; // HH:mm
  reminderTimezone: string;
  includedDomains: string[];
}

/**
 * Convert user local time to UTC hour for comparison
 * Example: 9:00 AM in Asia/Shanghai (UTC+8) = 1:00 UTC
 */
function getUtcHourForTimezone(localHour: number, timezone: string): number {
  // Get current date in the target timezone
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  };
  const formatter = new Intl.DateTimeFormat("en-US", options);

  // Get the timezone offset
  const timeString = formatter.format(now);
  const currentHourInTimezone = parseInt(timeString, 10);
  const currentUtcHour = now.getUTCHours();

  // Calculate offset
  let offset = currentHourInTimezone - currentUtcHour;
  if (offset > 12) offset -= 24;
  if (offset < -12) offset += 24;

  // Convert local hour to UTC
  let utcHour = localHour - offset;
  if (utcHour < 0) utcHour += 24;
  if (utcHour >= 24) utcHour -= 24;

  return utcHour;
}

/**
 * Parse reminder time string (HH:mm) to hour
 */
function parseReminderTime(timeString: string): number {
  const [hours] = timeString.split(":").map(Number);
  return hours;
}

/**
 * Check if it's time to send reminder for this user
 */
function shouldSendReminder(
  reminderTime: string,
  reminderTimezone: string,
  currentUtcHour: number
): boolean {
  const localHour = parseReminderTime(reminderTime);
  const expectedUtcHour = getUtcHourForTimezone(localHour, reminderTimezone);

  // Allow 1-hour window for sending
  return currentUtcHour === expectedUtcHour;
}

/**
 * Filter domains based on user preferences
 */
function filterDomainsByPreference(
  domains: string[],
  includedDomains: string[]
): string[] {
  // If no specific domains selected, include all
  if (!includedDomains || includedDomains.length === 0) {
    return domains;
  }

  // Otherwise, only include selected domains
  return domains.filter((d) => includedDomains.includes(d));
}

export async function POST(request: NextRequest) {
  try {
    // Step 1: Verify cron secret (security check)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized cron request");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Step 2: Get current UTC hour
    const now = new Date();
    const currentUtcHour = now.getUTCHours();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    console.log(`Cron triggered at UTC hour: ${currentUtcHour}`);

    // Step 3: Find users with due items and notification preferences
    const dueItemsQuery = await db
      .select({
        userId: knowledgeItems.userId,
        domain: knowledgeItems.domain,
        nextReviewAt: reviewState.nextReviewAt,
      })
      .from(reviewState)
      .innerJoin(knowledgeItems, eq(reviewState.knowledgeItemId, knowledgeItems.id))
      .where(
        and(
          // Due today or earlier
          lte(reviewState.nextReviewAt, now),
          // Only items that haven't been reviewed today
          sql`${reviewState.nextReviewAt} >= ${today}`
        )
      );

    // Aggregate by user
    const userMap = new Map<
      string,
      { domains: Set<string>; count: number }
    >();

    for (const item of dueItemsQuery) {
      const existing = userMap.get(item.userId);
      if (existing) {
        existing.domains.add(item.domain);
        existing.count++;
      } else {
        userMap.set(item.userId, {
          domains: new Set([item.domain]),
          count: 1,
        });
      }
    }

    // Step 4: Fetch user preferences for users with due items
    const userIdsWithDueItems = Array.from(userMap.keys());

    if (userIdsWithDueItems.length === 0) {
      console.log("No users with due items");
      return NextResponse.json({
        message: "No reminders to send",
        sent: 0,
        skipped: 0,
      });
    }

    const preferences = await db
      .select()
      .from(userPreferences)
      .where(inArray(userPreferences.userId, userIdsWithDueItems));

    // Step 5: Filter users who should receive emails now
    const usersToNotify: DueItemsByUser[] = [];

    for (const pref of preferences) {
      // Skip if email notifications disabled (D-02)
      if (!pref.emailNotificationsEnabled) {
        console.log(`User ${pref.userId}: notifications disabled`);
        continue;
      }

      // Check if it's the right time for this user (D-01)
      if (!shouldSendReminder(
        pref.dailyReminderTime,
        pref.reminderTimezone,
        currentUtcHour
      )) {
        console.log(`User ${pref.userId}: not their reminder time`);
        continue;
      }

      const dueInfo = userMap.get(pref.userId);
      if (!dueInfo || dueInfo.count === 0) {
        continue;
      }

      // Filter domains by user preference (D-02)
      const filteredDomains = filterDomainsByPreference(
        Array.from(dueInfo.domains),
        pref.includedDomains
      );

      // Skip if no domains match after filtering
      if (filteredDomains.length === 0) {
        console.log(`User ${pref.userId}: no matching domains`);
        continue;
      }

      // Fetch user email from Supabase
      const { data: userData, error: userError } = await getSupabaseAdmin().auth.admin.getUserById(
        pref.userId
      );

      if (userError || !userData.user?.email) {
        console.error(`Failed to get email for user ${pref.userId}:`, userError);
        continue;
      }

      usersToNotify.push({
        userId: pref.userId,
        email: userData.user.email,
        displayName: pref.displayName,
        count: dueInfo.count,
        domains: filteredDomains,
        reminderTime: pref.dailyReminderTime,
        reminderTimezone: pref.reminderTimezone,
        includedDomains: pref.includedDomains,
      });
    }

    console.log(`Sending reminders to ${usersToNotify.length} users`);

    // Step 6: Send emails
    const results = {
      sent: 0,
      failed: 0,
      skipped: userIdsWithDueItems.length - usersToNotify.length,
      details: [] as Array<{ email: string; success: boolean; error?: string }>,
    };

    for (const user of usersToNotify) {
      try {
        // Generate email content
        const username = generateUsername(user.email, user.displayName);
        const { html, text } = await renderDailyReminderEmail({
          username,
          count: user.count,
          domains: user.domains,
          dueDate: formatDueDate(now),
        });

        // Send email
        const result = await sendEmail({
          to: user.email,
          subject: `今日有 ${user.count} 个知识点待复习`,
          html,
          text,
        });

        if (result.success) {
          results.sent++;
          results.details.push({ email: user.email, success: true });
          console.log(`Email sent to ${user.email}`);
        } else {
          results.failed++;
          results.details.push({
            email: user.email,
            success: false,
            error: result.error,
          });
          console.error(`Failed to send to ${user.email}:`, result.error);
        }
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.details.push({
          email: user.email,
          success: false,
          error: errorMessage,
        });
        console.error(`Error sending to ${user.email}:`, error);
      }
    }

    // Step 7: Return summary
    return NextResponse.json({
      message: "Daily email cron completed",
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Cron job failed", code: "CRON_ERROR" },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing (with secret)
export async function GET(request: NextRequest) {
  return POST(request);
}

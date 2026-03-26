// src/app/api/cron/daily-email/route.ts
// Cloudflare Cron Trigger handler for daily reminder emails

import { NextRequest, NextResponse } from "next/server";
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

interface DueItem {
  id: string;
  next_review_at: string;
  knowledge_items: {
    user_id: string;
    domain: string;
  };
}

interface UserPreference {
  user_id: string;
  email_notifications_enabled: boolean;
  daily_reminder_time: string;
  reminder_timezone: string;
  included_domains: string[];
  display_name: string | null;
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
    const todayStr = today.toISOString();

    console.log(`Cron triggered at UTC hour: ${currentUtcHour}`);

    const supabase = getSupabaseAdmin();

    // Step 3: Find users with due items using Supabase REST
    const { data: dueItems, error: dueError } = await supabase
      .from("review_state")
      .select(`
        id,
        next_review_at,
        knowledge_items!inner(user_id, domain)
      `)
      .lte("next_review_at", now.toISOString())
      .gte("next_review_at", todayStr);

    if (dueError) {
      console.error("查询到期复习条目失败:", dueError);
      throw dueError;
    }

    // Aggregate by user
    const userMap = new Map<
      string,
      { domains: Set<string>; count: number }
    >();

    for (const item of (dueItems || []) as DueItem[]) {
      const userId = item.knowledge_items.user_id;
      const domain = item.knowledge_items.domain;
      const existing = userMap.get(userId);
      if (existing) {
        existing.domains.add(domain);
        existing.count++;
      } else {
        userMap.set(userId, {
          domains: new Set([domain]),
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

    const { data: preferences, error: prefError } = await supabase
      .from("user_preferences")
      .select("*")
      .in("user_id", userIdsWithDueItems);

    if (prefError) {
      console.error("查询用户偏好失败:", prefError);
      throw prefError;
    }

    // Step 5: Filter users who should receive emails now
    const usersToNotify: DueItemsByUser[] = [];

    for (const pref of (preferences || []) as UserPreference[]) {
      // Skip if email notifications disabled (D-02)
      if (!pref.email_notifications_enabled) {
        console.log(`User ${pref.user_id}: notifications disabled`);
        continue;
      }

      // Check if it's the right time for this user (D-01)
      if (!shouldSendReminder(
        pref.daily_reminder_time,
        pref.reminder_timezone,
        currentUtcHour
      )) {
        console.log(`User ${pref.user_id}: not their reminder time`);
        continue;
      }

      const dueInfo = userMap.get(pref.user_id);
      if (!dueInfo || dueInfo.count === 0) {
        continue;
      }

      // Filter domains by user preference (D-02)
      const filteredDomains = filterDomainsByPreference(
        Array.from(dueInfo.domains),
        pref.included_domains
      );

      // Skip if no domains match after filtering
      if (filteredDomains.length === 0) {
        console.log(`User ${pref.user_id}: no matching domains`);
        continue;
      }

      // Fetch user email from Supabase
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
        pref.user_id
      );

      if (userError || !userData.user?.email) {
        console.error(`Failed to get email for user ${pref.user_id}:`, userError);
        continue;
      }

      usersToNotify.push({
        userId: pref.user_id,
        email: userData.user.email,
        displayName: pref.display_name,
        count: dueInfo.count,
        domains: filteredDomains,
        reminderTime: pref.daily_reminder_time,
        reminderTimezone: pref.reminder_timezone,
        includedDomains: pref.included_domains,
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

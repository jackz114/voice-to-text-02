// src/app/api/notifications/preferences/route.ts
// GET / POST notification preferences

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Validation schema for preferences
const preferencesSchema = z.object({
  emailNotificationsEnabled: z.boolean().optional(),
  dailyReminderTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  reminderTimezone: z.string().optional(),
  includedDomains: z.array(z.string()).optional(),
  saveSearchHistory: z.boolean().optional(),
  displayName: z.string().max(50).optional().nullable(),
});

export type PreferencesResponse = {
  emailNotificationsEnabled: boolean;
  dailyReminderTime: string;
  reminderTimezone: string;
  includedDomains: string[];
  saveSearchHistory: boolean;
  displayName: string | null;
};

// GET /api/notifications/preferences
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token ?? undefined);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Fetch preferences (auto-created by trigger if not exists)
    const { data: prefs, error: dbError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (dbError) {
      console.error("获取偏好设置失败:", dbError);
      throw dbError;
    }

    if (!prefs) {
      // This shouldn't happen due to trigger, but handle gracefully
      return NextResponse.json({
        emailNotificationsEnabled: true,
        dailyReminderTime: "09:00",
        reminderTimezone: "Asia/Shanghai",
        includedDomains: [],
        saveSearchHistory: true,
        displayName: null,
      } satisfies PreferencesResponse);
    }

    return NextResponse.json({
      emailNotificationsEnabled: prefs.email_notifications_enabled,
      dailyReminderTime: prefs.daily_reminder_time,
      reminderTimezone: prefs.reminder_timezone,
      includedDomains: prefs.included_domains,
      saveSearchHistory: prefs.save_search_history,
      displayName: prefs.display_name,
    } satisfies PreferencesResponse);
  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { error: "Failed to get preferences", code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/notifications/preferences
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token ?? undefined);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const parseResult = preferencesSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid preferences",
          code: "VALIDATION_ERROR",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.emailNotificationsEnabled !== undefined) {
      updateData.email_notifications_enabled = data.emailNotificationsEnabled;
    }

    if (data.dailyReminderTime !== undefined) {
      updateData.daily_reminder_time = data.dailyReminderTime;
    }

    if (data.reminderTimezone !== undefined) {
      updateData.reminder_timezone = data.reminderTimezone;
    }

    if (data.includedDomains !== undefined) {
      updateData.included_domains = data.includedDomains;
    }

    if (data.saveSearchHistory !== undefined) {
      updateData.save_search_history = data.saveSearchHistory;
    }

    if (data.displayName !== undefined) {
      updateData.display_name = data.displayName;
    }

    const { error: updateError } = await supabase
      .from("user_preferences")
      .update(updateData)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("更新偏好设置失败:", updateError);
      throw updateError;
    }

    console.log(`Preferences updated for user ${user.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences", code: "UPDATE_ERROR" },
      { status: 500 }
    );
  }
}

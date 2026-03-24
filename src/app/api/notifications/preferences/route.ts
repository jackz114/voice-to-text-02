// src/app/api/notifications/preferences/route.ts
// GET / POST notification preferences

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
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
export async function GET() {
  try {
    // Authenticate user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Fetch preferences (auto-created by trigger if not exists)
    const prefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    if (prefs.length === 0) {
      // Create default preferences if not exists
      const defaultPrefs = {
        emailNotificationsEnabled: true,
        dailyReminderTime: "09:00",
        reminderTimezone: "Asia/Shanghai",
        includedDomains: [],
        saveSearchHistory: true,
        displayName: null,
      };

      await db.insert(userPreferences).values({
        userId: user.id,
        ...defaultPrefs,
      });

      return NextResponse.json(defaultPrefs satisfies PreferencesResponse);
    }

    const pref = prefs[0];

    return NextResponse.json({
      emailNotificationsEnabled: pref.emailNotificationsEnabled,
      dailyReminderTime: pref.dailyReminderTime,
      reminderTimezone: pref.reminderTimezone,
      includedDomains: pref.includedDomains,
      saveSearchHistory: pref.saveSearchHistory,
      displayName: pref.displayName,
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    // Check if preferences exist, create if not
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    if (existing.length === 0) {
      // Create new preferences with defaults + updates
      await db.insert(userPreferences).values({
        userId: user.id,
        emailNotificationsEnabled: data.emailNotificationsEnabled ?? true,
        dailyReminderTime: data.dailyReminderTime ?? "09:00",
        reminderTimezone: data.reminderTimezone ?? "Asia/Shanghai",
        includedDomains: data.includedDomains ?? [],
        saveSearchHistory: data.saveSearchHistory ?? true,
        displayName: data.displayName ?? null,
      });
    } else {
      // Update preferences
      const updateData: Partial<typeof userPreferences.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (data.emailNotificationsEnabled !== undefined) {
        updateData.emailNotificationsEnabled = data.emailNotificationsEnabled;
      }

      if (data.dailyReminderTime !== undefined) {
        updateData.dailyReminderTime = data.dailyReminderTime;
      }

      if (data.reminderTimezone !== undefined) {
        updateData.reminderTimezone = data.reminderTimezone;
      }

      if (data.includedDomains !== undefined) {
        updateData.includedDomains = data.includedDomains;
      }

      if (data.saveSearchHistory !== undefined) {
        updateData.saveSearchHistory = data.saveSearchHistory;
      }

      if (data.displayName !== undefined) {
        updateData.displayName = data.displayName;
      }

      await db
        .update(userPreferences)
        .set(updateData)
        .where(eq(userPreferences.userId, user.id));
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

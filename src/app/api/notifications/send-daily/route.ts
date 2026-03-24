// src/app/api/notifications/send-daily/route.ts
// Manual trigger for daily emails (admin only)

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get("authorization");
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Forward to cron handler
    const cronResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/daily-email`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      }
    );

    const result = await cronResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Send daily error:", error);
    return NextResponse.json(
      { error: "Failed to send daily emails" },
      { status: 500 }
    );
  }
}

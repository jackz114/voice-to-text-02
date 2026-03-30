// src/app/api/user/balance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: "Please sign in first", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { data: balance, error: balanceError } = await supabase
      .from("user_balances")
      .select("total_minutes, used_minutes, remaining_minutes, subscription_status")
      .eq("user_id", user.id)
      .single();

    if (balanceError || !balance) {
      // If no balance record exists, create one with default free plan (180 minutes)
      const { data: newBalance, error: createError } = await supabase
        .from("user_balances")
        .insert({
          user_id: user.id,
          total_minutes: 180,
          used_minutes: 0,
          subscription_status: "none",
        })
        .select("total_minutes, used_minutes, remaining_minutes, subscription_status")
        .single();

      if (createError || !newBalance) {
        console.error("Failed to create user balance:", createError);
        return NextResponse.json(
          { error: "Unable to get account balance", code: "BALANCE_ERROR" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        totalMinutes: newBalance.total_minutes,
        usedMinutes: newBalance.used_minutes,
        remainingMinutes: newBalance.remaining_minutes,
        subscriptionStatus: newBalance.subscription_status,
      });
    }

    return NextResponse.json({
      totalMinutes: balance.total_minutes,
      usedMinutes: balance.used_minutes,
      remainingMinutes: balance.remaining_minutes,
      subscriptionStatus: balance.subscription_status,
    });
  } catch (error) {
    console.error("Get balance error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to get balance: ${errorMessage}`, code: "BALANCE_ERROR" },
      { status: 500 }
    );
  }
}

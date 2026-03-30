import { NextRequest, NextResponse } from "next/server";
import {
  getPayPalAccessToken,
  getSubscriptionDetails,
  PayPalError,
} from "../paypal-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { subscriptionId?: string };
    const { subscriptionId } = body;

    // Parameter validation
    if (!subscriptionId || typeof subscriptionId !== "string") {
      return NextResponse.json(
        { error: "Subscription ID is required", code: "INVALID_SUBSCRIPTION_ID" },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Get subscription details
    const subscriptionData = await getSubscriptionDetails(
      accessToken,
      subscriptionId
    ) as {
      status: string;
      plan_id: string;
      start_time: string;
      billing_info?: {
        next_billing_time?: string;
        outstanding_balance?: { value?: string };
        last_payment?: {
          amount?: { value?: string };
          time?: string;
        };
      };
      subscriber?: {
        email_address?: string;
        name?: {
          given_name?: string;
          surname?: string;
        };
      };
    };

    // Validate subscription status
    const validStatuses = ["ACTIVE", "APPROVAL_PENDING"];
    if (!validStatuses.includes(subscriptionData.status)) {
      return NextResponse.json(
        {
          error: `Subscription is not active. Current status: ${subscriptionData.status}`,
          code: "SUBSCRIPTION_NOT_ACTIVE",
          status: subscriptionData.status,
        },
        { status: 400 }
      );
    }

    // Extract subscription info
    const subscriptionRecord = {
      subscriptionId,
      status: subscriptionData.status,
      planId: subscriptionData.plan_id,
      currentPeriodStart: subscriptionData.start_time,
      currentPeriodEnd: subscriptionData.billing_info?.next_billing_time,
      subscriberEmail: subscriptionData.subscriber?.email_address,
      subscriberName: subscriptionData.subscriber?.name
        ? `${subscriptionData.subscriber.name.given_name || ""} ${subscriptionData.subscriber.name.surname || ""}`.trim()
        : undefined,
      billingInfo: {
        outstandingBalance: subscriptionData.billing_info?.outstanding_balance?.value,
        lastPayment: subscriptionData.billing_info?.last_payment
          ? {
              amount: subscriptionData.billing_info.last_payment.amount?.value,
              time: subscriptionData.billing_info.last_payment.time,
            }
          : null,
        nextBillingTime: subscriptionData.billing_info?.next_billing_time,
      },
    };

    // Save to database (TODO: implement)
    // await saveSubscriptionToDatabase(subscriptionRecord);
    // await activateUserSubscription(userId, subscriptionRecord);

    // Log success
    console.log("Subscription verified successfully:", {
      subscriptionId,
      status: subscriptionData.status,
      planId: subscriptionData.plan_id,
      subscriberEmail: subscriptionRecord.subscriberEmail,
    });

    return NextResponse.json({
      success: true,
      ...subscriptionRecord,
    });
  } catch (error) {
    console.error("Verify subscription error:", error);

    // Handle PayPal-specific errors
    if (error instanceof PayPalError) {
      return NextResponse.json(
        {
          error: error.message,
          code: "PAYPAL_ERROR",
          statusCode: error.statusCode,
        },
        { status: error.statusCode || 500 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        error: "Failed to verify subscription",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

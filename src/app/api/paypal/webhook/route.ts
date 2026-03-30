import { NextRequest, NextResponse } from "next/server";
import { getPayPalAccessToken } from "../paypal-client";

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || "";
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

/**
 * PayPal Webhook verification
 * Reference: https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
 */
async function verifyWebhookSignature(
  body: string,
  headers: Headers
): Promise<boolean> {
  try {
    // Get required request headers
    const authAlgo = headers.get("paypal-auth-algo");
    const certUrl = headers.get("paypal-cert-url");
    const transmissionId = headers.get("paypal-transmission-id");
    const transmissionTime = headers.get("paypal-transmission-time");
    const transmissionSig = headers.get("paypal-transmission-sig");

    if (!authAlgo || !certUrl || !transmissionId || !transmissionTime || !transmissionSig) {
      console.error("Missing required PayPal webhook headers");
      return false;
    }

    // Build verification request body
    const verifyBody = {
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      transmission_sig: transmissionSig,
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(body),
    };

    // Call PayPal API to verify signature
    const response = await fetch(
      `${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getPayPalAccessToken()}`,
        },
        body: JSON.stringify(verifyBody),
      }
    );

    if (!response.ok) {
      console.error("PayPal webhook verification failed:", await response.text());
      return false;
    }

    const result = await response.json() as { verification_status?: string };
    return result.verification_status === "SUCCESS";
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
}

/**
 * Handle webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw request body
    const rawBody = await request.text();
    const headers = request.headers;

    console.log("PayPal Webhook received:", {
      eventType: headers.get("paypal-topic"),
      timestamp: new Date().toISOString(),
    });

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(rawBody, headers);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Parse event data
    const event = JSON.parse(rawBody);
    const eventType = event.event_type;
    const resource = event.resource;

    console.log(`Processing PayPal event: ${eventType}`, {
      id: resource?.id,
      status: resource?.status,
    });

    // Handle different event types
    switch (eventType) {
      case "CHECKOUT.ORDER.APPROVED":
        // Order approved (user authorized)
        await handleOrderApproved(resource);
        break;

      case "CHECKOUT.ORDER.COMPLETED":
        // Order completed (captured)
        await handleOrderCompleted(resource);
        break;

      case "PAYMENT.CAPTURE.COMPLETED":
        // Payment capture completed
        await handlePaymentCaptureCompleted(resource);
        break;

      case "BILLING.SUBSCRIPTION.CREATED":
        // Subscription created
        await handleSubscriptionCreated(resource);
        break;

      case "BILLING.SUBSCRIPTION.ACTIVATED":
        // Subscription activated
        await handleSubscriptionActivated(resource);
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
        // Subscription cancelled
        await handleSubscriptionCancelled(resource);
        break;

      case "BILLING.SUBSCRIPTION.EXPIRED":
        // Subscription expired
        await handleSubscriptionExpired(resource);
        break;

      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        // Subscription payment failed
        await handleSubscriptionPaymentFailed(resource);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle order approved
async function handleOrderApproved(resource: Record<string, unknown>) {
  console.log("Order approved:", resource.id);
  // Optional: Send email to notify user to continue payment
}

// Handle order completed
async function handleOrderCompleted(resource: Record<string, unknown>) {
  console.log("Order completed:", resource.id);
  // Update order status in database
  // await updateOrderStatus(resource.id, "COMPLETED");
}

// Handle payment capture completed
async function handlePaymentCaptureCompleted(resource: Record<string, unknown>) {
  const captureId = resource.id;
  const amount = (resource.amount as Record<string, string>)?.value;
  const currency = (resource.amount as Record<string, string>)?.currency_code;

  console.log("Payment capture completed:", {
    captureId,
    amount,
    currency,
  });

  // TODO:
  // 1. Update payment record in database
  // 2. Add transcription minutes to user
  // 3. Send payment success email
  // await updatePaymentStatus(captureId, "COMPLETED");
  // await addUserMinutes(userId, minutes);
}

// Handle subscription created
async function handleSubscriptionCreated(resource: Record<string, unknown>) {
  console.log("Subscription created:", resource.id);
}

// Handle subscription activated
async function handleSubscriptionActivated(resource: Record<string, unknown>) {
  const subscriptionId = resource.id;
  const status = resource.status;
  const planId = resource.plan_id;

  console.log("Subscription activated:", {
    subscriptionId,
    status,
    planId,
  });

  // Activate user subscription benefits
  // await activateUserSubscription(subscriptionId, planId);
}

// Handle subscription cancelled
async function handleSubscriptionCancelled(resource: Record<string, unknown>) {
  console.log("Subscription cancelled:", resource.id);
  // Cancel user subscription benefits
  // await cancelUserSubscription(resource.id);
}

// Handle subscription expired
async function handleSubscriptionExpired(resource: Record<string, unknown>) {
  console.log("Subscription expired:", resource.id);
  // Expire user subscription benefits
  // await expireUserSubscription(resource.id);
}

// Handle subscription payment failed
async function handleSubscriptionPaymentFailed(resource: Record<string, unknown>) {
  console.log("Subscription payment failed:", resource.id);
  // Notify user of payment failure
  // await notifyUserPaymentFailed(resource.id);
}

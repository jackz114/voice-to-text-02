import { NextRequest, NextResponse } from "next/server";
import { getPayPalAccessToken } from "../paypal-client";

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || "";
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

/**
 * PayPal Webhook 验证
 * 参考: https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
 */
async function verifyWebhookSignature(
  body: string,
  headers: Headers
): Promise<boolean> {
  try {
    // 获取必要的请求头
    const authAlgo = headers.get("paypal-auth-algo");
    const certUrl = headers.get("paypal-cert-url");
    const transmissionId = headers.get("paypal-transmission-id");
    const transmissionTime = headers.get("paypal-transmission-time");
    const transmissionSig = headers.get("paypal-transmission-sig");

    if (!authAlgo || !certUrl || !transmissionId || !transmissionTime || !transmissionSig) {
      console.error("Missing required PayPal webhook headers");
      return false;
    }

    // 构建验证请求体
    const verifyBody = {
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      transmission_sig: transmissionSig,
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(body),
    };

    // 调用 PayPal API 验证签名
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

    const result = await response.json();
    return result.verification_status === "SUCCESS";
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
}

/**
 * 处理 Webhook 事件
 */
export async function POST(request: NextRequest) {
  try {
    // 获取原始请求体
    const rawBody = await request.text();
    const headers = request.headers;

    console.log("PayPal Webhook received:", {
      eventType: headers.get("paypal-topic"),
      timestamp: new Date().toISOString(),
    });

    // 验证 Webhook 签名
    const isValid = await verifyWebhookSignature(rawBody, headers);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // 解析事件数据
    const event = JSON.parse(rawBody);
    const eventType = event.event_type;
    const resource = event.resource;

    console.log(`Processing PayPal event: ${eventType}`, {
      id: resource?.id,
      status: resource?.status,
    });

    // 处理不同类型的事件
    switch (eventType) {
      case "CHECKOUT.ORDER.APPROVED":
        // 订单已批准（用户已授权）
        await handleOrderApproved(resource);
        break;

      case "CHECKOUT.ORDER.COMPLETED":
        // 订单已完成（已捕获）
        await handleOrderCompleted(resource);
        break;

      case "PAYMENT.CAPTURE.COMPLETED":
        // 支付捕获完成
        await handlePaymentCaptureCompleted(resource);
        break;

      case "BILLING.SUBSCRIPTION.CREATED":
        // 订阅已创建
        await handleSubscriptionCreated(resource);
        break;

      case "BILLING.SUBSCRIPTION.ACTIVATED":
        // 订阅已激活
        await handleSubscriptionActivated(resource);
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
        // 订阅已取消
        await handleSubscriptionCancelled(resource);
        break;

      case "BILLING.SUBSCRIPTION.EXPIRED":
        // 订阅已过期
        await handleSubscriptionExpired(resource);
        break;

      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
        // 订阅支付失败
        await handleSubscriptionPaymentFailed(resource);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // 返回 200 确认收到
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 处理订单已批准
async function handleOrderApproved(resource: Record<string, unknown>) {
  console.log("Order approved:", resource.id);
  // 可选：发送邮件通知用户继续支付
}

// 处理订单已完成
async function handleOrderCompleted(resource: Record<string, unknown>) {
  console.log("Order completed:", resource.id);
  // 更新数据库中的订单状态
  // await updateOrderStatus(resource.id, "COMPLETED");
}

// 处理支付捕获完成
async function handlePaymentCaptureCompleted(resource: Record<string, unknown>) {
  const captureId = resource.id;
  const amount = (resource.amount as Record<string, string>)?.value;
  const currency = (resource.amount as Record<string, string>)?.currency_code;

  console.log("Payment capture completed:", {
    captureId,
    amount,
    currency,
  });

  // 这里应该：
  // 1. 更新数据库中的支付记录
  // 2. 增加用户的转录时长
  // 3. 发送支付成功邮件
  // await updatePaymentStatus(captureId, "COMPLETED");
  // await addUserMinutes(userId, minutes);
}

// 处理订阅已创建
async function handleSubscriptionCreated(resource: Record<string, unknown>) {
  console.log("Subscription created:", resource.id);
}

// 处理订阅已激活
async function handleSubscriptionActivated(resource: Record<string, unknown>) {
  const subscriptionId = resource.id;
  const status = resource.status;
  const planId = resource.plan_id;

  console.log("Subscription activated:", {
    subscriptionId,
    status,
    planId,
  });

  // 激活用户的会员权益
  // await activateUserSubscription(subscriptionId, planId);
}

// 处理订阅已取消
async function handleSubscriptionCancelled(resource: Record<string, unknown>) {
  console.log("Subscription cancelled:", resource.id);
  // 取消用户的会员权益
  // await cancelUserSubscription(resource.id);
}

// 处理订阅已过期
async function handleSubscriptionExpired(resource: Record<string, unknown>) {
  console.log("Subscription expired:", resource.id);
  // 过期用户的会员权益
  // await expireUserSubscription(resource.id);
}

// 处理订阅支付失败
async function handleSubscriptionPaymentFailed(resource: Record<string, unknown>) {
  console.log("Subscription payment failed:", resource.id);
  // 通知用户支付失败
  // await notifyUserPaymentFailed(resource.id);
}

import { NextRequest, NextResponse } from "next/server";
import {
  getPayPalAccessToken,
  getSubscriptionDetails,
  PayPalError,
} from "../paypal-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId } = body;

    // 参数验证
    if (!subscriptionId || typeof subscriptionId !== "string") {
      return NextResponse.json(
        { error: "Subscription ID is required", code: "INVALID_SUBSCRIPTION_ID" },
        { status: 400 }
      );
    }

    // 获取 PayPal 访问令牌
    const accessToken = await getPayPalAccessToken();

    // 获取订阅详情
    const subscriptionData = await getSubscriptionDetails(
      accessToken,
      subscriptionId
    );

    // 验证订阅状态
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

    // 提取订阅信息
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

    // 保存到数据库 (建议实现)
    // await saveSubscriptionToDatabase(subscriptionRecord);
    // await activateUserSubscription(userId, subscriptionRecord);

    // 记录成功日志
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

    // 处理 PayPal 特定错误
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

    // 处理其他错误
    return NextResponse.json(
      {
        error: "Failed to verify subscription",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

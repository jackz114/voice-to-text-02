import { NextRequest, NextResponse } from "next/server";
import {
  getPayPalAccessToken,
  capturePayPalOrder,
  getOrderDetails,
  PayPalError,
} from "../paypal-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { orderId?: string };
    const { orderId } = body;

    // 参数验证
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Order ID is required", code: "INVALID_ORDER_ID" },
        { status: 400 }
      );
    }

    // 获取 PayPal 访问令牌
    const accessToken = await getPayPalAccessToken();

    // 步骤 1: 验证订单状态 (官方推荐的最佳实践)
    // 在捕获之前验证订单是否有效且未被处理
    const orderDetails = await getOrderDetails(accessToken, orderId);

    // 检查订单状态
    if (orderDetails.status === "COMPLETED") {
      // 订单已经被捕获过，返回已完成的订单
      console.log("Order already completed:", orderId);
      return NextResponse.json({
        orderId,
        status: "COMPLETED",
        message: "Order was already captured",
        details: orderDetails,
      });
    }

    if (orderDetails.status !== "APPROVED") {
      return NextResponse.json(
        {
          error: `Order is not ready for capture. Current status: ${orderDetails.status}`,
          code: "INVALID_ORDER_STATUS",
          status: orderDetails.status,
        },
        { status: 400 }
      );
    }

    // 步骤 2: 捕获订单
    const captureData = await capturePayPalOrder(accessToken, orderId);

    // 步骤 3: 验证捕获结果
    if (captureData.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error: "Payment capture failed",
          code: "CAPTURE_FAILED",
          status: captureData.status,
        },
        { status: 400 }
      );
    }

    // 步骤 4: 提取支付信息
    const purchaseUnit = captureData.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];

    const paymentRecord = {
      orderId,
      status: captureData.status,
      captureId: capture?.id,
      amount: capture?.amount?.value,
      currency: capture?.amount?.currency_code,
      paypalFee: capture?.seller_receivable_breakdown?.paypal_fee?.value,
      netAmount: capture?.seller_receivable_breakdown?.net_amount?.value,
      payerEmail: captureData.payer?.email_address,
      payerName: captureData.payer?.name
        ? `${captureData.payer.name.given_name || ""} ${captureData.payer.name.surname || ""}`.trim()
        : undefined,
      customId: purchaseUnit?.custom_id,
      invoiceId: purchaseUnit?.invoice_id,
      createdAt: capture?.create_time,
    };

    // 步骤 5: 保存到数据库 (建议实现)
    // await savePaymentToDatabase(paymentRecord);
    // await updateUserBalance(userId, paymentRecord.netAmount);

    // 记录成功日志
    console.log("Payment captured successfully:", {
      orderId,
      captureId: paymentRecord.captureId,
      amount: paymentRecord.amount,
      currency: paymentRecord.currency,
      payerEmail: paymentRecord.payerEmail,
    });

    return NextResponse.json({
      success: true,
      ...paymentRecord,
    });
  } catch (error) {
    console.error("Capture order error:", error);

    // 处理 PayPal 特定错误
    if (error instanceof PayPalError) {
      // 处理特定的 PayPal 错误码
      if (error.statusCode === 422) {
        return NextResponse.json(
          {
            error: "Order cannot be captured. It may have already been captured or cancelled.",
            code: "ORDER_NOT_CAPTURABLE",
          },
          { status: 422 }
        );
      }

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
        error: "Failed to capture order",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

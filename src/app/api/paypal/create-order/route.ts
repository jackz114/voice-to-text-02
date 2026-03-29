import { NextRequest, NextResponse } from "next/server";
import {
  getPayPalAccessToken,
  createPayPalOrder,
  PayPalError,
} from "../paypal-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      amount?: string;
      currency?: string;
      description?: string;
      customId?: string;
    };
    const {
      amount,
      currency = "USD",
      description = "Revnote Service",
      customId, // 商家内部订单 ID
    } = body;

    // 参数验证
    if (!amount || typeof amount !== "string") {
      return NextResponse.json(
        { error: "Amount is required and must be a string", code: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    // 验证金额格式 (必须是有效的数字)
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number", code: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    // 验证金额精度 (PayPal 最多支持 2 位小数)
    if (amount.split(".")[1]?.length > 2) {
      return NextResponse.json(
        { error: "Amount can have at most 2 decimal places", code: "INVALID_AMOUNT_PRECISION" },
        { status: 400 }
      );
    }

    // 验证币种
    const validCurrencies = ["USD", "EUR", "GBP", "CNY", "JPY", "AUD", "CAD"];
    if (!validCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: "Unsupported currency", code: "INVALID_CURRENCY" },
        { status: 400 }
      );
    }

    // 获取 PayPal 访问令牌
    const accessToken = await getPayPalAccessToken();

    // 创建订单
    const order = await createPayPalOrder(
      accessToken,
      amount,
      currency,
      description,
      {
        customId,
        invoiceId: `INV-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      }
    );

    // 记录订单创建日志 (生产环境应该保存到数据库)
    console.log("PayPal order created:", {
      orderId: order.id,
      amount,
      currency,
      customId,
      status: order.status,
    });

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      amount,
      currency,
    });
  } catch (error) {
    console.error("Create order error:", error);

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
        error: "Failed to create order",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getPayPalAccessToken, createPayPalOrder, PayPalError } from "../paypal-client";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      amount?: string;
      currency?: string;
      description?: string;
      customId?: string;
    };
    const {
      amount,
      currency = "USD",
      description = "Recallmemo Service",
      customId, // Internal merchant order ID
    } = body;

    // Parameter validation
    if (!amount || typeof amount !== "string") {
      return NextResponse.json(
        { error: "Amount is required and must be a string", code: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    // Validate amount format (must be a valid number)
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number", code: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    // Validate amount precision (PayPal supports max 2 decimal places)
    if (amount.split(".")[1]?.length > 2) {
      return NextResponse.json(
        { error: "Amount can have at most 2 decimal places", code: "INVALID_AMOUNT_PRECISION" },
        { status: 400 }
      );
    }

    // Validate currency
    const validCurrencies = ["USD", "EUR", "GBP", "CNY", "JPY", "AUD", "CAD"];
    if (!validCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: "Unsupported currency", code: "INVALID_CURRENCY" },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create order
    const order = await createPayPalOrder(accessToken, amount, currency, description, {
      customId,
      invoiceId: `INV-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    });

    // Log order creation (in production, save to database)
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
        error: "Failed to create order",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

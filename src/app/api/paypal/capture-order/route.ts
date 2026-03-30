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

    // Parameter validation
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Order ID is required", code: "INVALID_ORDER_ID" },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Step 1: Validate order status (official best practice)
    // Verify the order is valid and not already processed before capture
    const orderDetails = await getOrderDetails(accessToken, orderId);

    // 检查订单状态
    if (orderDetails.status === "COMPLETED") {
      // Order already captured, return completed order
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

    // Step 2: Capture order
    const captureData = await capturePayPalOrder(accessToken, orderId);

    // Step 3: Validate capture result
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

    // Step 4: Extract payment information
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

    // Step 5: Save to database (TODO: implement)
    // await savePaymentToDatabase(paymentRecord);
    // await updateUserBalance(userId, paymentRecord.netAmount);

    // Log success
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

    // Handle PayPal-specific errors
    if (error instanceof PayPalError) {
      // Handle specific PayPal error codes
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

    // Handle other errors
    return NextResponse.json(
      {
        error: "Failed to capture order",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

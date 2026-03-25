// PayPal API 客户端工具
// 使用真实凭证: Client ID 和 Secret

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_API_URL =
  process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

// 接口定义
interface PayPalOrderAmount {
  currency_code: string;
  value: string;
  breakdown?: {
    item_total: {
      currency_code: string;
      value: string;
    };
  };
}

interface PayPalPaymentCapture {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
  seller_receivable_breakdown?: {
    gross_amount?: { currency_code: string; value: string };
    paypal_fee?: { currency_code: string; value: string };
    net_amount?: { currency_code: string; value: string };
  };
  create_time?: string;
}

interface PayPalPurchaseUnit {
  amount: PayPalOrderAmount;
  description?: string;
  custom_id?: string;
  invoice_id?: string;
  soft_descriptor?: string;
  payments?: {
    captures?: PayPalPaymentCapture[];
  };
}

interface PayPalOrder {
  id: string;
  status: string;
  intent: string;
  purchase_units: PayPalPurchaseUnit[];
  payer?: {
    email_address?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
  payment_source?: Record<string, unknown>;
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

// 错误类
export class PayPalError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseData?: unknown
  ) {
    super(message);
    this.name = "PayPalError";
  }
}

// 获取 PayPal 访问令牌
export async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString(
    "base64"
  );

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new PayPalError(
      `Failed to get PayPal access token: ${errorData.error_description || response.statusText}`,
      response.status,
      errorData
    );
  }

  const data = await response.json();
  return data.access_token;
}

// 创建订单
export async function createPayPalOrder(
  accessToken: string,
  amount: string,
  currency: string,
  description: string,
  options?: {
    customId?: string;
    invoiceId?: string;
  }
): Promise<PayPalOrder> {
  const purchaseUnit: PayPalPurchaseUnit = {
    amount: {
      currency_code: currency,
      value: amount,
      breakdown: {
        item_total: {
          currency_code: currency,
          value: amount,
        },
      },
    },
    description,
    custom_id: options?.customId,
    invoice_id: options?.invoiceId || generateInvoiceId(),
    soft_descriptor: "VoiceToText",
  };

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": generateRequestId(),
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [purchaseUnit],
      application_context: {
        brand_name: "Voice to Text",
        locale: "zh-CN",
        landing_page: "LOGIN",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://bijiassistant.shop"}/payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://bijiassistant.shop"}/payment/cancel`,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new PayPalError(
      `Failed to create PayPal order: ${errorData.message || response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// 获取订单详情
export async function getOrderDetails(
  accessToken: string,
  orderId: string
): Promise<PayPalOrder> {
  const response = await fetch(
    `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new PayPalError(
      `Failed to get order details: ${errorData.message || response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// 捕获订单
export async function capturePayPalOrder(
  accessToken: string,
  orderId: string
): Promise<PayPalOrder> {
  const response = await fetch(
    `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": generateRequestId(),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new PayPalError(
      `Failed to capture PayPal order: ${errorData.message || response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// 验证订阅
export async function getSubscriptionDetails(
  accessToken: string,
  subscriptionId: string
) {
  const response = await fetch(
    `${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new PayPalError(
      `Failed to get subscription details: ${errorData.message || response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// 生成发票 ID
function generateInvoiceId(): string {
  return `INV-${Date.now()}-${crypto.randomUUID().replace(/-/g, "").substring(0, 9)}`;
}

// 生成请求 ID
function generateRequestId(): string {
  return `${Date.now()}-${crypto.randomUUID().replace(/-/g, "").substring(0, 12)}`;
}

export type { PayPalOrder, PayPalPurchaseUnit };

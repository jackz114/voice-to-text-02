"use client";

import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { useState } from "react";

// PayPal SDK initial configuration options
// 参考: https://developer.paypal.com/docs/checkout/advanced/sdk/v1/configuration/
const getInitialOptions = (currency: string) => ({
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
  currency,
  intent: "capture" as const,
  // Enable additional payment methods
  "enable-funding": "card,paylater",
  // Disable unnecessary payment methods
  "disable-funding": "credit",
  // Components: buttons must be included
  components: "buttons",
  // Force English
  locale: "en_US",
});

// PayPal button style configuration
// 参考: https://developer.paypal.com/docs/checkout/advanced/customize/button-style/
const buttonStyle = {
  layout: "vertical" as const,
  color: "gold" as const,
  shape: "rect" as const,
  label: "pay" as const,
  height: 45,
};

// Subscription SDK configuration
const subscriptionSdkOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
  vault: true,
  intent: "subscription" as const,
  components: "buttons",
  locale: "en_US",
};

interface PayPalButtonProps {
  amount: string;
  currency?: string;
  description?: string;
  customId?: string; // Internal order ID for idempotency
  onSuccess?: (details: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  className?: string;
}

// Loading state component
function PayPalLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      <span className="ml-2 text-sm text-gray-600">Loading payment...</span>
    </div>
  );
}

// 错误显示组件
function PayPalErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
      <p className="text-red-700 dark:text-red-400 text-sm">Payment failed: {message}</p>
      <p className="text-xs text-gray-500 mt-1">Please refresh the page and try again</p>
    </div>
  );
}

export function PayPalButton({
  amount,
  currency = "USD",
  description = "Recallmemo Service",
  customId,
  onSuccess,
  onError,
  onCancel,
  className = "",
}: PayPalButtonProps) {
  const [isPending, setIsPending] = useState(false);

  // 创建订单 - 服务端创建
  const createOrder = async () => {
    try {
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
          customId,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || "Failed to create order");
      }

      const data = (await response.json()) as { orderId: string };
      return data.orderId;
    } catch (error) {
      console.error("Create order error:", error);
      throw error;
    }
  };

  // 用户批准支付后
  const onApprove = async (data: { orderID: string }) => {
    setIsPending(true);
    try {
      const response = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: data.orderID,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || "Payment processing failed");
      }

      const orderData = (await response.json()) as Record<string, unknown>;
      onSuccess?.(orderData);
    } catch (error) {
      console.error("Capture order error:", error);
      onError?.(error as Error);
    } finally {
      setIsPending(false);
    }
  };

  // 用户取消支付
  const handleCancel = () => {
    console.log("Payment cancelled by user");
    onCancel?.();
  };

  // 处理错误
  const handleError = (err: Record<string, unknown>) => {
    console.error("PayPal error:", err);
    onError?.(new Error(String(err.message || "Payment error occurred")));
  };

  return (
    <div className={className}>
      {isPending && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-blue-700 dark:text-blue-400 text-sm text-center">
            Processing payment, please wait...
          </p>
        </div>
      )}
      <PayPalScriptProvider options={getInitialOptions(currency)}>
        <PayPalButtonWrapper
          createOrder={createOrder}
          onApprove={onApprove}
          onCancel={handleCancel}
          onError={handleError}
        />
      </PayPalScriptProvider>
    </div>
  );
}

// 内部组件用于处理 SDK 加载状态
function PayPalButtonWrapper({
  createOrder,
  onApprove,
  onCancel,
  onError,
}: {
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onCancel?: () => void;
  onError: (err: Record<string, unknown>) => void;
}) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  if (isRejected) {
    return <PayPalErrorMessage message="Failed to load PayPal SDK" />;
  }

  return (
    <PayPalButtons
      createOrder={createOrder}
      onApprove={onApprove}
      onCancel={onCancel}
      onError={onError}
      style={buttonStyle}
      disabled={isPending}
    />
  );
}

// 直接使用页面级 PayPalScriptProvider 的按钮（用于共享 provider）
export function PayPalButtonDirect({
  amount,
  currency = "USD",
  description = "Recallmemo Service",
  customId,
  onSuccess,
  onError,
  onCancel,
}: Omit<PayPalButtonProps, "className">) {
  const [isPending, setIsPending] = useState(false);

  const createOrder = async () => {
    try {
      const response = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency, description, customId }),
      });
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || "Failed to create order");
      }
      const data = (await response.json()) as { orderId: string };
      return data.orderId;
    } catch (error) {
      console.error("Create order error:", error);
      throw error;
    }
  };

  const onApprove = async (data: { orderID: string }) => {
    setIsPending(true);
    try {
      const response = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || "Payment processing failed");
      }
      const orderData = (await response.json()) as Record<string, unknown>;
      onSuccess?.(orderData);
    } catch (error) {
      console.error("Capture order error:", error);
      onError?.(error as Error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <PayPalButtonWrapper
      createOrder={createOrder}
      onApprove={onApprove}
      onCancel={
        onCancel
          ? () => {
              console.log("Payment cancelled");
              onCancel();
            }
          : undefined
      }
      onError={
        onError
          ? (err) => onError(new Error(String(err.message || "Payment error occurred")))
          : () => {}
      }
    />
  );
}

// 订阅按钮组件
interface PayPalSubscriptionButtonProps {
  planId: string;
  onSuccess?: (details: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  className?: string;
}

export function PayPalSubscriptionButton({
  planId,
  onSuccess,
  onError,
  onCancel,
  className = "",
}: PayPalSubscriptionButtonProps) {
  const [isPending, setIsPending] = useState(false);

  // 创建订阅
  const createSubscription = async (
    _data: unknown,
    actions: { subscription: { create: (config: { plan_id: string }) => Promise<string> } }
  ) => {
    return actions.subscription.create({
      plan_id: planId,
    });
  };

  // 用户批准订阅
  const onApprove = async (data: { subscriptionID?: string | null }) => {
    if (!data.subscriptionID) {
      throw new Error("Subscription ID is missing");
    }
    setIsPending(true);
    try {
      const response = await fetch("/api/paypal/verify-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: data.subscriptionID,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || "Subscription verification failed");
      }

      const subscriptionData = (await response.json()) as Record<string, unknown>;
      onSuccess?.(subscriptionData);
    } catch (error) {
      console.error("Subscription verification error:", error);
      onError?.(error as Error);
    } finally {
      setIsPending(false);
    }
  };

  // 处理错误
  const handleError = (err: Record<string, unknown>) => {
    console.error("PayPal subscription error:", err);
    onError?.(new Error(String(err.message || "Subscription error occurred")));
  };

  return (
    <div className={className}>
      {isPending && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-blue-700 dark:text-blue-400 text-sm text-center">
            Processing subscription, please wait...
          </p>
        </div>
      )}
      <PayPalScriptProvider options={subscriptionSdkOptions}>
        <PayPalSubscriptionWrapper
          createSubscription={createSubscription}
          onApprove={onApprove}
          onCancel={onCancel}
          onError={handleError}
        />
      </PayPalScriptProvider>
    </div>
  );
}

// 订阅按钮加载状态处理
function PayPalSubscriptionWrapper({
  createSubscription,
  onApprove,
  onCancel,
  onError,
}: {
  createSubscription: (
    _data: unknown,
    actions: { subscription: { create: (config: { plan_id: string }) => Promise<string> } }
  ) => Promise<string>;
  onApprove: (data: { subscriptionID?: string | null }) => Promise<void>;
  onCancel?: () => void;
  onError: (err: Record<string, unknown>) => void;
}) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  if (isRejected) {
    return <PayPalErrorMessage message="Failed to load PayPal SDK" />;
  }

  return (
    <PayPalButtons
      createSubscription={createSubscription}
      onApprove={onApprove}
      onCancel={onCancel}
      onError={onError}
      style={{
        ...buttonStyle,
        label: "subscribe" as const,
      }}
      disabled={isPending}
    />
  );
}

// 直接使用页面级 PayPalScriptProvider 的订阅按钮
export function PayPalSubscriptionButtonDirect({
  planId,
  onSuccess,
  onError,
  onCancel,
}: Omit<PayPalSubscriptionButtonProps, "className">) {
  const createSubscription = async (
    _data: unknown,
    actions: { subscription: { create: (config: { plan_id: string }) => Promise<string> } }
  ) => {
    return actions.subscription.create({ plan_id: planId });
  };

  const onApprove = async (data: { subscriptionID?: string | null }) => {
    if (!data.subscriptionID) throw new Error("Subscription ID is missing");
    try {
      const response = await fetch("/api/paypal/verify-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: data.subscriptionID }),
      });
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || "Subscription verification failed");
      }
      const subscriptionData = (await response.json()) as Record<string, unknown>;
      onSuccess?.(subscriptionData);
    } catch (error) {
      console.error("Subscription verification error:", error);
      onError?.(error as Error);
    }
  };

  return (
    <PayPalScriptProvider options={subscriptionSdkOptions}>
      <PayPalSubscriptionWrapper
        createSubscription={createSubscription}
        onApprove={onApprove}
        onCancel={
          onCancel
            ? () => {
                console.log("Subscription cancelled");
                onCancel();
              }
            : undefined
        }
        onError={
          onError
            ? (err) => onError(new Error(String(err.message || "Subscription error occurred")))
            : () => {}
        }
      />
    </PayPalScriptProvider>
  );
}

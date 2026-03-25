"use client";

import { useState } from "react";
import {
  PayPalButton,
  PayPalSubscriptionButton,
} from "@/components/payment/PayPalButton";

interface PaymentResult {
  success: boolean;
  orderId?: string;
  status?: string;
  amount?: string;
  currency?: string;
  payerEmail?: string;
  captureId?: string;
}

export default function PaymentPage() {
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [subscriptionResult, setSubscriptionResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"onetime" | "subscription">("onetime");

  const handlePaymentSuccess = (details: Record<string, unknown>) => {
    console.log("Payment successful:", details);
    const result: PaymentResult = {
      success: true,
      orderId: details.orderId as string,
      status: details.status as string,
      amount: details.amount as string,
      currency: details.currency as string,
      payerEmail: details.payerEmail as string,
      captureId: details.captureId as string,
    };
    setPaymentResult(result);
    setError(null);
  };

  const handlePaymentError = (err: Error) => {
    console.error("Payment error:", err);
    setError(err.message || "支付过程中发生错误，请重试");
    setPaymentResult(null);
  };

  const handlePaymentCancel = () => {
    console.log("Payment cancelled");
    setError("支付已取消");
  };

  const handleSubscriptionSuccess = (details: Record<string, unknown>) => {
    console.log("Subscription successful:", details);
    setSubscriptionResult(details);
    setError(null);
  };

  const handleSubscriptionError = (err: Error) => {
    console.error("Subscription error:", err);
    setError(err.message || "订阅过程中发生错误，请重试");
    setSubscriptionResult(null);
  };

  const handleSubscriptionCancel = () => {
    console.log("Subscription cancelled");
    setError("订阅已取消");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            升级您的体验
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            选择适合您的方案，开始无限量语音转文本
          </p>
        </div>

        {/* 标签切换 */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm inline-flex">
            <button
              onClick={() => setActiveTab("onetime")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === "onetime"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              单次购买
            </button>
            <button
              onClick={() => setActiveTab("subscription")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === "subscription"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              月度订阅
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error ? (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-700 dark:text-red-400 text-sm text-center">
              {error}
            </p>
          </div>
        ) : null}

        {/* 单次购买 */}
        {activeTab === "onetime" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* 基础套餐 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  基础套餐
                </h2>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                  最受欢迎
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                适合个人用户，100 分钟语音转文本服务
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $9.99
                </span>
                <span className="text-gray-500 dark:text-gray-400">/次</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  100 分钟转录时长
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  支持多语言识别
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  永不过期
                </li>
              </ul>
              <PayPalButton
                amount="9.99"
                currency="USD"
                description="Voice to Text - 基础套餐 (100分钟)"
                customId="BASIC_100MIN"
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            </div>

            {/* 专业套餐 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  专业套餐
                </h2>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs rounded-full">
                  超值
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                适合专业用户，500 分钟语音转文本服务
              </p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $39.99
                </span>
                <span className="text-gray-500 dark:text-gray-400">/次</span>
                <span className="ml-2 text-sm text-green-600">省 $10</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  500 分钟转录时长
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  支持多语言识别
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  优先技术支持
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  永不过期
                </li>
              </ul>
              <PayPalButton
                amount="39.99"
                currency="USD"
                description="Voice to Text - 专业套餐 (500分钟)"
                customId="PRO_500MIN"
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handlePaymentCancel}
              />
            </div>
          </div>
        )}

        {/* 月度订阅 */}
        {activeTab === "subscription" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                月度会员
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                无限量语音转文本 + 优先支持
              </p>
            </div>

            <div className="text-center mb-8">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">
                $19.99
              </span>
              <span className="text-gray-500 dark:text-gray-400">/月</span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                无限量语音转文本
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                支持所有语言
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                7x24 优先技术支持
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                随时取消，无长期承诺
              </li>
            </ul>

            {/* 订阅按钮 */}
            {process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID ? (
              <PayPalSubscriptionButton
                planId={process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID}
                onSuccess={handleSubscriptionSuccess}
                onError={handleSubscriptionError}
                onCancel={handleSubscriptionCancel}
              />
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-700 dark:text-yellow-400 text-sm text-center">
                  订阅功能配置中，敬请期待
                </p>
              </div>
            )}
          </div>
        )}

        {/* 支付成功提示 */}
        {paymentResult?.success ? (
          <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 text-center mb-2">
              支付成功！
            </h3>
            <p className="text-green-700 dark:text-green-400 text-sm text-center">
              订单号: {paymentResult.orderId}
            </p>
            <p className="text-green-600 dark:text-green-500 text-xs text-center mt-1">
              金额: {paymentResult.currency} {paymentResult.amount}
            </p>
          </div>
        ) : null}

        {/* 订阅成功提示 */}
        {subscriptionResult?.success ? (
          <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 text-center mb-2">
              订阅成功！
            </h3>
            <p className="text-green-700 dark:text-green-400 text-sm text-center">
              欢迎加入月度会员，无限量使用语音转文本服务
            </p>
          </div>
        ) : null}

        {/* 使用说明 */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>测试环境请使用 PayPal Sandbox 账号</p>
          <p className="mt-1">
            测试卡号: 4111111111111111 | 过期: 12/25 | CVV: 123
          </p>
          <p className="mt-2 text-xs">
            支付安全由 PayPal 提供保障
          </p>
        </div>
      </div>
    </div>
  );
}

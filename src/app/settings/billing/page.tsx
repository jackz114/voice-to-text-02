// src/app/settings/billing/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import {
  PayPalSubscriptionButtonDirect,
} from "@/components/payment/PayPalButton";

const paypalOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
  currency: "USD",
  intent: "capture" as const,
  components: "buttons",
  locale: "en_US",
};

function BillingContent() {
  const { user } = useAuth();
  const [subscriptionResult, setSubscriptionResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscriptionSuccess = (details: Record<string, unknown>) => {
    console.log("Subscription successful:", details);
    setSubscriptionResult(details);
    setError(null);
  };

  const handleSubscriptionError = (err: Error) => {
    console.error("Subscription error:", err);
    setError(err.message || "Subscription failed");
    setSubscriptionResult(null);
  };

  const handleSubscriptionCancel = () => {
    setError("Subscription cancelled");
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E0D5]">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <h1 className="text-2xl font-bold text-[#1C1C1C]">Billing & Subscription</h1>
          <p className="mt-1 text-[#6B5B4F]">
            Manage your plan and payment methods
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Current Plan */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-[#E8E0D5]">
            <h2 className="text-lg font-semibold text-[#1C1C1C]">Current Plan</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-semibold text-[#1C1C1C]">Free Plan</span>
                  <span className="px-2 py-0.5 bg-[#B8860B]/10 text-[#B8860B] text-xs font-medium rounded-full">
                    Current
                  </span>
                </div>
                <p className="text-[#6B5B4F]">180 minutes per month</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#B8860B]">$0</p>
                <p className="text-sm text-[#9C8E80]">/month</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E8E0D5]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B5B4F]">Minutes used this month</span>
                <span className="font-medium text-[#1C1C1C]">0 of 180 minutes</span>
              </div>
              <div className="mt-2 h-2 bg-[#FAF7F2] rounded-full overflow-hidden">
                <div className="h-full bg-[#B8860B] rounded-full" style={{ width: "0%" }} />
              </div>
            </div>
          </div>
        </section>

        {/* Upgrade Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-[#E8E0D5]">
            <h2 className="text-lg font-semibold text-[#1C1C1C]">Choose Your Plan</h2>
          </div>
          <div className="p-6">
            {/* Error Message */}
            {error ? (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm text-center">{error}</p>
              </div>
            ) : null}

            {/* Success Message */}
            {subscriptionResult && subscriptionResult.success ? (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <h3 className="text-green-800 font-medium text-center mb-1">Subscription Active!</h3>
                <p className="text-green-600 text-sm text-center">Welcome to your new plan.</p>
              </div>
            ) : null}

            {/* Subscription Plans */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Basic Plan */}
              <div className="border border-[#E8E0D5] rounded-xl p-6 hover:border-[#B8860B] transition-colors">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[#1C1C1C]">Basic</h3>
                  <p className="text-sm text-[#9C8E80]">Essential features</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-[#1C1C1C]">$0.99</span>
                  <span className="text-[#9C8E80]">/month</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm text-[#6B5B4F]">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    100 transcription minutes/month
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    All languages
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Cancel anytime
                  </li>
                </ul>
                <PayPalSubscriptionButtonDirect
                  planId="P-9GS052867F819673SNHE7HGA"
                  onSuccess={handleSubscriptionSuccess}
                  onError={handleSubscriptionError}
                  onCancel={handleSubscriptionCancel}
                />
              </div>

              {/* Pro Plan */}
              <div className="border-2 border-[#B8860B] rounded-xl p-6 relative">
                <span className="absolute -top-2 left-4 px-2 py-0.5 bg-[#B8860B] text-white text-xs font-medium rounded-full">
                  Best Value
                </span>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[#1C1C1C]">Pro</h3>
                  <p className="text-sm text-[#9C8E80]">For power users</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-[#1C1C1C]">$2.99</span>
                  <span className="text-[#9C8E80]">/month</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm text-[#6B5B4F]">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    500 transcription minutes/month
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    All languages
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Cancel anytime
                  </li>
                </ul>
                <PayPalSubscriptionButtonDirect
                  planId="P-74616681K0259400UNHE7LVY"
                  onSuccess={handleSubscriptionSuccess}
                  onError={handleSubscriptionError}
                  onCancel={handleSubscriptionCancel}
                />
              </div>

              {/* Premium Plan */}
              <div className="border border-[#E8E0D5] rounded-xl p-6 hover:border-[#B8860B] transition-colors">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[#1C1C1C]">Premium</h3>
                  <p className="text-sm text-[#9C8E80]">Unlimited learning</p>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-[#1C1C1C]">$9.99</span>
                  <span className="text-[#9C8E80]">/month</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm text-[#6B5B4F]">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Unlimited transcription minutes
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    All languages
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Cancel anytime
                  </li>
                </ul>
                <PayPalSubscriptionButtonDirect
                  planId="P-414278977N779202KNHE7KYQ"
                  onSuccess={handleSubscriptionSuccess}
                  onError={handleSubscriptionError}
                  onCancel={handleSubscriptionCancel}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Payment History */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#E8E0D5] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8E0D5]">
            <h2 className="text-lg font-semibold text-[#1C1C1C]">Payment History</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9C8E80" strokeWidth="1.5">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <p className="text-[#6B5B4F]">No payment history yet</p>
              <p className="text-sm text-[#9C8E80]">Your transactions will appear here</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default function BillingPage() {
  return (
    <PayPalScriptProvider options={paypalOptions}>
      <BillingContent />
    </PayPalScriptProvider>
  );
}

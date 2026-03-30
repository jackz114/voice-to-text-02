"use client";

import { useState } from "react";
import { PayPalSubscriptionButtonDirect } from "@/components/payment/PayPalButton";

export default function PaymentPage() {
  const [subscriptionResult, setSubscriptionResult] = useState<Record<string, unknown> | null>(
    null
  );
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
    console.log("Subscription cancelled");
    setError("Subscription cancelled");
  };

  return (
      <div className="min-h-screen bg-[#FAF7F2]">
        {/* Header */}
        <header className="bg-white border-b border-[#E8E0D5]">
          <div className="mx-auto max-w-3xl px-6 py-6">
            <h1 className="text-2xl font-bold text-[#1C1C1C]">Pricing</h1>
            <p className="mt-1 text-[#6B5B4F]">
              Choose the plan that works for you
            </p>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-3xl px-6 py-8">
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

        </main>
      </div>
  );
}

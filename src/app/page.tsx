"use client";

import Image from "next/image";
import { UserNav } from "@/components/auth/UserNav";
import { SearchTrigger } from "@/components/search";
import { SearchModal } from "@/components/search";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {/* 导航栏 */}
      <nav className="w-full max-w-3xl flex items-center justify-between px-6 py-4">
        <div className="text-xl font-bold text-gray-900 dark:text-white">
          Voice to Text
        </div>
        <div className="flex items-center gap-2">
          <SearchTrigger variant="icon" />
          <UserNav />
        </div>
      </nav>

      <SearchModal />

      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            AI 驱动的语音转文本服务
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            支持 Google 一键登录，PayPal 安全支付。快速、准确地将语音转换为文本。
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-white transition-colors hover:bg-blue-700 md:w-[158px]"
            href="/login"
          >
            开始使用
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="/payment"
          >
            查看价格
          </a>
        </div>

        {/* 功能特性 */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          <FeatureCard
            icon="🔐"
            title="Google 登录"
            description="一键使用 Google 账号登录，无需注册"
          />
          <FeatureCard
            icon="💳"
            title="PayPal 支付"
            description="支持一次性购买和月度订阅"
          />
          <FeatureCard
            icon="🎤"
            title="语音转录"
            description="高精度 AI 语音识别，支持多语言"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-900">
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

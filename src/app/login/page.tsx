import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign in - VoiceNote",
  description: "Sign in to your VoiceNote account",
};

interface LoginPageProps {
  searchParams: Promise<{ redirect_to?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirect_to || "/";

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="VoiceNote" width={32} height={32} className="object-contain" />
            <span className="text-xl font-bold text-[#1C1C1C]">VoiceNote</span>
          </div>
        </div>

        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}

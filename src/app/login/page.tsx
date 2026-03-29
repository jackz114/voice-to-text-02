import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";

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
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="8" fill="#2563EB" />
              <path
                d="M8 18V14M12 18V10M16 18V12M20 18V16"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xl font-bold text-white">VoiceNote</span>
          </div>
        </div>

        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}

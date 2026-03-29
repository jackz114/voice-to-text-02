import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign up - Revnote",
  description: "Create your Revnote account",
};

interface RegisterPageProps {
  searchParams: Promise<{ redirect_to?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirect_to || "/";

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Revnote" width={32} height={32} className="object-contain" />
            <span className="text-xl font-bold text-[#1C1C1C]">Revnote</span>
          </div>
        </div>

        <LoginForm redirectTo={redirectTo} defaultMode="register" />
      </div>
    </div>
  );
}

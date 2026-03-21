import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录 - Voice to Text",
  description: "登录您的账号以使用语音转文本服务",
};

interface LoginPageProps {
  searchParams: Promise<{ redirect_to?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirect_to || "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}

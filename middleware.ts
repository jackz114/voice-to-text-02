import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 如果是 OAuth 回调路由，在 middleware 层处理 code 交换
  if (request.nextUrl.pathname === "/auth/callback") {
    const url = request.nextUrl;

    // 从 URL 提取 code 和 state 参数
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const redirectTo = url.searchParams.get("redirect_to") || "/";

    if (code) {
      // 用 URL search string（包含 code 和 state）交换 session
      const { error } = await supabase.auth.exchangeCodeForSession(
        url.search
      );

      if (error) {
        console.error("Middleware OAuth callback error:", error);
        return NextResponse.redirect(
          new URL(`/login?error=auth_failed`, url.origin)
        );
      }

      // 交换成功后重定向到目标页面
      return NextResponse.redirect(new URL(redirectTo, url.origin));
    }
  }

  // 普通路由：刷新 session
  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

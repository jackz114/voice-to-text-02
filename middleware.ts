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
    const code = url.searchParams.get("code");
    const errorParam = url.searchParams.get("error");
    const redirectTo = url.searchParams.get("redirect_to") || "/";

    console.log("[Auth Callback] code:", code ? "present" : "missing");
    console.log("[Auth Callback] error:", errorParam);

    if (code) {
      // 优先处理 code exchange
      const { error } = await supabase.auth.exchangeCodeForSession(url.search);

      if (error) {
        console.error("[Auth Callback] exchangeCodeForSession error:", error.message);
        return NextResponse.redirect(
          new URL(`/login?error=auth_failed`, url.origin)
        );
      }

      // 交换成功后重定向
      return NextResponse.redirect(new URL(redirectTo, url.origin));
    }

    if (errorParam) {
      // 没有 code 但有 error，直接跳转到 login
      console.log("[Auth Callback] no code, has error:", errorParam);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorParam)}`, url.origin)
      );
    }

    // 既没有 code 也没有 error，继续渲染页面（loading 状态）
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

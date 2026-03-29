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

    // Debug: 记录收到的 cookies（不含敏感值）
    const cookieNames = request.cookies.getAll().map(c => c.name);
    console.log("[Auth Callback] pathname:", url.pathname);
    console.log("[Auth Callback] code:", code ? "present" : "missing");
    console.log("[Auth Callback] error:", errorParam);
    console.log("[Auth Callback] redirectTo:", redirectTo);
    console.log("[Auth Callback] cookie names:", cookieNames);

    // 如果 URL 已有 error 参数，说明之前处理已失败，直接 redirect
    if (errorParam) {
      console.log("[Auth Callback] URL has error, redirecting to login");
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorParam)}`, url.origin)
      );
    }

    if (code) {
      // 用 URL search string（包含 code 和 state）交换 session
      const { error } = await supabase.auth.exchangeCodeForSession(url.search);

      if (error) {
        console.error("[Auth Callback] exchangeCodeForSession error:", error.message);
        return NextResponse.redirect(
          new URL(`/login?error=auth_failed`, url.origin)
        );
      }

      // 交换成功后重定向到目标页面
      return NextResponse.redirect(new URL(redirectTo, url.origin));
    }

    // 既没有 code 也没有 error，停留在此页面（正常应该是 loading）
    console.log("[Auth Callback] no code, no error, rendering page");
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

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export default withAuth(
  function middleware(req) {
    // /admin/loginは常に許可（ログインページのため）
    if (req.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }

    // 管理者ページは管理者のみアクセス可能
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (req.nextauth.token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url))
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {

        // /admin/loginは常に許可（ログインページのため）
        if (req.nextUrl.pathname === "/admin/login") {
          return true;
        }
        // その他の/admin/*は管理者トークンが必要
        if (req.nextUrl.pathname.startsWith("/admin")) {
          const isAuthorized = !!token && token.role === "admin";
          return isAuthorized;
        }
        // その他のパス（/checkout, /cart）もトークンが必要
        return !!token;
      }
    },
    pages: {
      signIn: '/admin/login',
    }
  },
);

export const config = {
  matcher: ["/admin/:path*", "/checkout", "/cart"],
};


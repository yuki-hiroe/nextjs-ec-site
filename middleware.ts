import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

const withAuthMiddleware = withAuth(
  function middleware(req) {
    // /admin/loginは常に許可（ログインページのため）
    if (req.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }

    // 管理者ページは管理者のみアクセス可能
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (req.nextauth.token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === "/admin/login") return true;
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return !!token && token.role === "admin";
        }
        return !!token;
      }
    },
    pages: {
      signIn: "/login",
    },
  }
);

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent
) {
  const pathname = req.nextUrl.pathname;

  // スタイリストログイン・申請ページは常に許可（未ログインでもアクセス可）
  if (pathname === "/stylist/login" || pathname === "/stylist/apply") {
    return NextResponse.next();
  }

  // スタイリストダッシュボードはスタイリストロールのみ
  if (pathname.startsWith("/stylist")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (token?.role === "stylist") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/stylist/login", req.url));
  }

  return withAuthMiddleware(req as Parameters<typeof withAuthMiddleware>[0], event);
}

export const config = {
  matcher: ["/admin/:path*", "/checkout", "/cart", "/stylist", "/stylist/:path*"],
};


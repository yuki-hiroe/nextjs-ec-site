import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // 管理者ページは管理者のみアクセス可能
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (req.nextauth.token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url))
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/checkout", "/cart"],
};


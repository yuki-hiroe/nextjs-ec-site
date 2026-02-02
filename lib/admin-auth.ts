import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuthセッションから管理者情報を取得して検証
 * 新しい実装：NextAuthのセッションを使用
 */
export async function verifyAdmin(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return {
        error: NextResponse.json(
          { error: "認証が必要です。ログインしてください。" },
          { status: 401 }
        ),
        admin: null,
      };
    }

    if (session.user.role !== "admin") {
      return {
        error: NextResponse.json(
          { error: "管理者権限が必要です" },
          { status: 403 }
        ),
        admin: null,
      };
    }

    return {
      error: null,
      admin: {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.name || "",
        role: session.user.role,
      },
    };
  } catch (error) {
    console.error("管理者認証エラー:", error);
    return {
      error: NextResponse.json(
        { error: "認証エラーが発生しました" },
        { status: 500 }
      ),
      admin: null,
    };
  }
}

/**
 * NextAuthセッションから管理者情報を取得して検証（isAdminAuthenticatedの代替）
 * 後方互換性のため、同じインターフェースを維持
 */
export async function isAdminAuthenticated(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return {
        authenticated: false,
        response: NextResponse.json({ error: "認証情報がありません" }, { status: 401 }),
      };
    }

    if (session.user.role !== "admin") {
      return {
        authenticated: false,
        response: NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 }),
      };
    }

    return {
      authenticated: true,
      admin: {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.name || "",
        role: session.user.role,
      },
    };
  } catch (error) {
    console.error("Admin authentication parsing error:", error);
    return {
      authenticated: false,
      response: NextResponse.json({ error: "認証情報の解析に失敗しました" }, { status: 401 }),
    };
  }
}


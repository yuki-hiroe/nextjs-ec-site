import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * リクエストから管理者情報を取得して検証
 * 既存の実装に合わせて、リクエストボディからadminIdを取得
 */
export async function verifyAdmin(request: Request) {
  try {
    // リクエストボディからadminIdを取得
    const body = await request.clone().json().catch(() => ({}));
    const adminId = body.adminId;

    if (!adminId) {
      return {
        error: NextResponse.json(
          { error: "認証が必要です。管理者IDを指定してください。" },
          { status: 401 }
        ),
        admin: null,
      };
    }

    // 管理者ユーザーを取得
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!admin || admin.role !== "admin") {
      return {
        error: NextResponse.json(
          { error: "管理者権限が必要です" },
          { status: 403 }
        ),
        admin: null,
      };
    }

    return { error: null, admin };
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
 * x-admin-dataヘッダーから管理者情報を取得して検証
 * base64エンコードされたデータもサポート
 */
export async function isAdminAuthenticated(request: Request) {
  try {
    const adminDataHeader = request.headers.get("x-admin-data");

    if (!adminDataHeader) {
      return {
        authenticated: false,
        response: NextResponse.json({ error: "認証情報がありません" }, { status: 401 }),
      };
    }

    let adminData;
    try {
      // base64エンコードされている場合を試す（サーバーサイドではBufferを使用）
      try {
        const decoded = Buffer.from(adminDataHeader, "base64").toString("utf-8");
        adminData = JSON.parse(decoded);
      } catch {
        // base64でない場合は直接JSONとしてパース
        adminData = JSON.parse(adminDataHeader);
      }
    } catch {
      return {
        authenticated: false,
        response: NextResponse.json({ error: "無効な認証情報です" }, { status: 401 }),
      };
    }

    if (adminData && adminData.id && adminData.email) {
      return { authenticated: true, admin: adminData };
    }

    return {
      authenticated: false,
      response: NextResponse.json({ error: "無効な認証情報です" }, { status: 401 }),
    };
  } catch (error) {
    console.error("Admin authentication parsing error:", error);
    return {
      authenticated: false,
      response: NextResponse.json({ error: "認証情報の解析に失敗しました" }, { status: 401 }),
    };
  }
}


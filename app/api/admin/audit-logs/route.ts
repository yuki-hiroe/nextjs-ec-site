import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";

// 監査ログ一覧を取得
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    
    // ホワイトリスト検証
    const ALLOWED_ACTIONS = ['delete', 'suspend', 'activate', 'update'];
    const ALLOWED_TARGET_TYPES = ['user', 'order', 'product', 'stylist'];
    
    const action = searchParams.get("action");
    const targetType = searchParams.get("targetType");
    const targetEmail = searchParams.get("targetEmail");
    const performedByEmail = searchParams.get("performedByEmail");
    
    // limit と offset の検証（1-1000の範囲、負の値は0に）
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100") || 100, 1), 1000);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0") || 0, 0);
    
    // メールアドレスの検証（形式と長さ）
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (targetEmail) {
      const trimmedEmail = targetEmail.trim();
      if (trimmedEmail.length > 255 || !emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { error: "無効なメールアドレス形式です" },
          { status: 400 }
        );
      }
    }
    if (performedByEmail) {
      const trimmedEmail = performedByEmail.trim();
      if (trimmedEmail.length > 255 || !emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { error: "無効なメールアドレス形式です" },
          { status: 400 }
        );
      }
    }

    const where: any = {};

    // ホワイトリストに基づく検証
    if (action && ALLOWED_ACTIONS.includes(action)) {
      where.action = action;
    } else if (action) {
      return NextResponse.json(
        { error: "無効な操作種別です" },
        { status: 400 }
      );
    }
    
    if (targetType && ALLOWED_TARGET_TYPES.includes(targetType)) {
      where.targetType = targetType;
    } else if (targetType) {
      return NextResponse.json(
        { error: "無効な対象タイプです" },
        { status: 400 }
      );
    }
    
    if (targetEmail) {
      where.targetEmail = { contains: targetEmail.trim(), mode: "insensitive" };
    }
    if (performedByEmail) {
      where.performedByEmail = { contains: performedByEmail.trim(), mode: "insensitive" };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    // 本番環境では詳細なエラーをログに記録しない
    if (process.env.NODE_ENV === 'development') {
      console.error("監査ログ取得エラー:", error);
    } else {
      console.error("監査ログ取得エラー");
    }
    return NextResponse.json(
      { error: "監査ログの取得に失敗しました" },
      { status: 500 }
    );
  }
}


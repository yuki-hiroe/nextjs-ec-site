import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";

// 監査ログ一覧を取得
export async function POST(request: Request) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const targetType = searchParams.get("targetType");
    const targetEmail = searchParams.get("targetEmail");
    const performedByEmail = searchParams.get("performedByEmail");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {};

    if (action) {
      where.action = action;
    }
    if (targetType) {
      where.targetType = targetType;
    }
    if (targetEmail) {
      where.targetEmail = { contains: targetEmail, mode: "insensitive" };
    }
    if (performedByEmail) {
      where.performedByEmail = { contains: performedByEmail, mode: "insensitive" };
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
    console.error("監査ログ取得エラー:", error);
    return NextResponse.json(
      { error: "監査ログの取得に失敗しました" },
      { status: 500 }
    );
  }
}


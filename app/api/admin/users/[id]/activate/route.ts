import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";
import { createAuditLog, getRequestInfo } from "@/lib/audit-log";

// ユーザーを有効化（一時停止を解除）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // 操作理由は必須
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "有効化理由を入力してください" },
        { status: 400 }
      );
    }

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isSuspended: true,
        suspendedReason: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    if (!user.isSuspended) {
      return NextResponse.json(
        { error: "このユーザーは一時停止されていません" },
        { status: 400 }
      );
    }

    // ユーザーを有効化
    const activatedUser = await prisma.user.update({
      where: { id },
      data: {
        isSuspended: false,
        suspendedAt: null,
        suspendedReason: null,
      },
    });

    // 監査ログを記録
    const { ipAddress, userAgent } = getRequestInfo(request) || { ipAddress: undefined, userAgent: undefined };
    await createAuditLog({
      action: "activate",
      targetType: "user",
      targetId: id,
      targetEmail: user.email,
      reason: reason.trim(),
      details: {
        activatedUser: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        previousSuspensionReason: user.suspendedReason,
      },
      performedBy: admin.id,
      performedByEmail: admin.email,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });

    return NextResponse.json({
      message: "ユーザーを有効化しました",
      user: activatedUser,
      warning: "ユーザーにセキュリティ警告を送信することを推奨します。",
    });
  } catch (error: any) {
    console.error("ユーザー有効化エラー:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "ユーザーの有効化に失敗しました" },
      { status: 500 }
    );
  }
}


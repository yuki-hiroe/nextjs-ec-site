import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";
import { createAuditLog, getRequestInfo } from "@/lib/audit-log";

// ユーザーを一時停止
export async function POST(
  request: Request,
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
        { error: "一時停止理由を入力してください" },
        { status: 400 }
      );
    }

    // 自分自身を一時停止できないようにする
    if (id === admin.id) {
      return NextResponse.json(
        { error: "自分自身のアカウントを一時停止することはできません" },
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
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: "このユーザーは既に一時停止されています" },
        { status: 400 }
      );
    }

    // ユーザーを一時停止
    const suspendedUser = await prisma.user.update({
      where: { id },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendedReason: reason.trim(),
      },
    });

    // 監査ログを記録
    const { ipAddress, userAgent } = getRequestInfo(request) || { ipAddress: undefined, userAgent: undefined };
    await createAuditLog({
      action: "suspend",
      targetType: "user",
      targetId: id,
      targetEmail: user.email,
      reason: reason.trim(),
      details: {
        suspendedUser: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      performedBy: admin.id,
      performedByEmail: admin.email,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });

    return NextResponse.json({
      message: "ユーザーを一時停止しました",
      user: suspendedUser,
    });
  } catch (error: any) {
    console.error("ユーザー一時停止エラー:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "ユーザーの一時停止に失敗しました" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";
import { createAuditLog, getRequestInfo } from "@/lib/audit-log";

// 管理者用：注文ステータスを更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { orderNumber } = await params;
    const body = await request.json();
    const { status, reason } = body;

    if (!status) {
      return NextResponse.json(
        { error: "ステータスを指定してください" },
        { status: 400 }
      );
    }

    // 操作理由は必須
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "操作理由を入力してください" },
        { status: 400 }
      );
    }

    // 現在の注文情報を取得（変更前の値を記録するため）
    const currentOrder = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        email: true,
      },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: "注文が見つかりません" },
        { status: 404 }
      );
    }

    // 注文ステータスを更新
    const updatedOrder = await prisma.order.update({
      where: { orderNumber },
      data: { status },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                slug: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 監査ログを記録
    const { ipAddress, userAgent } = getRequestInfo(request) || { ipAddress: undefined, userAgent: undefined };
    await createAuditLog({
      action: "update",
      targetType: "order",
      targetId: currentOrder.id,
      targetEmail: currentOrder.email,
      reason: reason.trim(),
      details: {
        before: {
          status: currentOrder.status,
        },
        after: {
          status: updatedOrder.status,
        },
        orderNumber: currentOrder.orderNumber,
      },
      performedBy: admin.id,
      performedByEmail: admin.email,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });

    return NextResponse.json({
      message: "注文ステータスを更新しました",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("注文更新エラー:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "注文が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "注文ステータスの更新に失敗しました" },
      { status: 500 }
    );
  }
}


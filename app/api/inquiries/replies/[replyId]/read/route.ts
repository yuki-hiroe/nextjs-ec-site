import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// 返信を既読にする
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証されていません" },
        { status: 401 }
      );
    }
    if (
      session?.user?.role !== "admin" &&
      session?.user?.role !== "stylist" &&
      session?.user?.role !== "user"
    ) {
      return NextResponse.json(
        { error: "権限がありません" },
        { status: 403 }
      );
    }

    const { replyId } = await params;

    const existingReply = await prisma.inquiryReply.findUnique({
      where: { id: replyId },
      include: {
        inquiry: {
          select: {
            id: true,
            userId: true,
            email: true,
            stylistId: true,
          },
        },
      },
    });

    if (!existingReply) {
      return NextResponse.json(
        { error: "返信が見つかりません" },
        { status: 404 }
      );
    }

    // 既読操作の権限をチェック
    if (session.user.role === "user") {
      const canRead =
        existingReply.inquiry.userId === session.user.id ||
        (session.user.email && existingReply.inquiry.email === session.user.email);
      if (!canRead) {
        return NextResponse.json(
          { error: "この返信を既読にする権限がありません" },
          { status: 403 }
        );
      }
    }

    if (session.user.role === "stylist") {
      if (existingReply.inquiry.stylistId !== session.user.id) {
        return NextResponse.json(
          { error: "この返信を既読にする権限がありません" },
          { status: 403 }
        );
      }
    }

    const reply = await prisma.inquiryReply.update({
      where: { id: replyId },
      data: { isRead: true },
    });

    return NextResponse.json({
      message: "返信を既読にしました",
      reply,
    });
  } catch (error: any) {
    console.error("返信既読更新エラー:", error);

    return NextResponse.json(
      { error: "返信の既読更新に失敗しました" },
      { status: 500 }
    );
  }
}


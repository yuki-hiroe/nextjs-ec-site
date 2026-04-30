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
    if (session?.user?.role !== "admin" && session?.user?.role !== "stylist") {
      return NextResponse.json(
        { error: "権限がありません" },
        { status: 403 }
      );
    }

    const { replyId } = await params;

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
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "返信が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "返信の既読更新に失敗しました" },
      { status: 500 }
    );
  }
}


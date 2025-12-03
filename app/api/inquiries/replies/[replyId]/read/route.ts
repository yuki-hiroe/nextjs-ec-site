import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 返信を既読にする
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
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


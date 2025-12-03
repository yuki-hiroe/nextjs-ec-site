import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 未読返信の件数を取得
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスが必要です" },
        { status: 400 }
      );
    }

    // ユーザーのお問い合わせを取得
    const inquiries = await prisma.inquiry.findMany({
      where: { email },
      select: {
        id: true,
        replies: {
          where: {
            fromType: "stylist",
            isRead: false,
          },
          select: {
            id: true,
          },
        },
      },
    });

    // 未読返信の総件数を計算
    const unreadCount = inquiries.reduce(
      (count, inquiry) => count + inquiry.replies.length,
      0
    );

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("未読返信件数取得エラー:", error);
    return NextResponse.json(
      { error: "未読返信件数の取得に失敗しました" },
      { status: 500 }
    );
  }
}


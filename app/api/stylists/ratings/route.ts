import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { stylistId, rating, comment, inquiryId } = body;

    // バリデーション
    if (!stylistId) {
      return NextResponse.json(
        { error: "スタイリストIDが必要です" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "評価は1〜5の間で指定してください" },
        { status: 400 }
      );
    }

    // スタイリストの存在確認
    const stylist = await prisma.stylist.findUnique({
      where: { id: stylistId },
    });

    if (!stylist) {
      return NextResponse.json(
        { error: "スタイリストが見つかりません" },
        { status: 404 }
      );
    }

    // 既存の評価を確認
    const existingRating = await prisma.stylistRating.findUnique({
      where: {
        stylistId_userId: {
          stylistId,
          userId: session.user.id,
        },
      },
    });

    if (existingRating) {
      // 既存の評価を更新
      const updatedRating = await prisma.stylistRating.update({
        where: {
          stylistId_userId: {
            stylistId,
            userId: session.user.id,
          },
        },
        data: {
          rating,
          comment: comment || null,
          inquiryId: inquiryId || null,
        },
      });

      return NextResponse.json({
        message: "評価を更新しました",
        rating: updatedRating,
      });
    }

    // 新しい評価を作成
    const newRating = await prisma.stylistRating.create({
      data: {
        stylistId,
        userId: session.user.id,
        rating,
        comment: comment || null,
        inquiryId: inquiryId || null,
      },
    });

    return NextResponse.json({
      message: "評価を投稿しました",
      rating: newRating,
    });
  } catch (error: any) {
    console.error("評価投稿エラー:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "既に評価済みです" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "評価の投稿に失敗しました" },
      { status: 500 }
    );
  }
}


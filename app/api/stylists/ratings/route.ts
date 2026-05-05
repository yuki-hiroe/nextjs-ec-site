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

    if (!inquiryId) {
      return NextResponse.json(
        { error: "問い合わせIDが必要です" },
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

    // 問い合わせの所有者と対象スタイリストを検証
    const inquiry = await prisma.inquiry.findFirst({
      where: {
        id: inquiryId,
        userId: session.user.id,
        stylistId,
      },
      select: { id: true },
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: "この問い合わせに対する評価は投稿できません" },
        { status: 403 }
      );
    }

    // 同一問い合わせに対しては1回のみ評価可能
    const ratingResult = await prisma.stylistRating.create({
      data: {
        stylistId,
        userId: session.user.id,
        rating,
        comment: comment || null,
        inquiryId,
      },
    });

      return NextResponse.json({
        message: "評価を保存しました",
        rating: ratingResult,
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


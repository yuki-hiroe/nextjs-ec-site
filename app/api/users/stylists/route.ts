import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    // ユーザーが相談したスタイリストを取得
    const inquiries = await prisma.inquiry.findMany({
      where: {
        userId: session.user.id,
        stylistId: { not: null },
        inquiryType: "styling",
      },
      include: {
        stylist: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            image: true,
            bio: true,
            specialties: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // スタイリストIDで重複を除去
    const uniqueStylistIds = new Set<string>();
    const uniqueStylists: any[] = [];

    for (const inquiry of inquiries) {
      if (inquiry.stylist && !uniqueStylistIds.has(inquiry.stylist.id)) {
        uniqueStylistIds.add(inquiry.stylist.id);
        uniqueStylists.push(inquiry.stylist);
      }
    }

    // 各スタイリストの評価情報を取得
    const stylistIds = uniqueStylists.map((s) => s.id);
    let ratingMap = new Map<string, { averageRating: number | null; ratingCount: number }>();

    if (stylistIds.length > 0) {
      const grouped = await prisma.stylistRating.groupBy({
        by: ['stylistId'], // stylistIdでグループ化
        _avg: { rating: true }, // 平均評価を計算
        _count: { id: true }, // 件数を計算
        where: { stylistId: { in: stylistIds } }, // 対象スタイリストのみ
      });

      for (const { stylistId, _avg, _count } of grouped) {
        ratingMap.set(stylistId, {
          averageRating: _avg.rating || 0,
          ratingCount: _count.id || 0,
        });
      }
    }

    return NextResponse.json(
      uniqueStylists.map((stylist) => {
        const stats = ratingMap.get(stylist.id) ?? { averageRating: 0, ratingCount: 0 };
        return {
          ...stylist, // stylistの全フィールドを展開
          // specialtiesだけ上書き（stylistのspecialtiesを置き換える）
          specialties: Array.isArray(stylist.specialties)
            ? stylist.specialties
            : typeof stylist.specialties === "string"
            ? JSON.parse(stylist.specialties)
            : [],
          ...stats, // averageRatingとratingCountを追加
        };
      })
    );

  } catch (error) {
    console.error("スタイリスト取得エラー:", error);
    return NextResponse.json(
      { error: "スタイリストの取得に失敗しました" },
      { status: 500 }
    );
  }
}


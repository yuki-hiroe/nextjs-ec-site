import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    const stylists = await prisma.stylist.findMany({
      where: all
        ? undefined
        : {
            isActive: true,
          },
      orderBy: {
        createdAt: "asc",
      },
    });

    // 各スタイリストの評価データを取得
    const stylistsWithRatings = await Promise.all(
      stylists.map(async (stylist) => {
        let averageRating: number | null = null;
        let ratingCount = 0;

        // 評価データを取得
        if (prisma.stylistRating) {
          try {
            const avgRating = await prisma.stylistRating.aggregate({
              where: { stylistId: stylist.id },
              _avg: { rating: true },
              _count: { id: true },
            });
            ratingCount = avgRating._count.id || 0;
            // 評価件数が0より大きい場合のみ平均評価を設定
            if (ratingCount > 0 && avgRating._avg.rating !== null) {
              averageRating = avgRating._avg.rating;
            }
          } catch (error) {
            console.error(`スタイリスト ${stylist.id} の評価データ取得エラー:`, error);
          }
        }

        return {
          ...stylist,
          specialties: Array.isArray(stylist.specialties)
            ? stylist.specialties
            : typeof stylist.specialties === "string"
            ? JSON.parse(stylist.specialties)
            : [],
          averageRating,
          ratingCount,
        };
      })
    );

    return NextResponse.json(stylistsWithRatings);
  } catch (error) {
    console.error("スタイリスト取得エラー:", error);
    return NextResponse.json(
      { error: "スタイリストの取得に失敗しました" },
      { status: 500 }
    );
  }
}


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
    // const stylistsWithRatings = await Promise.all(
    //   stylists.map(async (stylist) => {
    //     let averageRating: number | null = null;
    //     let ratingCount = 0;

    //     // 評価データを取得
    //     if (prisma.stylistRating) {
    //       try {
    //         const avgRating = await prisma.stylistRating.aggregate({
    //           where: { stylistId: stylist.id },
    //           _avg: { rating: true },
    //           _count: { id: true },
    //         });
    //         ratingCount = avgRating._count.id || 0;
    //         // 評価件数が0より大きい場合のみ平均評価を設定
    //         if (ratingCount > 0 && avgRating._avg.rating !== null) {
    //           averageRating = avgRating._avg.rating;
    //         }
    //       } catch (error) {
    //         console.error(`スタイリスト ${stylist.id} の評価データ取得エラー:`, error);
    //       }
    //     }

    //     return {
    //       ...stylist,
    //       specialties: Array.isArray(stylist.specialties)
    //         ? stylist.specialties
    //         : typeof stylist.specialties === "string"
    //         ? JSON.parse(stylist.specialties)
    //         : [],
    //       averageRating,
    //       ratingCount,
    //     };
    //   })
    // );
    const stylistIds = stylists.map((s) => s.id);
    let ratingMap = new Map<string, { averageRating: number | null; ratingCount: number }>();

    if (stylistIds.length > 0) {
      const grouped = await prisma.stylistRating.groupBy({
        by: ["stylistId"],
        where: { stylistId: { in: stylistIds } },
        _avg: { rating: true },
        _count: { id: true },
      });

      for (const g of grouped) {
        ratingMap.set(g.stylistId, {
          averageRating: g._avg?.rating ?? null,
          ratingCount: g._count?.id ?? 0,
        });
      }
    }

    const stylistsWithRatings = stylists.map((stylist) => {
      const stats = ratingMap.get(stylist.id) ?? { averageRating: null, ratingCount: 0 };
      return { ...stylist, ...stats };
    });
    
    return NextResponse.json(stylistsWithRatings);
  } catch (error) {
    console.error("スタイリスト取得エラー:", error);
    return NextResponse.json(
      { error: "スタイリストの取得に失敗しました" },
      { status: 500 }
    );
  }
}


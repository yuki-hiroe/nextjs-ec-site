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
    const stylistsWithRatings = await Promise.all(
      uniqueStylists.map(async (stylist) => {
        const avgRating = await prisma.stylistRating.aggregate({
          where: { stylistId: stylist.id },
          _avg: { rating: true },
          _count: { id: true },
        });

        const specialties = Array.isArray(stylist.specialties)
          ? stylist.specialties
          : typeof stylist.specialties === "string"
          ? JSON.parse(stylist.specialties)
          : [];

        return {
          ...stylist,
          specialties,
          averageRating: avgRating._avg.rating || 0,
          ratingCount: avgRating._count.id || 0,
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


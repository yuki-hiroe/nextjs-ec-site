import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
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

    // specialtiesを確実に配列として返す
    const formattedStylists = stylists.map((stylist) => ({
      ...stylist,
      specialties: Array.isArray(stylist.specialties)
        ? stylist.specialties
        : typeof stylist.specialties === "string"
        ? JSON.parse(stylist.specialties)
        : [],
    }));

    return NextResponse.json(formattedStylists);
  } catch (error) {
    console.error("スタイリスト取得エラー:", error);
    return NextResponse.json(
      { error: "スタイリストの取得に失敗しました" },
      { status: 500 }
    );
  }
}


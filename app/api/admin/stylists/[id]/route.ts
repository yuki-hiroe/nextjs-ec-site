import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isActive } = await request.json();

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActiveはboolean型である必要があります" },
        { status: 400 }
      );
    }

    const stylist = await prisma.stylist.update({
      where: { id },
      data: { isActive },
    });

    // PostgreSQLのJson型は自動的にパースされるため、そのまま返す
    return NextResponse.json({
      message: "スタイリストのステータスを更新しました",
      stylist,
    });
  } catch (error: any) {
    console.error("スタイリスト更新エラー:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "スタイリストが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "スタイリストの更新に失敗しました" },
      { status: 500 }
    );
  }
}


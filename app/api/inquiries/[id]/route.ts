import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証・認可チェック（管理者のみ許可）
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証されていません" },
        { status: 401 }
      );
    }
    if (session?.user?.role !== "admin") {
      return NextResponse.json(
        { error: "権限がありません" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "ステータスを指定してください" },
        { status: 400 }
      );
    }

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error("お問い合わせ更新エラー:", error);
    return NextResponse.json(
      { error: "お問い合わせの更新に失敗しました" },
      { status: 500 }
    );
  }
}


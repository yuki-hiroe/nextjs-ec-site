import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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


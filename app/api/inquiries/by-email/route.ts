import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// メールアドレスでお問い合わせと返信を取得
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスを指定してください" },
        { status: 400 }
      );
    }

    // メールアドレスでお問い合わせを取得
    const inquiries = await prisma.inquiry.findMany({
      where: { email },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
        stylist: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(inquiries);
  } catch (error) {
    console.error("お問い合わせ取得エラー:", error);
    return NextResponse.json(
      { error: "お問い合わせの取得に失敗しました" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, inquiryType, message, userId, stylistId } = body;

    // バリデーション
    if (!name || !email || !inquiryType || !message) {
      return NextResponse.json(
        { error: "すべての必須項目を入力してください" },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        inquiryType,
        message,
        ...(userId && { userId }), // ログイン済みユーザーのID（存在する場合のみ）
        ...(stylistId && { stylistId }), // スタイリストID（選択されている場合のみ）
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error: any) {
    console.error("お問い合わせ作成エラー:", error);
    
    // Prismaエラーの詳細を確認
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "お問い合わせの送信に失敗しました" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const queryStylistId = searchParams.get("stylistId");
    // スタイリストログイン時はセッションのIDのみ使用（クエリは無視）
    const stylistId =
      session?.user?.role === "stylist" ? session.user.id : queryStylistId;

    const inquiries = await prisma.inquiry.findMany({
      where: userId
        ? ({ userId } as any)
        : stylistId
        ? ({ stylistId } as any)
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        stylist: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      } as any,
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


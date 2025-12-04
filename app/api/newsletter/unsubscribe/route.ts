import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // セッションを取得してログインチェック
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Newsletterの登録解除にはログインが必要です" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザー情報が見つかりません" },
        { status: 404 }
      );
    }

    const trimmedEmail = user.email.trim().toLowerCase();

    // Newsletter登録を検索
    const subscription = await prisma.newsletterSubscription.findUnique({
      where: { email: trimmedEmail },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Newsletterに登録されていません" },
        { status: 404 }
      );
    }

    if (!subscription.isActive) {
      return NextResponse.json(
        { error: "既に配信停止されています" },
        { status: 400 }
      );
    }

    // 配信停止（isActiveをfalseに設定）
    await prisma.newsletterSubscription.update({
      where: { email: trimmedEmail },
      data: { 
        isActive: false,
      },
    });

    return NextResponse.json({
      message: "Newsletterの配信を停止しました",
    });
  } catch (error: any) {
    console.error("Newsletter登録解除エラー:", error);

    return NextResponse.json(
      { error: "登録解除に失敗しました。しばらくしてから再度お試しください。" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // セッションを取得してログインチェック
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Newsletterに登録するにはログインが必要です" },
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

    // 既に登録されているかチェック
    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { error: "既にNewsletterに登録済みです" },
          { status: 400 }
        );
      } else {
        // 配信停止されていた場合は再アクティブ化（userIdも更新）
        await prisma.newsletterSubscription.update({
          where: { email: trimmedEmail },
          data: { 
            isActive: true,
            userId: user.id,
          },
        });
        return NextResponse.json({
          message: "Newsletterの購読を再開しました",
        });
      }
    }

    // 新規登録（userIdを関連付け）
    await prisma.newsletterSubscription.create({
      data: {
        email: trimmedEmail,
        userId: user.id,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "Newsletterの購読登録が完了しました",
    });
  } catch (error: any) {
    console.error("Newsletter登録エラー:", error);
    
    // 一意制約違反の場合
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "登録に失敗しました。しばらくしてから再度お試しください。" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    // セッションを取得してログインチェック
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { subscribed: false, isActive: false },
        { status: 200 }
      );
    }

    const userEmail = session.user.email;
    const trimmedEmail = userEmail.trim().toLowerCase();

    // Newsletter登録を検索
    const subscription = await prisma.newsletterSubscription.findUnique({
      where: { email: trimmedEmail },
      select: { isActive: true },
    });

    return NextResponse.json({
      subscribed: !!subscription,
      isActive: subscription?.isActive || false,
    });
  } catch (error: any) {
    console.error("Newsletter状態取得エラー:", error);
    return NextResponse.json(
      { subscribed: false, isActive: false },
      { status: 200 }
    );
  }
}


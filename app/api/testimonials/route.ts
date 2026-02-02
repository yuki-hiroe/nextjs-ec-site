import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 承認済みのお客様の声を取得（公開用）
export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: {
        isApproved: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        comment: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // 最新10件を取得
    });

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("お客様の声取得エラー:", error);
    return NextResponse.json(
      { error: "お客様の声の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// お客様の声を投稿
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role, comment, email } = body;

    // バリデーション
    if (!name || !comment) {
      return NextResponse.json(
        { error: "名前とコメントは必須です" },
        { status: 400 }
      );
    }

    if (comment.length < 10) {
      return NextResponse.json(
        { error: "コメントは10文字以上で入力してください" },
        { status: 400 }
      );
    }

    if (comment.length > 500) {
      return NextResponse.json(
        { error: "コメントは500文字以内で入力してください" },
        { status: 400 }
      );
    }

    // セッションを取得（ログインしている場合はuserIdを関連付け）
    const session = await getServerSession(authOptions);
    let userId: string | undefined = undefined;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      userId = user?.id;
    }

    // お客様の声を作成（承認待ち状態）
    const testimonial = await prisma.testimonial.create({
      data: {
        name: name.trim(),
        role: role ? role.trim() : null,
        comment: comment.trim(),
        email: email ? email.trim() : null,
        userId: userId,
        isApproved: false, // 管理者の承認が必要
      },
    });

    return NextResponse.json(
      {
        message: "お客様の声を投稿しました。管理者の承認後に公開されます。",
        testimonial,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("お客様の声投稿エラー:", error);
    return NextResponse.json(
      { error: "投稿に失敗しました。しばらくしてから再度お試しください。" },
      { status: 500 }
    );
  }
}


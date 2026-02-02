import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, lastName, firstName, phone } = await request.json();

    // バリデーション
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "メールアドレス、パスワード、名前は必須です" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "パスワードは6文字以上である必要があります" },
        { status: 400 }
      );
    }

    // 既存ユーザーの確認
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザーを作成
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        lastName: lastName || null,
        firstName: firstName || null,
        phone: phone || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        firstName: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "ユーザー登録が完了しました", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("ユーザー登録エラー:", error);
    return NextResponse.json(
      { error: "ユーザー登録に失敗しました" },
      { status: 500 }
    );
  }
}


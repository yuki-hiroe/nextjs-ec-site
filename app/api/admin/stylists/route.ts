import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { name, nameEn, bio, specialties, image, email, password, isActive } = await request.json();

    // バリデーション
    if (!name || !email || !bio) {
      return NextResponse.json(
        { error: "名前、メールアドレス、自己紹介は必須です" },
        { status: 400 }
      );
    }

    // メールアドレスの重複チェック
    const existingStylist = await prisma.stylist.findUnique({
      where: { email },
    });

    if (existingStylist) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    // パスワードのハッシュ化（パスワードが提供されている場合）
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 専門分野を配列として保存（PostgreSQLのJson型）
    const specialtiesArray = Array.isArray(specialties)
      ? specialties
      : typeof specialties === "string"
      ? JSON.parse(specialties)
      : [];

    // スタイリストを作成
    const stylist = await prisma.stylist.create({
      data: {
        name,
        nameEn: nameEn || null,
        bio,
        specialties: specialtiesArray,
        image: image || null,
        email,
        password: hashedPassword,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(
      {
        message: "スタイリストを登録しました",
        stylist,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("スタイリスト登録エラー:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "スタイリストの登録に失敗しました" },
      { status: 500 }
    );
  }
}


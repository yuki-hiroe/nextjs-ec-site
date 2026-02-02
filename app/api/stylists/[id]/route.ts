import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stylist = await prisma.stylist.findUnique({
      where: { id },
    });

    if (!stylist) {
      return NextResponse.json(
        { error: "スタイリストが見つかりません" },
        { status: 404 }
      );
    }

    // specialtiesを確実に配列として返す
    const formattedStylist = {
      ...stylist,
      specialties: Array.isArray(stylist.specialties)
        ? stylist.specialties
        : typeof stylist.specialties === "string"
        ? JSON.parse(stylist.specialties)
        : [],
    };

    return NextResponse.json(formattedStylist);
  } catch (error) {
    console.error("スタイリスト取得エラー:", error);
    return NextResponse.json(
      { error: "スタイリストの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "stylist" || session.user.id !== id) {
      return NextResponse.json(
        { error: "認証が必要です。自分のプロフィールのみ編集できます。" },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { name, nameEn, email, bio, specialties, image, password } = body;

    // 更新データを準備
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (nameEn !== undefined) updateData.nameEn = nameEn || null;
    if (email !== undefined) {
      const trimmedEmail = (email || "").trim();
      if (!trimmedEmail) {
        return NextResponse.json(
          { error: "メールアドレスを入力してください" },
          { status: 400 }
        );
      }

      // メールアドレスの重複チェック（自分以外）
      const existingByEmail = await prisma.stylist.findUnique({
        where: { email: trimmedEmail },
      });
      if (existingByEmail && existingByEmail.id !== id) {
        return NextResponse.json(
          { error: "このメールアドレスは既に使用されています" },
          { status: 400 }
        );
      }

      updateData.email = trimmedEmail;
    }
    if (bio !== undefined) updateData.bio = bio;
    if (specialties !== undefined) {
      updateData.specialties = Array.isArray(specialties) ? specialties : [];
    }
    if (image !== undefined) updateData.image = image || null;
    if (password !== undefined && password) {
      // パスワードをハッシュ化
      updateData.password = await bcrypt.hash(password, 10);
    }

    const stylist = await prisma.stylist.update({
      where: { id },
      data: updateData,
    });

    // パスワードを返さないようにする
    const { password: _, ...stylistWithoutPassword } = stylist;

    // specialtiesを確実に配列として返す
    const formattedStylist = {
      ...stylistWithoutPassword,
      specialties: Array.isArray(stylistWithoutPassword.specialties)
        ? stylistWithoutPassword.specialties
        : typeof stylistWithoutPassword.specialties === "string"
        ? JSON.parse(stylistWithoutPassword.specialties)
        : [],
    };

    return NextResponse.json({
      message: "プロフィールを更新しました",
      stylist: formattedStylist,
    });
  } catch (error: any) {
    console.error("スタイリスト更新エラー:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "スタイリストが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "プロフィールの更新に失敗しました" },
      { status: 500 }
    );
  }
}


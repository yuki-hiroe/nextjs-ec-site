import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nameEn, bio, specialties, image, email, password } = body;

    // バリデーション
    if (!name || !bio || !email) {
      return NextResponse.json(
        { error: "名前、自己紹介、メールアドレスは必須です" },
        { status: 400 }
      );
    }

    // PrismaクライアントがStylistApplicationモデルを認識しているかチェック
    if (!prisma.stylistApplication) {
      return NextResponse.json(
        { 
          error: "データベースの設定が完了していません。Prismaクライアントを再生成し、開発サーバーを再起動してください。",
          details: "StylistApplicationモデルが認識されていません"
        },
        { status: 500 }
      );
    }

    // メールアドレスの重複チェック（既存のスタイリスト）
    const existingStylist = await prisma.stylist.findUnique({
      where: { email },
    });

    if (existingStylist) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 }
      );
    }

    // メールアドレスの重複チェック（申請中）
    const existingApplication = await prisma.stylistApplication.findFirst({
      where: {
        email,
        status: "pending",
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "このメールアドレスで既に申請が送信されています。審査をお待ちください。" },
        { status: 400 }
      );
    }

    // パスワードをハッシュ化
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 申請を作成
    const application = await prisma.stylistApplication.create({
      data: {
        name,
        nameEn: nameEn || null,
        bio,
        specialties: Array.isArray(specialties) ? specialties : [],
        image: image || null,
        email,
        password: hashedPassword,
        status: "pending",
      },
    });

    return NextResponse.json({
      message: "スタイリスト登録申請を受け付けました",
      application: {
        id: application.id,
        name: application.name,
        email: application.email,
        status: application.status,
      },
    });
  } catch (error: any) {
    console.error("スタイリスト申請エラー:", error);
    
    // Prismaモデルが認識されていない場合
    if (error.message?.includes("Cannot read properties of undefined") || 
        error.message?.includes("stylistApplication")) {
      return NextResponse.json(
        { 
          error: "データベースの設定が完了していません。",
          details: "Prismaクライアントを再生成し、開発サーバーを再起動してください。また、データベースにStylistApplicationテーブルが作成されているか確認してください。"
        },
        { status: 500 }
      );
    }
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "このメールアドレスは既に使用されています" },
        { status: 400 }
      );
    }

    // テーブルが存在しない場合のエラー
    if (error.code === "P2021" || error.code === "P2025" || error.message?.includes("does not exist")) {
      return NextResponse.json(
        { 
          error: "データベースの設定が完了していません。管理者に連絡してください。",
          details: "StylistApplicationテーブルが存在しません。SupabaseダッシュボードからSQLを実行してテーブルを作成してください。"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: "申請の送信に失敗しました",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // PrismaクライアントがStylistApplicationモデルを認識しているかチェック
    if (!prisma.stylistApplication) {
      return NextResponse.json(
        { 
          error: "データベースの設定が完了していません。",
          details: "Prismaクライアントを再生成し、開発サーバーを再起動してください。また、データベースにStylistApplicationテーブルが作成されているか確認してください。"
        },
        { status: 500 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, notes } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "actionは'approve'または'reject'である必要があります" },
        { status: 400 }
      );
    }

    // 申請を取得
    const application = await prisma.stylistApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: "申請が見つかりません" },
        { status: 404 }
      );
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "この申請は既に処理済みです" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // メールアドレスの重複チェック
      const existingStylist = await prisma.stylist.findUnique({
        where: { email: application.email },
      });

      if (existingStylist) {
        return NextResponse.json(
          { error: "このメールアドレスは既にスタイリストとして登録されています" },
          { status: 400 }
        );
      }

      // スタイリストを作成
      // specialtiesを確実に配列として保存
      const specialtiesArray = Array.isArray(application.specialties)
        ? application.specialties
        : typeof application.specialties === "string"
        ? JSON.parse(application.specialties)
        : [];

      const stylist = await prisma.stylist.create({
        data: {
          name: application.name,
          nameEn: application.nameEn,
          bio: application.bio,
          specialties: specialtiesArray,
          image: application.image,
          email: application.email,
          password: application.password,
          isActive: true,
        },
      });

      // 申請のステータスを更新
      await prisma.stylistApplication.update({
        where: { id },
        data: {
          status: "approved",
          notes: notes || null,
        },
      });

      return NextResponse.json({
        message: "申請を承認し、スタイリストを登録しました",
        stylist: {
          id: stylist.id,
          name: stylist.name,
          email: stylist.email,
        },
      });
    } else {
      // 申請を却下
      await prisma.stylistApplication.update({
        where: { id },
        data: {
          status: "rejected",
          notes: notes || null,
        },
      });

      return NextResponse.json({
        message: "申請を却下しました",
      });
    }
  } catch (error: any) {
    console.error("申請処理エラー:", error);
    
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
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "申請が見つかりません" },
        { status: 404 }
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "このメールアドレスは既に使用されています" },
        { status: 400 }
      );
    }

    // テーブルが存在しない場合のエラー
    if (error.code === "P2021" || error.message?.includes("does not exist")) {
      return NextResponse.json(
        { 
          error: "データベースの設定が完了していません。",
          details: "StylistApplicationテーブルが存在しません。SupabaseダッシュボードからSQLを実行してテーブルを作成してください。"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: "申請の処理に失敗しました",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}


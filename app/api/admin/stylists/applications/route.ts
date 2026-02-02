import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }

    const applications = await prisma.stylistApplication.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(applications);
  } catch (error: any) {
    console.error("申請取得エラー:", error);
    
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

    // テーブルが存在しない場合のエラー
    if (error.code === "P2021" || error.code === "P2025" || error.message?.includes("does not exist")) {
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
        error: "申請の取得に失敗しました",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}


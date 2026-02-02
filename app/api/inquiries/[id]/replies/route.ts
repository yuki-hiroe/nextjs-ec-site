import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 返信一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const replies = await prisma.inquiryReply.findMany({
      where: { inquiryId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(replies);
  } catch (error) {
    console.error("返信取得エラー:", error);
    return NextResponse.json(
      { error: "返信の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 返信を作成（スタイリスト用）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "お問い合わせIDが指定されていません" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "リクエストボディの解析に失敗しました" },
        { status: 400 }
      );
    }

    const { message, fromEmail, fromName, fromType } = body;

    // バリデーション
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "メッセージは必須です" },
        { status: 400 }
      );
    }

    // お問い合わせが存在するか確認
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: "お問い合わせが見つかりません" },
        { status: 404 }
      );
    }

    // 完了済みのお問い合わせには返信できない
    if (inquiry.status === "resolved") {
      return NextResponse.json(
        { error: "完了済みのお問い合わせには返信できません" },
        { status: 400 }
      );
    }

    // 返信を作成
    const reply = await prisma.inquiryReply.create({
      data: {
        inquiryId: id,
        message: message.trim(),
        fromType: fromType || "stylist",
        fromEmail: fromEmail || null,
        fromName: fromName || null,
        isRead: false,
      },
    });

    // お問い合わせのステータスを更新（返信があれば対応中に）
    if (inquiry.status === "new") {
      await prisma.inquiry.update({
        where: { id },
        data: { status: "in_progress" },
      });
    }

    return NextResponse.json({
      message: "返信を送信しました",
      reply,
    });
  } catch (error: any) {
    console.error("返信作成エラー:", error);
    console.error("エラー詳細:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "お問い合わせが見つかりません" },
        { status: 404 }
      );
    }

    if (error.code === "P2021") {
      // テーブルが存在しないエラー
      return NextResponse.json(
        { 
          error: "データベーステーブルが存在しません。InquiryReplyテーブルを作成してください。",
          details: "SupabaseのSQL Editorでcreate_inquiry_reply_table.sqlを実行してください。"
        },
        { status: 500 }
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "重複したデータが存在します" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: "返信の送信に失敗しました",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}


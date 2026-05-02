import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    // 未ログインはここではじく
    if ( !session?.user?.id) {
      return NextResponse.json(
        { error: "認証されていません" },
        { status: 401 }
      );
    }

    const { orderNumber } = await params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                slug: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      } as any,
    });
    // 注文存在チェック
    if (!order) {
      return NextResponse.json(
        { error: "注文が見つかりません" },
        { status: 404 }
      );
    }

    // 権限チェック：管理者とスタイリストは全ての注文にアクセス可能、一般ユーザーは自分の注文のみアクセス可能
    if (session?.user?.role !== "admin" && session?.user?.role !== "stylist" && order.userId !== session?.user?.id) {
      return NextResponse.json(
        { error: "権限がありません" },
        { status: 403 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "注文が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("注文取得エラー:", error);
    return NextResponse.json(
      { error: "注文の取得に失敗しました" },
      { status: 500 }
    );
  }
}


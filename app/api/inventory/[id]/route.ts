import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 在庫取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, stock: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "商品が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: product.id, stock: product.stock });
  } catch (error) {
    console.error("在庫取得エラー:", error);
    return NextResponse.json(
      { error: "在庫の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 在庫更新（注文確定時など）
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { quantity } = await request.json();

    if (typeof quantity !== "number" || quantity <= 0) {
      return NextResponse.json(
        { error: "無効な数量です" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { stock: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "商品が見つかりません" },
        { status: 404 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: "在庫が不足しています", stock: product.stock },
        { status: 400 }
      );
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        stock: {
          decrement: quantity,
        },
      },
      select: { id: true, stock: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("在庫更新エラー:", error);
    return NextResponse.json(
      { error: "在庫の更新に失敗しました" },
      { status: 500 }
    );
  }
}


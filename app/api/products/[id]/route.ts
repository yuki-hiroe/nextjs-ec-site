import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const product = await prisma.product.findUnique({
      where: {
        id: id,
      },
      include: {
        relatedProducts: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                name: true,
                price: true,
                image: true,
                tagline: true,
                badges: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "商品が見つかりません" },
        { status: 404 }
      );
    }

    // PostgreSQLのJson型は自動的にパースされるため、そのまま返す
    return NextResponse.json(product);
  } catch (error) {
    console.error("商品取得エラー:", error);
    return NextResponse.json(
      { error: "商品の取得に失敗しました" },
      { status: 500 }
    );
  }
}


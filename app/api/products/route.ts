import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
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

    // PostgreSQLのJson型は自動的にパースされるため、そのまま返す
    return NextResponse.json(products);
  } catch (error) {
    console.error("商品取得エラー:", error);
    return NextResponse.json(
      { error: "商品の取得に失敗しました" },
      { status: 500 }
    );
  }
}


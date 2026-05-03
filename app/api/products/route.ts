import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証されていません" },
        { status: 401 }
      );
    }

        // ページネーションのパラメータを取得
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "0"), 0);
    const take = 20;
    const skip = page * take;

    // 商品の総件数を取得
    const total = await prisma.product.count();

    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take,
      skip,
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
    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / take),
      hasNext: skip + take < total,
    });
  } catch (error) {
    console.error("商品取得エラー:", error);
    return NextResponse.json(
      { error: "商品の取得に失敗しました" },
      { status: 500 }
    );
  }
}


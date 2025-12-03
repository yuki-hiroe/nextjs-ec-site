import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [products, orders, inquiries, stylists, pendingApplications] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.inquiry.count(),
      prisma.stylist.count({
        where: { isActive: true },
      }),
      // 審査中のスタイリスト申請数
      prisma.stylistApplication
        ? prisma.stylistApplication.count({
            where: { status: "pending" },
          })
        : Promise.resolve(0),
    ]);

    return NextResponse.json({
      products,
      orders,
      inquiries,
      stylists,
      pendingApplications,
    });
  } catch (error) {
    console.error("統計情報取得エラー:", error);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}


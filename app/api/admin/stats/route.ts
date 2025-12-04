import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [products, orders, inquiries, stylists, pendingApplications, pendingTestimonials] = await Promise.all([
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
      // 承認待ちのお客様の声数
      prisma.testimonial.count({
        where: { isApproved: false },
      }),
    ]);

    return NextResponse.json({
      products,
      orders,
      inquiries,
      stylists,
      pendingApplications,
      pendingTestimonials,
    });
  } catch (error) {
    console.error("統計情報取得エラー:", error);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}


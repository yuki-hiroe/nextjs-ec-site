import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // 管理者認証チェック
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "管理者権限が必要です" },
      { status: 403 }
    );
  }
  try {
    const [products, orders, inquiries, stylists, pendingApplications, approvedTestimonials] = await Promise.all([
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
      // 承認済みのお客様の声数
      prisma.testimonial.count({
        where: { isApproved: true },
      }),
    ]);

    return NextResponse.json({
      products,
      orders,
      inquiries,
      stylists,
      pendingApplications,
      approvedTestimonials,
    });
  } catch (error) {
    console.error("統計情報取得エラー:", error);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}


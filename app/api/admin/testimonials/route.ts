import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// 管理者用：すべてのお客様の声を取得（承認待ち含む）
export async function GET(request: Request) {
  const authResult = await isAdminAuthenticated(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "approved", "pending", "all"

    const where: any = {};
    if (status === "approved") {
      where.isApproved = true;
    } else if (status === "pending") {
      where.isApproved = false;
    }

    const testimonials = await prisma.testimonial.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("お客様の声取得エラー:", error);
    return NextResponse.json(
      { error: "お客様の声の取得に失敗しました" },
      { status: 500 }
    );
  }
}


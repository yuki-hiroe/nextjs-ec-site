import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";
import { createAuditLog, getRequestInfo } from "@/lib/audit-log";

// ユーザー一覧を取得
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { searchParams } = new URL(request.url);
    const includeSuspended = searchParams.get("includeSuspended") === "true";
    const search = searchParams.get("search");

    const where: any = {};
    
    if (!includeSuspended) {
      where.isSuspended = false;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        firstName: true,
        phone: true,
        role: true,
        isSuspended: true,
        suspendedAt: true,
        suspendedReason: true,
        createdAt: true,
        updatedAt: true,
        newsletterSubscription: {
          select: {
            id: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            orders: true,
            inquiries: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // ページネーションが必要な場合は追加
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("ユーザー一覧取得エラー:", error);
    return NextResponse.json(
      { error: "ユーザー一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}


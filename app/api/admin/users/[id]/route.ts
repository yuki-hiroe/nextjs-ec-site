import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";
import { createAuditLog, getRequestInfo } from "@/lib/audit-log";

// ユーザー詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        lastName: true,
        firstName: true,
        phone: true,
        role: true,
        image: true,
        isSuspended: true,
        suspendedAt: true,
        suspendedReason: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            inquiries: true,
            accounts: true,
            sessions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("ユーザー詳細取得エラー:", error);
    return NextResponse.json(
      { error: "ユーザー詳細の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// ユーザー情報を更新（属性修正）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { name, lastName, firstName, phone, reason } = body;

    // 操作理由は必須
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "操作理由を入力してください" },
        { status: 400 }
      );
    }

    // 現在のユーザー情報を取得（変更前の値を記録するため）
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        firstName: true,
        phone: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // 更新データを準備
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (phone !== undefined) updateData.phone = phone;

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // 監査ログを記録
    const { ipAddress, userAgent } = getRequestInfo(request) || { ipAddress: undefined, userAgent: undefined };
    await createAuditLog({
      action: "update",
      targetType: "user",
      targetId: id,
      targetEmail: currentUser.email,
      reason: reason.trim(),
      details: {
        before: {
          name: currentUser.name,
          lastName: currentUser.lastName,
          firstName: currentUser.firstName,
          phone: currentUser.phone,
        },
        after: {
          name: updatedUser.name,
          lastName: updatedUser.lastName,
          firstName: updatedUser.firstName,
          phone: updatedUser.phone,
        },
      },
      performedBy: admin.id,
      performedByEmail: admin.email,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });

    return NextResponse.json({
      message: "ユーザー情報を更新しました",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("ユーザー更新エラー:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "ユーザー情報の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// ユーザーを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin(request);
    if (authResult.error) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    // 操作理由は必須
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "削除理由を入力してください" },
        { status: 400 }
      );
    }

    // 自分自身を削除できないようにする
    if (id === admin.id) {
      return NextResponse.json(
        { error: "自分自身のアカウントを削除することはできません" },
        { status: 400 }
      );
    }

    // ユーザー情報を取得（削除前に記録するため）
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // 監査ログを記録（削除前に記録）
    const { ipAddress, userAgent } = getRequestInfo(request) || { ipAddress: undefined, userAgent: undefined };
    await createAuditLog({
      action: "delete",
      targetType: "user",
      targetId: id,
      targetEmail: user.email,
      reason: reason.trim(),
      details: {
        deletedUser: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      performedBy: admin.id,
      performedByEmail: admin.email,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });

    // ユーザーを削除
    // 注意: 関連データの削除方法は要件に応じて変更が必要
    // ここではCASCADE削除を想定（OrderなどはSetNull）
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "ユーザーを削除しました",
    });
  } catch (error: any) {
    console.error("ユーザー削除エラー:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "ユーザーの削除に失敗しました" },
      { status: 500 }
    );
  }
}


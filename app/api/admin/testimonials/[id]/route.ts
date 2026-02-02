import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// お客様の声の承認/非承認
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await isAdminAuthenticated(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { isApproved } = body;

    if (typeof isApproved !== "boolean") {
      return NextResponse.json(
        { error: "isApprovedは必須です" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: { isApproved },
    });

    return NextResponse.json({
      message: isApproved ? "お客様の声を承認しました" : "お客様の声の承認を取り消しました",
      testimonial,
    });
  } catch (error: any) {
    console.error("お客様の声更新エラー:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "お客様の声が見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "更新に失敗しました" },
      { status: 500 }
    );
  }
}

// お客様の声の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await isAdminAuthenticated(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    await prisma.testimonial.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "お客様の声を削除しました",
    });
  } catch (error: any) {
    console.error("お客様の声削除エラー:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "お客様の声が見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "削除に失敗しました" },
      { status: 500 }
    );
  }
}


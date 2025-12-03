import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// 商品を取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await isAdminAuthenticated(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "商品が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("商品取得エラー:", error);
    return NextResponse.json(
      { error: "商品の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 商品を更新
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await isAdminAuthenticated(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      slug,
      name,
      price,
      tagline,
      description,
      image,
      stock,
      shipping,
      care,
      badges,
      features,
      specs,
      images,
    } = body;

    // バリデーション
    if (!slug || !name || !price || !description || !image) {
      return NextResponse.json(
        { error: "必須項目を入力してください" },
        { status: 400 }
      );
    }

    // 既存のslugチェック（自分自身を除く）
    const existing = await prisma.product.findUnique({
      where: { slug },
    });

    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: "このslugは既に使用されています" },
        { status: 400 }
      );
    }

    // 商品を更新
    const product = await prisma.product.update({
      where: { id },
      data: {
        slug: slug.trim(),
        name: name.trim(),
        price: price.trim(),
        tagline: (tagline || "").trim(),
        description: description.trim(),
        image: image.trim(),
        stock: stock || 0,
        shipping: (shipping || "").trim(),
        care: (care || "").trim(),
        badges: Array.isArray(badges) ? badges : [],
        features: Array.isArray(features) ? features : [],
        specs: specs && typeof specs === "object" ? specs : {},
        images: Array.isArray(images) ? images : [],
      },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("商品更新エラー:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "商品が見つかりません" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || "商品の更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await isAdminAuthenticated(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    // 商品を削除
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("商品削除エラー:", error);
    return NextResponse.json(
      { error: "商品の削除に失敗しました" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const authResult = await isAdminAuthenticated(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }
  const products = await prisma.product.findMany();
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const authResult = await isAdminAuthenticated(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }
  try {
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

    // 既存のslugチェック
    const existing = await prisma.product.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "このslugは既に使用されています" },
        { status: 400 }
      );
    }

    // 商品を作成
    const product = await prisma.product.create({
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

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("商品作成エラー:", error);
    return NextResponse.json(
      { error: error.message || "商品の作成に失敗しました" },
      { status: 500 }
    );
  }
}


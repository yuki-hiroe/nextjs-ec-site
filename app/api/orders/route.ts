import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      items,
      shipping,
      payment,
      notes,
      userId,
    } = body;

    // 在庫チェック
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        select: { stock: true, name: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: `商品「${item.name}」が見つかりません` },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `商品「${product.name}」の在庫が不足しています（残り${product.stock}点）` },
          { status: 400 }
        );
      }
    }

    // 注文番号を生成
    const orderNumber = `ORD-${Date.now()}`;

    // 注文を作成
    const order = await prisma.order.create({
      data: {
        orderNumber,
        total: payment.total,
        shippingFee: payment.total >= 15000 ? 0 : 500,
        paymentMethod: payment.method,
        userId: userId || null, // ログイン済みユーザーのID
        lastName: shipping.lastName,
        firstName: shipping.firstName,
        lastNameKana: shipping.lastNameKana,
        firstNameKana: shipping.firstNameKana,
        postalCode: shipping.postalCode,
        prefecture: shipping.prefecture,
        city: shipping.city,
        address: shipping.address,
        building: shipping.building || null,
        phone: shipping.phone,
        email: shipping.email,
        notes: notes || null,
        cardLast4: payment.cardInfo?.last4 || null,
        cardExpiryMonth: payment.cardInfo?.expiryMonth || null,
        cardExpiryYear: payment.cardInfo?.expiryYear || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price, // 文字列形式（"¥28,000"）のまま保存
            name: item.name,
          })),
        },
      } as any,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      } as any,
    });

    // 在庫を減らす
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.id },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return NextResponse.json({ orderId: order.orderNumber, order });
  } catch (error) {
    console.error("注文作成エラー:", error);
    return NextResponse.json(
      { error: "注文の作成に失敗しました" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const orders = await prisma.order.findMany({
      where: userId ? { userId } as any : undefined,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                slug: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      } as any,
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("注文取得エラー:", error);
    return NextResponse.json(
      { error: "注文の取得に失敗しました" },
      { status: 500 }
    );
  }
}


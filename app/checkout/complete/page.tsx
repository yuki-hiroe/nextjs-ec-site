"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function CheckoutCompleteContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      // APIから注文情報を取得
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then((order) => {
          if (order && !order.error) {
            // APIレスポンスをローカルストレージ形式に変換
            setOrderData({
              orderId: order.orderNumber,
              items: order.items.map((item: any) => ({
                id: item.productId,
                name: item.name,
                price: typeof item.price === "number" ? `¥${item.price.toLocaleString()}` : item.price,
                quantity: item.quantity,
              })),
              shipping: {
                lastName: order.lastName,
                firstName: order.firstName,
                lastNameKana: order.lastNameKana,
                firstNameKana: order.firstNameKana,
                postalCode: order.postalCode,
                prefecture: order.prefecture,
                city: order.city,
                address: order.address,
                building: order.building,
                phone: order.phone,
                email: order.email,
              },
              payment: {
                method: order.paymentMethod,
                total: order.total,
              },
            });
          }
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("注文情報の取得エラー:", error);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!orderId || !orderData) {
    return (
      <div className="space-y-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <h2 className="text-xl font-semibold text-slate-900">注文情報が見つかりません</h2>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = orderData
    ? orderData.items.reduce((sum: number, item: any) => {
        // priceは数値として保存されている可能性がある
        const price = typeof item.price === "string" 
          ? parseInt(item.price.replace(/[¥,]/g, ""), 10)
          : item.price;
        return sum + price * item.quantity;
      }, 0)
    : 0;
  const shippingFee = totalPrice >= 15000 ? 0 : 500;
  const finalTotal = totalPrice + shippingFee;

  return (
    <div className="space-y-10">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">注文完了</span>
      </nav>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-8 w-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">注文が確定しました</h1>
          <p className="mt-2 text-slate-600">
            ご注文ありがとうございます。注文確認メールを送信いたしました。
          </p>
          {orderId && (
            <p className="mt-4 text-sm font-medium text-slate-900">
              注文番号: <span className="font-mono">{orderId}</span>
            </p>
          )}
        </div>

        {orderData && (
          <div className="mt-8 space-y-6">
            {/* 注文内容 */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">注文内容</h2>
              <div className="mt-4 space-y-4">
                {orderData.items.map((item: any) => {
                  const price = parseInt(item.price.replace(/[¥,]/g, ""), 10);
                  return (
                    <div key={item.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0">
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.price} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900">
                        ¥{(price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>小計</span>
                  <span>¥{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>送料</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600">無料</span>
                    ) : (
                      `¥${shippingFee.toLocaleString()}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-lg font-semibold text-slate-900">
                  <span>合計</span>
                  <span>¥{finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </section>

            {/* 配送先情報 */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">お届け先</h2>
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>
                  〒{orderData.shipping.postalCode}
                </p>
                <p>
                  {orderData.shipping.prefecture} {orderData.shipping.city}{" "}
                  {orderData.shipping.address}
                  {orderData.shipping.building && ` ${orderData.shipping.building}`}
                </p>
                <p className="mt-2">
                  {orderData.shipping.lastName} {orderData.shipping.firstName} 様
                </p>
                <p className="mt-1">{orderData.shipping.phone}</p>
                <p className="mt-1">{orderData.shipping.email}</p>
              </div>
            </section>

            {/* 支払い方法 */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">お支払い方法</h2>
              <div className="mt-4 text-sm text-slate-600">
                {orderData.payment.method === "credit" && <p>クレジットカード</p>}
                {orderData.payment.method === "bank" && <p>銀行振込</p>}
                {orderData.payment.method === "convenience" && <p>コンビニ決済</p>}
                <p className="mt-2 font-semibold text-slate-900">
                  お支払い金額: ¥{orderData.payment.total.toLocaleString()}
                </p>
              </div>
            </section>

            {/* 次のステップ */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="font-semibold text-slate-900">次のステップ</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {orderData.payment.method === "credit" && (
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>クレジットカード決済が完了しました。商品の準備が整い次第、発送いたします。</span>
                  </li>
                )}
                {orderData.payment.method === "bank" && (
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>
                      銀行振込のご案内をメールでお送りしました。ご入金確認後、商品を発送いたします。
                    </span>
                  </li>
                )}
                {orderData.payment.method === "convenience" && (
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>
                      コンビニ決済のご案内をメールでお送りしました。お支払い完了後、商品を発送いたします。
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>発送完了時に、配送情報をメールでお知らせいたします。</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/products"
            className="rounded-full border border-slate-300 bg-white px-8 py-3 text-center text-sm font-semibold text-slate-900 transition hover:border-slate-900"
          >
            商品を見る
          </Link>
          <Link
            href="/"
            className="rounded-full bg-slate-900 px-8 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <CheckoutCompleteContent />
    </Suspense>
  );
}


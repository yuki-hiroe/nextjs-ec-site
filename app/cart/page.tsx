"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useSession } from "next-auth/react";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const { getStock, checkStock } = useInventory();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  // ログイン状態をチェック（チェックアウトボタンクリック時）
  const handleCheckout = () => {
    if (!isAuthenticated) {
      // ログイン後にカートページに戻れるように、現在のURLを保存
      sessionStorage.setItem("redirectAfterLogin", "/cart");
      router.push("/login");
      return;
    }
    router.push("/checkout");
  };

  const totalPrice = getTotalPrice();
  const shippingFee = totalPrice >= 15000 ? 0 : 500;
  const finalTotal = totalPrice + shippingFee;

  if (items.length === 0) {
    return (
      <div className="space-y-10">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">Cart</span>
        </nav>

        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">カートは空です</h2>
          <p className="mt-2 text-slate-600">商品をカートに追加して、お買い物を始めましょう。</p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            商品を見る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Cart</span>
      </nav>

      <div>
        <h1 className="text-3xl font-semibold text-slate-900">ショッピングカート</h1>
        <p className="mt-2 text-slate-600">
          {items.length} 点の商品がカートに入っています
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const price = parseInt(item.price.replace(/[¥,]/g, ""), 10);
              const subtotal = price * item.quantity;
              const currentStock = getStock(item.id);
              const hasEnoughStock = checkStock(item.id, item.quantity);
              const canIncrease = checkStock(item.id, item.quantity + 1);

              return (
                <div
                  key={item.id}
                  className={`flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row ${
                    hasEnoughStock
                      ? "border-slate-200 bg-white"
                      : "border-amber-300 bg-amber-50"
                  }`}
                >
                  <Link
                    href={item.slug ? `/products/${item.slug}` : `/products/${item.id}`}
                    className="relative aspect-square h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-24"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col justify-between gap-4">
                    <div>
                      <Link
                        href={item.slug ? `/products/${item.slug}` : `/products/${item.id}`}
                        className="text-lg font-semibold text-slate-900 hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm text-slate-600">{item.price}</p>
                      {!hasEnoughStock && (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                          在庫不足: 残り{currentStock}点（カート内: {item.quantity}点）
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label htmlFor={`quantity-${item.id}`} className="text-sm text-slate-600">
                          数量:
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-900 hover:text-slate-900"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              if (canIncrease) {
                                updateQuantity(item.id, item.quantity + 1);
                              } else {
                                alert(`在庫が不足しています（残り${currentStock}点）`);
                              }
                            }}
                            disabled={!canIncrease}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-900 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-lg font-semibold text-slate-900">
                          ¥{subtotal.toLocaleString()}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-sm text-slate-500 hover:text-slate-900"
                          aria-label="削除"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">注文概要</h2>
            <div className="mt-4 space-y-3 divide-y divide-slate-100">
              <div className="flex justify-between text-sm text-slate-600">
                <span>小計</span>
                <span>¥{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 text-sm text-slate-600">
                <span>送料</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600">無料</span>
                  ) : (
                    `¥${shippingFee.toLocaleString()}`
                  )}
                </span>
              </div>
              {totalPrice < 15000 && (
                <p className="pt-2 text-xs text-slate-500">
                  ¥15,000以上で送料無料
                </p>
              )}
              <div className="flex justify-between pt-3 text-lg font-semibold text-slate-900">
                <span>合計</span>
                <span>¥{finalTotal.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="mt-6 w-full rounded-full bg-slate-900 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              レジに進む
            </button>
            <button
              onClick={clearCart}
              className="mt-3 w-full text-center text-sm text-slate-500 hover:text-slate-900"
            >
              カートを空にする
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


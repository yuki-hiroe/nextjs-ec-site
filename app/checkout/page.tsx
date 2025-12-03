"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useSession } from "next-auth/react";

type PaymentMethod = "credit" | "bank" | "convenience";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCart();
  const { reduceStock, checkStock } = useInventory();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const user = session?.user;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ログイン状態をチェック
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // ログイン後にチェックアウトページに戻れるように、現在のURLを保存
      sessionStorage.setItem("redirectAfterLogin", "/checkout");
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const [formData, setFormData] = useState({
    // 配送先情報
    lastName: "",
    firstName: "",
    lastNameKana: "",
    firstNameKana: "",
    postalCode: "",
    prefecture: "",
    city: "",
    address: "",
    building: "",
    phone: "",
    email: "",
    // 支払い方法
    paymentMethod: "credit" as PaymentMethod,
    // クレジットカード情報
    cardNumber: "",
    cardExpiryMonth: "",
    cardExpiryYear: "",
    cardCvv: "",
    cardName: "",
    // 注文メモ
    notes: "",
  });

  const totalPrice = getTotalPrice();
  const shippingFee = totalPrice >= 15000 ? 0 : 500;
  const finalTotal = totalPrice + shippingFee;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // クレジットカード情報のバリデーション
    if (formData.paymentMethod === "credit") {
      if (!formData.cardNumber || !formData.cardExpiryMonth || !formData.cardExpiryYear || !formData.cardCvv || !formData.cardName) {
        alert("クレジットカード情報をすべて入力してください。");
        setIsSubmitting(false);
        return;
      }
    }

    // 注文データを作成
    const orderData = {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      shipping: {
        lastName: formData.lastName,
        firstName: formData.firstName,
        lastNameKana: formData.lastNameKana,
        firstNameKana: formData.firstNameKana,
        postalCode: formData.postalCode,
        prefecture: formData.prefecture,
        city: formData.city,
        address: formData.address,
        building: formData.building,
        phone: formData.phone,
        email: formData.email,
      },
      payment: {
        method: formData.paymentMethod,
        total: finalTotal,
        // クレジットカード情報はセキュリティのため、実際の実装では送信しない
        // ここではデモ用にマスクした情報のみ保存
        cardInfo: formData.paymentMethod === "credit" ? {
          last4: formData.cardNumber.slice(-4),
          expiryMonth: formData.cardExpiryMonth,
          expiryYear: formData.cardExpiryYear,
        } : undefined,
      },
      notes: formData.notes,
      orderDate: new Date().toISOString(),
    };

    // 注文をAPI経由で保存
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...orderData,
          userId: user?.id || undefined, // ログイン済みユーザーのID
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "注文処理中にエラーが発生しました。もう一度お試しください。");
        setIsSubmitting(false);
        return;
      }

      // カートをクリア
      clearCart();

      // 注文完了ページにリダイレクト
      router.push(`/checkout/complete?orderId=${data.orderId}`);
    } catch (error) {
      console.error("注文処理中にエラーが発生しました:", error);
      alert("注文処理中にエラーが発生しました。もう一度お試しください。");
      setIsSubmitting(false);
    }
  };

  // ローディング中または未ログインの場合は何も表示しない（リダイレクト中）
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-10">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/cart" className="hover:text-slate-900">
            Cart
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">Checkout</span>
        </nav>

        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <h2 className="text-xl font-semibold text-slate-900">カートが空です</h2>
          <p className="mt-2 text-slate-600">商品をカートに追加してから、お進みください。</p>
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
        <Link href="/cart" className="hover:text-slate-900">
          Cart
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Checkout</span>
      </nav>

      <div>
        <h1 className="text-3xl font-semibold text-slate-900">お届け先・お支払い情報</h1>
        <p className="mt-2 text-slate-600">必要事項をご入力ください</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* 配送先情報 */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">配送先情報</h2>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                    姓 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                    名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="lastNameKana" className="block text-sm font-medium text-slate-700">
                    姓（フリガナ） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastNameKana"
                    name="lastNameKana"
                    required
                    value={formData.lastNameKana}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="firstNameKana" className="block text-sm font-medium text-slate-700">
                    名（フリガナ） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstNameKana"
                    name="firstNameKana"
                    required
                    value={formData.firstNameKana}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-slate-700">
                  郵便番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  required
                  placeholder="123-4567"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="prefecture" className="block text-sm font-medium text-slate-700">
                  都道府県 <span className="text-red-500">*</span>
                </label>
                <select
                  id="prefecture"
                  name="prefecture"
                  required
                  value={formData.prefecture}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                >
                  <option value="">選択してください</option>
                  <option value="北海道">北海道</option>
                  <option value="青森県">青森県</option>
                  <option value="岩手県">岩手県</option>
                  <option value="宮城県">宮城県</option>
                  <option value="秋田県">秋田県</option>
                  <option value="山形県">山形県</option>
                  <option value="福島県">福島県</option>
                  <option value="茨城県">茨城県</option>
                  <option value="栃木県">栃木県</option>
                  <option value="群馬県">群馬県</option>
                  <option value="埼玉県">埼玉県</option>
                  <option value="千葉県">千葉県</option>
                  <option value="東京都">東京都</option>
                  <option value="神奈川県">神奈川県</option>
                  <option value="新潟県">新潟県</option>
                  <option value="富山県">富山県</option>
                  <option value="石川県">石川県</option>
                  <option value="福井県">福井県</option>
                  <option value="山梨県">山梨県</option>
                  <option value="長野県">長野県</option>
                  <option value="岐阜県">岐阜県</option>
                  <option value="静岡県">静岡県</option>
                  <option value="愛知県">愛知県</option>
                  <option value="三重県">三重県</option>
                  <option value="滋賀県">滋賀県</option>
                  <option value="京都府">京都府</option>
                  <option value="大阪府">大阪府</option>
                  <option value="兵庫県">兵庫県</option>
                  <option value="奈良県">奈良県</option>
                  <option value="和歌山県">和歌山県</option>
                  <option value="鳥取県">鳥取県</option>
                  <option value="島根県">島根県</option>
                  <option value="岡山県">岡山県</option>
                  <option value="広島県">広島県</option>
                  <option value="山口県">山口県</option>
                  <option value="徳島県">徳島県</option>
                  <option value="香川県">香川県</option>
                  <option value="愛媛県">愛媛県</option>
                  <option value="高知県">高知県</option>
                  <option value="福岡県">福岡県</option>
                  <option value="佐賀県">佐賀県</option>
                  <option value="長崎県">長崎県</option>
                  <option value="熊本県">熊本県</option>
                  <option value="大分県">大分県</option>
                  <option value="宮崎県">宮崎県</option>
                  <option value="鹿児島県">鹿児島県</option>
                  <option value="沖縄県">沖縄県</option>
                </select>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                  市区町村 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700">
                  番地 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="building" className="block text-sm font-medium text-slate-700">
                  建物名・部屋番号
                </label>
                <input
                  type="text"
                  id="building"
                  name="building"
                  value={formData.building}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  placeholder="090-1234-5678"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* 支払い方法 */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">お支払い方法</h2>
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 hover:border-slate-900">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="credit"
                  checked={formData.paymentMethod === "credit"}
                  onChange={handleInputChange}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">クレジットカード</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Visa、Mastercard、JCB、American Express に対応
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 hover:border-slate-900">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={formData.paymentMethod === "bank"}
                  onChange={handleInputChange}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">銀行振込</p>
                  <p className="mt-1 text-xs text-slate-500">
                    ご入金確認後、商品を発送いたします
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 hover:border-slate-900">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="convenience"
                  checked={formData.paymentMethod === "convenience"}
                  onChange={handleInputChange}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">コンビニ決済</p>
                  <p className="mt-1 text-xs text-slate-500">
                    セブンイレブン、ファミリーマート、ローソンなど
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* クレジットカード情報 */}
          {formData.paymentMethod === "credit" && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">クレジットカード情報</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-slate-700">
                    カード番号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    required={formData.paymentMethod === "credit"}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={formData.cardNumber}
                    onChange={(e) => {
                      // 数字のみを許可し、4桁ごとにスペースを挿入
                      const value = e.target.value.replace(/\s/g, "").replace(/\D/g, "");
                      const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                      setFormData((prev) => ({ ...prev, cardNumber: formatted }));
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="cardExpiryMonth" className="block text-sm font-medium text-slate-700">
                      有効期限 <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 flex gap-2">
                      <select
                        id="cardExpiryMonth"
                        name="cardExpiryMonth"
                        required={formData.paymentMethod === "credit"}
                        value={formData.cardExpiryMonth}
                        onChange={handleInputChange}
                        className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      >
                        <option value="">月</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <option key={month} value={String(month).padStart(2, "0")}>
                            {String(month).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                      <select
                        id="cardExpiryYear"
                        name="cardExpiryYear"
                        required={formData.paymentMethod === "credit"}
                        value={formData.cardExpiryYear}
                        onChange={handleInputChange}
                        className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                      >
                        <option value="">年</option>
                        {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                          <option key={year} value={String(year).slice(-2)}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cardCvv" className="block text-sm font-medium text-slate-700">
                      CVV <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="cardCvv"
                      name="cardCvv"
                      required={formData.paymentMethod === "credit"}
                      placeholder="123"
                      maxLength={4}
                      value={formData.cardCvv}
                      onChange={(e) => {
                        // 数字のみを許可
                        const value = e.target.value.replace(/\D/g, "");
                        setFormData((prev) => ({ ...prev, cardCvv: value }));
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-slate-500">カード裏面の3-4桁の数字</p>
                  </div>
                </div>

                <div>
                  <label htmlFor="cardName" className="block text-sm font-medium text-slate-700">
                    カード名義人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cardName"
                    name="cardName"
                    required={formData.paymentMethod === "credit"}
                    placeholder="TARO YAMADA"
                    value={formData.cardName}
                    onChange={(e) => {
                      // 大文字のみを許可
                      const value = e.target.value.toUpperCase();
                      setFormData((prev) => ({ ...prev, cardName: value }));
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">カードに記載されている名義人（ローマ字）</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-600">
                    <svg
                      className="mb-1 inline h-4 w-4 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    お客様のカード情報は安全に暗号化され、当社のサーバーには保存されません。
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* 注文メモ */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">注文メモ（任意）</h2>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="配送に関するご要望などがございましたら、こちらにご記入ください"
              className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </section>
        </div>

        {/* 注文概要 */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">注文内容</h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => {
                const price = parseInt(item.price.replace(/[¥,]/g, ""), 10);
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.price} × {item.quantity}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 space-y-3 divide-y divide-slate-100">
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
              <div className="flex justify-between pt-3 text-lg font-semibold text-slate-900">
                <span>合計</span>
                <span>¥{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "処理中..." : "注文を確定する"}
            </button>

            <Link
              href="/cart"
              className="mt-3 block w-full text-center text-sm text-slate-500 hover:text-slate-900"
            >
              カートに戻る
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}


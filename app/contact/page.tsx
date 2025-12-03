"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

type InquiryType = "styling" | "product" | "order" | "other";

type Stylist = {
  id: string;
  name: string;
  nameEn?: string;
  bio: string;
};

export default function ContactPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    inquiryType: (searchParams.get("inquiryType") as InquiryType) || "styling",
    message: "",
    stylistId: searchParams.get("stylistId") || "",
  });

  useEffect(() => {
    // URLパラメータからスタイリストIDを取得
    const stylistId = searchParams.get("stylistId");
    if (stylistId) {
      // スタイリスト情報を取得
      fetch(`/api/stylists/${stylistId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setSelectedStylist(data);
            setFormData((prev) => ({
              ...prev,
              stylistId: data.id,
              inquiryType: "styling",
            }));
          }
        })
        .catch((error) => {
          console.error("スタイリスト取得エラー:", error);
        });
    }
  }, [searchParams]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userId: user?.id || undefined, // ログイン済みユーザーのID
          stylistId: formData.stylistId || undefined, // スタイリストID（選択されている場合のみ）
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "お問い合わせの送信に失敗しました");
      }

      const data = await response.json();

      // フォームをリセット（ログイン済みの場合は名前とメールアドレスは保持）
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        inquiryType: "styling",
        message: "",
        stylistId: "",
      });
      setSelectedStylist(null);

      setShowMessage(true);
      setTimeout(() => {
        setShowMessage(false);
      }, 5000);
    } catch (error) {
      console.error("お問い合わせ送信中にエラーが発生しました:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "お問い合わせ送信中にエラーが発生しました。もう一度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Contact</span>
      </nav>

      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Contact</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">お問い合わせ</h1>
        <p className="mt-3 text-slate-600">
          商品に関するご質問やスタイリング相談など、お気軽にお問い合わせください。
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">お問い合わせフォーム</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    お名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="山田 太郎"
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
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="inquiryType" className="block text-sm font-medium text-slate-700">
                    お問い合わせ種別 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="inquiryType"
                    name="inquiryType"
                    required
                    value={formData.inquiryType}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  >
                    <option value="styling">スタイリング相談</option>
                    <option value="product">商品について</option>
                    <option value="order">ご注文について</option>
                    <option value="other">その他</option>
                  </select>
                </div>

                {formData.inquiryType === "styling" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      相談したいスタイリスト
                    </label>
                    {selectedStylist ? (
                      <div className="rounded-lg border border-slate-300 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{selectedStylist.name}</p>
                            {selectedStylist.nameEn && (
                              <p className="text-sm text-slate-500">{selectedStylist.nameEn}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStylist(null);
                              setFormData((prev) => ({ ...prev, stylistId: "" }));
                            }}
                            className="text-sm text-slate-500 hover:text-slate-900"
                          >
                            変更
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href="/stylists?select=true"
                        className="block mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 hover:border-slate-900 hover:text-slate-900 transition text-center"
                      >
                        スタイリストを選ぶ
                      </Link>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                    メッセージ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="お問い合わせ内容をご記入ください"
                  />
                </div>
              </div>

              {showMessage && (
                <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-sm text-emerald-800">
                    お問い合わせを受け付けました。担当者より2営業日以内にご返信いたします。
                  </p>
                  <p className="mt-2 text-sm text-emerald-700">
                    返信は
                    <Link href="/inquiries" className="ml-1 font-semibold underline hover:no-underline">
                      お問い合わせ履歴
                    </Link>
                    から確認できます。
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-800">{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "送信中..." : "送信する"}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">スタイリング相談</h3>
            <p className="mt-2 text-sm text-slate-600">
              お客様に合ったコーディネートを無料でご提案いたします。サイズやスタイルについてお気軽にご相談ください。
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>サイズ選びのご相談</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>シーン別コーディネート提案</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>お気に入りアイテムの組み合わせ</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900">よくあるご質問</h3>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="font-medium text-slate-900">返品・交換はできますか？</p>
                <p className="mt-1 text-slate-600">
                  未使用・未開封の商品に限り、14日以内であれば返品・交換を承ります。
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-900">送料はかかりますか？</p>
                <p className="mt-1 text-slate-600">
                  ¥15,000以上のご注文で送料無料です。それ以下は全国一律¥500です。
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-900">在庫状況を確認できますか？</p>
                <p className="mt-1 text-slate-600">
                  各商品ページで在庫状況をご確認いただけます。在庫切れの場合は入荷待ちとなります。
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">営業時間</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>平日: 10:00 - 18:00</p>
              <p>土日祝: 11:00 - 17:00</p>
              <p className="mt-4 text-xs text-slate-500">
                お問い合わせへの返信は2営業日以内を目安にしております。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


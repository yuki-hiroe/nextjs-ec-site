"use client";

import { useState } from "react";
import Link from "next/link";

export default function StylistApplyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    bio: "",
    specialties: "",
    image: "",
    email: "",
    password: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // 専門分野を配列に変換
      const specialties = formData.specialties
        ? formData.specialties.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const response = await fetch("/api/stylists/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          nameEn: formData.nameEn || null,
          bio: formData.bio,
          specialties: specialties,
          image: formData.image || null,
          email: formData.email,
          password: formData.password || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "申請の送信に失敗しました");
        setIsSubmitting(false);
        return;
      }

      // 申請成功
      setSuccess(true);
      // フォームをリセット
      setFormData({
        name: "",
        nameEn: "",
        bio: "",
        specialties: "",
        image: "",
        email: "",
        password: "",
      });
    } catch (error) {
      console.error("申請エラー:", error);
      setError("申請の送信に失敗しました");
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <div className="mb-4">
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
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">申請を受け付けました</h1>
            <p className="mt-4 text-slate-600">
              スタイリスト登録申請を送信しました。管理者による審査後、登録が承認され次第、ログイン可能になります。
            </p>
            <p className="mt-2 text-sm text-slate-500">
              承認までしばらくお待ちください。承認が完了しましたら、登録いただいたメールアドレスに通知をお送りします。
            </p>
            <div className="mt-6 flex gap-4">
              <Link
                href="/"
                className="flex-1 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                トップページに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900">スタイリスト登録申請</h1>
            <p className="mt-2 text-sm text-slate-600">
              スタイリストとして登録するには、以下のフォームに必要事項を入力して申請してください。
              管理者による審査後、承認され次第、ログイン可能になります。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="佐藤 美咲"
                />
              </div>

              <div>
                <label htmlFor="nameEn" className="block text-sm font-medium text-slate-700 mb-2">
                  英語名
                </label>
                <input
                  id="nameEn"
                  name="nameEn"
                  type="text"
                  value={formData.nameEn}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Sato Misaki"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="misaki@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                パスワード <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="パスワードを設定"
              />
              <p className="mt-1 text-xs text-slate-500">承認後、このパスワードでログインできます</p>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-2">
                自己紹介 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="10年以上の経験を持つパーソナルスタイリスト。ミニマルで上質なライフスタイルを提案します。"
              />
            </div>

            <div>
              <label htmlFor="specialties" className="block text-sm font-medium text-slate-700 mb-2">
                専門分野
              </label>
              <input
                id="specialties"
                name="specialties"
                type="text"
                value={formData.specialties}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="ミニマルスタイル, ビジネスカジュアル, カラースタイリング"
              />
              <p className="mt-1 text-xs text-slate-500">カンマ区切りで複数入力可能</p>
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-slate-700 mb-2">
                プロフィール画像URL
              </label>
              <input
                id="image"
                name="image"
                type="url"
                value={formData.image}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "送信中..." : "申請を送信"}
              </button>
              <Link
                href="/"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


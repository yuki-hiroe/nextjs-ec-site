"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function NewStylistPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    bio: "",
    specialties: "",
    image: "",
    email: "",
    password: "",
    isActive: true,
  });

  const { data: session, status } = useSession();

  useEffect(() => {
    // NextAuthセッションで管理者認証を確認
    if (status === "loading") {
      return; // セッション読み込み中
    }

    if (status === "unauthenticated" || !session?.user) {
      router.push("/admin/login");
      return;
    }

    if (session.user.role !== "admin") {
      router.push("/admin/login");
      return;
    }
  }, [router, session, status]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
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

      const response = await fetch("/api/admin/stylists", {
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
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "スタイリストの登録に失敗しました");
        setIsSubmitting(false);
        return;
      }

      // 登録成功
      router.push("/admin/stylists");
    } catch (error) {
      console.error("登録エラー:", error);
      setError("スタイリストの登録に失敗しました");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/admin" className="hover:text-slate-900">
          ダッシュボード
        </Link>
        <span className="mx-2">/</span>
        <Link href="/admin/stylists" className="hover:text-slate-900">
          スタイリスト管理
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">新規登録</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">新規スタイリスト登録</h1>
          <p className="mt-2 text-slate-600">新しいスタイリストの情報を入力してください</p>
        </div>
        <Link
          href="/admin/stylists"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
        >
          一覧に戻る
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8">
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
            placeholder="misaki@intercambio.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder="パスワードを設定（空欄の場合は後で設定可能）"
          />
          <p className="mt-1 text-xs text-slate-500">パスワードを設定しない場合、スタイリストはログインできません</p>
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

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="rounded border-slate-300"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
            アクティブ（有効）
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "登録中..." : "スタイリストを登録"}
          </button>
          <Link
            href="/admin/stylists"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}


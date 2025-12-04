"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type TestimonialFormProps = {
  onSuccess?: () => void;
};

export default function TestimonialForm({ onSuccess }: TestimonialFormProps) {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    comment: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // セッションの状態が変わったときにフォームをリセット
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // ログインしている場合のみ、ユーザー情報を設定
      setFormData((prev) => ({
        ...prev,
        name: session.user?.name || "",
        email: session.user?.email || "",
      }));
    } else {
      // ログアウトした場合、フォームをクリア
      setFormData({
        name: "",
        role: "",
        comment: "",
        email: "",
      });
      // メッセージもクリア
      setMessage(null);
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          role: formData.role.trim() || null,
          comment: formData.comment.trim(),
          email: formData.email.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "投稿に失敗しました");
      }

      setMessage({
        type: "success",
        text: data.message || "お客様の声を投稿しました。管理者の承認後に公開されます。",
      });

      // フォームをリセット（コメントと役職のみクリア、名前とメールはセッションから取得）
      setFormData((prev) => ({
        ...prev,
        role: "",
        comment: "",
      }));

      // 成功コールバックを実行
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "投稿に失敗しました",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-slate-700 mb-1">
            お名前 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            placeholder="山田 太郎"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-xs font-medium text-slate-700 mb-1">
            役職・職業（任意）
          </label>
          <input
            id="role"
            type="text"
            value={formData.role}
            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            placeholder="デザイナー、会社員など"
          />
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-xs font-medium text-slate-700 mb-1">
          コメント <span className="text-red-500">*</span>
        </label>
        <textarea
          id="comment"
          required
          rows={3}
          value={formData.comment}
          onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
          placeholder="ご意見・ご感想をお聞かせください（10文字以上500文字以内）"
          minLength={10}
          maxLength={500}
        />
        <p className="mt-1 text-xs text-slate-500">
          {formData.comment.length}/500文字
        </p>
      </div>

      {!session?.user && (
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1">
            メールアドレス（任意、非公開）
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            placeholder="example@email.com"
          />
          <p className="mt-1 text-xs text-slate-500">
            メールアドレスは公開されません。管理者確認用のみ使用します。
          </p>
        </div>
      )}

      {message && (
        <div
          className={`rounded-lg px-3 py-2 text-xs ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "投稿中..." : "投稿する"}
      </button>

      <p className="text-xs text-slate-500 text-center">
        投稿いただいた内容は管理者の承認後に公開されます。
      </p>
    </form>
  );
}


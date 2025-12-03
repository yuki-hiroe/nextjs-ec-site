"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function NewsletterForm() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ログインチェック
    if (status !== "authenticated" || !session?.user) {
      setMessage({
        type: "error",
        text: "Newsletterに登録するにはログインが必要です",
      });
      return;
    }

    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "登録に失敗しました");
      }

      setMessage({
        type: "success",
        text: data.message || "Newsletterの購読登録が完了しました",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "登録に失敗しました",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ログインしていない場合
  if (status !== "authenticated" || !session?.user) {
    return (
      <div>
        <p className="text-sm text-slate-300 mb-3">
          Newsletterに登録するにはログインが必要です
        </p>
        <Link
          href="/login"
          className="inline-block rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          ログインして登録する
        </Link>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "登録中..." : "Newsletterに登録する"}
        </button>
      </form>
      {message && (
        <div
          className={`mt-3 rounded-lg px-4 py-2 text-xs ${
            message.type === "success"
              ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
              : "bg-red-500/20 text-red-200 border border-red-500/30"
          }`}
        >
          {message.text}
        </div>
      )}
      <p className="mt-3 text-xs text-slate-400">
        いつでも配信停止できます。個人情報は厳重に管理します。
      </p>
    </div>
  );
}


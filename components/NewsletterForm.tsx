"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function NewsletterForm() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    isActive: boolean;
  } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // 登録状態を取得
  useEffect(() => {
    const checkStatus = async () => {
      if (status !== "authenticated" || !session?.user) {
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await fetch("/api/newsletter/status");
        const data = await response.json();
        setSubscriptionStatus(data);
      } catch (error) {
        console.error("登録状態の取得に失敗しました:", error);
        setSubscriptionStatus({ subscribed: false, isActive: false });
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkStatus();
  }, [status, session]);

  const handleSubscribe = async (e: React.FormEvent) => {
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
      
      // 状態を更新
      setSubscriptionStatus({ subscribed: true, isActive: true });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "登録に失敗しました",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!confirm("Newsletterの配信を停止しますか？")) {
      return;
    }

    setMessage(null);
    setIsUnsubscribing(true);

    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "登録解除に失敗しました");
      }

      setMessage({
        type: "success",
        text: data.message || "Newsletterの配信を停止しました",
      });
      
      // 状態を更新
      setSubscriptionStatus({ subscribed: true, isActive: false });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "登録解除に失敗しました",
      });
    } finally {
      setIsUnsubscribing(false);
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

  // 登録状態を確認中
  if (isCheckingStatus) {
    return (
      <div>
        <p className="text-sm text-slate-300">読み込み中...</p>
      </div>
    );
  }

  // 既に登録済みでアクティブな場合
  if (subscriptionStatus?.subscribed && subscriptionStatus?.isActive) {
    return (
      <div className="w-full">
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-4 py-3 mb-4">
          <p className="text-sm text-emerald-200">
            ✓ Newsletterに登録済みです
          </p>
        </div>
        <button
          onClick={handleUnsubscribe}
          disabled={isUnsubscribing}
          className="w-full rounded-full border border-white/40 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUnsubscribing ? "処理中..." : "配信を停止する"}
        </button>
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
      </div>
    );
  }

  // 配信停止されている場合
  if (subscriptionStatus?.subscribed && !subscriptionStatus?.isActive) {
    return (
      <div className="w-full">
        <div className="rounded-lg bg-slate-500/20 border border-slate-500/30 px-4 py-3 mb-4">
          <p className="text-sm text-slate-300">
            配信は停止されています
          </p>
        </div>
        <form onSubmit={handleSubscribe}>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "登録中..." : "配信を再開する"}
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
      </div>
    );
  }

  // 未登録の場合
  return (
    <div className="w-full">
      <form onSubmit={handleSubscribe}>
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
    </div>
  );
}


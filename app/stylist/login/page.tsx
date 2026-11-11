"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoginPendingOverlay from "@/components/LoginPendingOverlay";

export default function StylistLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("stylist", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        router.push("/stylist");
        router.refresh();
      } else {
        throw new Error("ログインに失敗しました");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <LoginPendingOverlay show={isLoading} />
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">スタイリストログイン</h1>
          <p className="mt-2 text-sm text-slate-600">
            スタイリストアカウントでログインしてください
          </p>
          <p className="mt-2 text-sm text-slate-600">
            通常ユーザーアカウントでログインする場合は
            <Link href="/login" className="ml-1 font-semibold text-slate-900 hover:underline">
              こちら
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isLoading}>
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
              placeholder="stylist@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait"
          >
            {isLoading ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />
                ログインしています
              </>
            ) : (
              "ログイン"
            )}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center">
          <p className="text-sm text-slate-600">
            スタイリストアカウントをお持ちでない方は
            <Link href="/stylist/apply" className="ml-1 font-semibold text-slate-900 hover:underline">
              こちらから申請
            </Link>
          </p>
          <Link href="/" className="block text-sm text-slate-600 hover:text-slate-900">
            トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}


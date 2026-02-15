"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!result || result.error) {
        throw new Error(result?.error || "ログインに失敗しました");
      }

      // セッションが確立されるまで待機（複数回チェック）
      let session = null;
      let attempts = 0;
      const maxAttempts = 15;
      
      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const sessionResponse = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "include",
        });
        session = await sessionResponse.json();
        
        if (session?.user && session.user.role === "admin") {
          // セッションが確立されたことを確認
          break;
        }
        attempts++;
      }

      if (!session?.user || session.user.role !== "admin") {
        // 管理者でない場合はログアウトしてエラーを表示
        await fetch("/api/auth/signout", { method: "POST" });
        throw new Error("管理者権限が必要です");
      }

      // セッション確立を確実にするため、少し待機してからリダイレクト
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // 完全なリロードでセッションを確実に反映
      window.location.href = "/admin";
    } catch (error) {
      setError(error instanceof Error ? error.message : "ログインに失敗しました");
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">管理者ログイン</h1>
          <p className="mt-2 text-sm text-slate-600">
            管理者アカウントでログインしてください
          </p>
          <p className="mt-2 text-sm text-slate-600">
            通常ユーザーアカウントでログインする場合は
            <Link href="/login" className="ml-1 font-semibold text-slate-900 hover:underline">
              こちら
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="admin@example.com"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        {/* <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            トップページに戻る
          </Link>
        </div> */}
      </div>
    </div>
  );
}


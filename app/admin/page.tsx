"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    inquiries: 0,
    stylists: 0,
    pendingApplications: 0,
    approvedTestimonials: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();
      if (data && !data.error) {
        setStats({
          products: data.products ?? 0,
          orders: data.orders ?? 0,
          inquiries: data.inquiries ?? 0,
          stylists: data.stylists ?? 0,
          pendingApplications: data.pendingApplications ?? 0,
          approvedTestimonials: data.approvedTestimonials ?? 0,
        });
      }
      setIsLoading(false);
    } catch (error) {
      console.error("統計情報取得エラー:", error);
      setIsLoading(false);
    }
  };

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

    // セッションから管理者情報を設定
    setAdmin({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    });

    // 統計情報を取得
    fetchStats();

    // ページがフォーカスされた時に統計情報を再取得
    const handleFocus = () => {
      fetchStats();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [router, session, status]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">管理者ダッシュボード</h1>
          <p className="mt-2 text-slate-600">ようこそ、{admin.name}さん</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
        >
          ログアウト
        </button>
      </div>

      {/* 統計情報 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/products"
          className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">商品数</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.products}</p>
            </div>
            <div className="rounded-full bg-slate-100 p-3">
              <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/orders"
          className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">注文数</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.orders}</p>
            </div>
            <div className="rounded-full bg-slate-100 p-3">
              <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/inquiries"
          className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">お問い合わせ</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.inquiries}</p>
            </div>
            <div className="rounded-full bg-slate-100 p-3">
              <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/stylists"
          className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:shadow-lg relative"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">スタイリスト</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.stylists}</p>
            </div>
            <div className="rounded-full bg-slate-100 p-3">
              <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          {stats.pendingApplications > 0 && (
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-ping opacity-75" />
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
              <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                申請中 {stats.pendingApplications}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* 追加の統計情報 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/testimonials"
          className="rounded-3xl border border-slate-200 bg-white p-6 transition hover:shadow-lg relative"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">お客様の声</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.approvedTestimonials}</p>
            </div>
            <div className="rounded-full bg-slate-100 p-3">
              <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* クイックアクション */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">クイックアクション</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-slate-900 hover:bg-slate-50"
          >
            <div className="rounded-full bg-slate-100 p-2">
              <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900">新規商品を追加</p>
              <p className="text-sm text-slate-600">商品情報を登録</p>
            </div>
          </Link>

          <Link
            href="/admin/stylists"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-slate-900 hover:bg-slate-50"
          >
            <div className="rounded-full bg-slate-100 p-2">
              <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900">スタイリスト管理</p>
              <p className="text-sm text-slate-600">
                スタイリスト一覧
                {stats.pendingApplications > 0 && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    申請中 {stats.pendingApplications}
                  </span>
                )}
              </p>
            </div>
          </Link>

          <Link
            href="/admin/stylists/applications"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-slate-900 hover:bg-slate-50"
          >
            <div className="rounded-full bg-slate-100 p-2">
              <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H9.414a2 2 0 00-1.414.586L5.586 6.586A2 2 0 005 8v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900">スタイリスト申請一覧</p>
              <p className="text-sm text-slate-600">
                新規申請の確認
                {stats.pendingApplications > 0 && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    審査中 {stats.pendingApplications}
                  </span>
                )}
              </p>
            </div>
          </Link>

          <Link
            href="/admin/testimonials"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-slate-900 hover:bg-slate-50 relative"
          >
            <div className="rounded-full bg-slate-100 p-2">
              <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">お客様の声管理</p>
              <p className="text-sm text-slate-600">
                お客様の声の承認・管理
              </p>
            </div>
          </Link>

          <Link
            href="/admin/inquiries"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-slate-900 hover:bg-slate-50"
          >
            <div className="rounded-full bg-slate-100 p-2">
              <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900">お問い合わせ確認</p>
              <p className="text-sm text-slate-600">未対応の確認</p>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-slate-900 hover:bg-slate-50"
          >
            <div className="rounded-full bg-slate-100 p-2">
              <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900">ユーザー管理</p>
              <p className="text-sm text-slate-600">アカウント管理</p>
            </div>
          </Link>

          <Link
            href="/admin/audit-logs"
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-slate-900 hover:bg-slate-50"
          >
            <div className="rounded-full bg-slate-100 p-2">
              <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900">監査ログ</p>
              <p className="text-sm text-slate-600">操作履歴の確認</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}


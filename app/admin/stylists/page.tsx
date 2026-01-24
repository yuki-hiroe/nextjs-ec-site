"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

type Stylist = {
  id: string;
  name: string;
  nameEn?: string | null;
  bio: string;
  specialties: string[];
  image?: string | null;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminStylistsPage() {
  const router = useRouter();
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

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

    fetchStylists();
  }, [router, showInactive, session, status]);

  const fetchStylists = async () => {
    try {
      const response = await fetch("/api/stylists?all=true");
      const data = await response.json();
      if (data && !data.error) {
        const filtered = showInactive
          ? data
          : data.filter((stylist: Stylist) => stylist.isActive);
        setStylists(filtered);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("スタイリスト取得エラー:", error);
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/stylists/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "ステータスの更新に失敗しました");
        return;
      }

      // ステータスを更新
      setStylists((prev) =>
        prev.map((stylist) =>
          stylist.id === id ? { ...stylist, isActive: newStatus } : stylist
        )
      );
    } catch (error) {
      console.error("ステータス更新エラー:", error);
      alert("ステータスの更新に失敗しました");
    }
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

  return (
    <div className="space-y-10">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/admin" className="hover:text-slate-900">
          ダッシュボード
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">スタイリスト管理</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">スタイリスト管理</h1>
          <p className="mt-2 text-slate-600">
            登録されているスタイリストの一覧と情報を確認できます
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-slate-300"
            />
            非アクティブも表示
          </label>
          <Link
            href="/admin"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
          >
            ダッシュボードに戻る
          </Link>
          <Link
            href="/admin/stylists/applications"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
          >
            申請一覧
          </Link>
          <Link
            href="/admin/stylists/new"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            新規スタイリストを追加
          </Link>
        </div>
      </div>

      {stylists.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-600">スタイリストが見つかりませんでした。</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  プロフィール
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  名前
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  メールアドレス
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  専門分野
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  ステータス
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  登録日
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stylists.map((stylist) => (
                <tr key={stylist.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {stylist.image && stylist.image.trim() !== "" && stylist.image.startsWith("http") ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-full bg-slate-100">
                        <Image
                          src={stylist.image}
                          alt={stylist.name || "スタイリスト"}
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized={!stylist.image.includes("images.unsplash.com")}
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-600">
                        {(stylist.name || "S").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{stylist.name || "スタイリスト"}</p>
                      {stylist.nameEn && stylist.nameEn.trim() !== "" && (
                        <p className="text-sm text-slate-500">{stylist.nameEn}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{stylist.email || ""}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(stylist.specialties) && stylist.specialties.length > 0 ? (
                        stylist.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                          >
                            {specialty}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          stylist.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {stylist.isActive ? "アクティブ" : "非アクティブ"}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(stylist.id, !stylist.isActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${
                          stylist.isActive ? "bg-emerald-600" : "bg-slate-300"
                        }`}
                        aria-label={`${stylist.name}のステータスを${stylist.isActive ? "無効化" : "有効化"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            stylist.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(stylist.createdAt).toLocaleDateString("ja-JP")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">統計情報</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-slate-600">総スタイリスト数</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {stylists.length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-slate-600">アクティブ</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">
              {stylists.filter((s) => s.isActive).length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-slate-600">非アクティブ</p>
            <p className="mt-2 text-2xl font-semibold text-slate-600">
              {stylists.filter((s) => !s.isActive).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


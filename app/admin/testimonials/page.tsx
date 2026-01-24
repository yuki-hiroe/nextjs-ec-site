"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Testimonial = {
  id: string;
  name: string;
  role: string | null;
  comment: string;
  email: string | null;
  isApproved: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export default function AdminTestimonialsPage() {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "pending">("all");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

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

    fetchTestimonials();
  }, [router, filter, session, status]);

  const fetchTestimonials = async () => {
    try {
      const statusParam = filter === "all" ? "" : `?status=${filter}`;
      const response = await fetch(`/api/admin/testimonials${statusParam}`);

      if (!response.ok) {
        throw new Error("お客様の声の取得に失敗しました");
      }

      const data = await response.json();
      setTestimonials(data);
      setIsLoading(false);
    } catch (error) {
      console.error("お客様の声取得エラー:", error);
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, isApproved: boolean) => {
    setIsProcessing(id);
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isApproved }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "更新に失敗しました");
      }

      await fetchTestimonials();
    } catch (error) {
      alert(error instanceof Error ? error.message : "更新に失敗しました");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」さんのお客様の声を削除しますか？`)) {
      return;
    }

    setIsProcessing(id);
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "削除に失敗しました");
      }

      await fetchTestimonials();
    } catch (error) {
      alert(error instanceof Error ? error.message : "削除に失敗しました");
    } finally {
      setIsProcessing(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">お客様の声管理</h1>
          <p className="mt-2 text-slate-600">お客様の声の承認・管理</p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
        >
          ダッシュボードに戻る
        </Link>
      </div>

      {/* フィルター */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            すべて ({testimonials.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === "pending"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            承認待ち ({testimonials.filter((t) => !t.isApproved).length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === "approved"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            承認済み ({testimonials.filter((t) => t.isApproved).length})
          </button>
        </div>
      </div>

      {/* お客様の声一覧 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          お客様の声一覧 ({testimonials.length}件)
        </h2>
        {testimonials.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600">お客様の声がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className={`rounded-2xl border p-6 ${
                  testimonial.isApproved
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {testimonial.name}
                      </p>
                      {testimonial.role && (
                        <span className="text-xs text-slate-500">
                          — {testimonial.role}
                        </span>
                      )}
                      {testimonial.isApproved ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                          承認済み
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                          承認待ち
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed mb-3">
                      "{testimonial.comment}"
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>
                        投稿日: {new Date(testimonial.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                      {testimonial.email && (
                        <span>メール: {testimonial.email}</span>
                      )}
                      {testimonial.user && (
                        <span>ユーザー: {testimonial.user.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!testimonial.isApproved ? (
                      <button
                        onClick={() => handleApprove(testimonial.id, true)}
                        disabled={isProcessing === testimonial.id}
                        className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                      >
                        {isProcessing === testimonial.id ? "処理中..." : "承認"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApprove(testimonial.id, false)}
                        disabled={isProcessing === testimonial.id}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        {isProcessing === testimonial.id ? "処理中..." : "承認取消"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(testimonial.id, testimonial.name)}
                      disabled={isProcessing === testimonial.id}
                      className="rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


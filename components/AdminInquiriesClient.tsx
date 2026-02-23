"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Reply = {
  id: string;
  inquiryId: string;
  message: string;
  fromType: string;
  fromEmail: string | null;
  fromName: string | null;
  isRead: boolean;
  createdAt: Date |string;
  updatedAt: Date | string;
};

type Inquiry = {
  id: string;
  name: string;
  email: string;
  inquiryType: string;
  message: string;
  status: string;
  createdAt: Date | string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  stylist: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    replies: number;
  };
  updatedAt: Date | string;
};

type AdminInquiriesClientProps = {
  initialInquiries: Inquiry[];
};

export default function AdminInquiriesClient({ initialInquiries }: AdminInquiriesClientProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries ?? []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setInquiries(initialInquiries ?? []);
  }, [initialInquiries]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});

  const fetchInquiries = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/inquiries?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data && !data.error) {
        setInquiries(data);
      }
    //   setIsLoading(false);
    } catch (error) {
      console.error("お問い合わせ取得エラー:", error);
    //   setIsLoading(false);
    }
  };

  const fetchReplies = async (inquiryId: string) => {
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/replies`);
      const data = await response.json();
      if (data && !data.error) {
        setReplies((prev) => ({ ...prev, [inquiryId]: data }));
      }
    } catch (error) {
      console.error("返信取得エラー:", error);
    }
  };

  const handleStatusUpdate = async (inquiryId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchInquiries();
      }
    } catch (error) {
      console.error("ステータス更新エラー:", error);
    }
  };

  const handleSearch = () => {
    fetchInquiries();
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
          <h1 className="text-3xl font-semibold text-slate-900">お問い合わせ管理</h1>
          <p className="mt-2 text-slate-600">すべてのお問い合わせを確認・管理できます</p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900 cursor-pointer"
        >
          ダッシュボードに戻る
        </Link>
      </div>

      {/* 検索・フィルター */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="メールアドレス、名前、メッセージで検索"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
          >
            <option value="all">すべて</option>
            <option value="new">新規</option>
            <option value="in_progress">対応中</option>
            <option value="resolved">完了</option>
          </select>
          <button
            onClick={handleSearch}
            className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 cursor-pointer"
          >
            検索
          </button>
        </div>
      </div>

      {/* お問い合わせ一覧 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          お問い合わせ一覧 ({inquiries.length}件)
        </h2>
        {inquiries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600">お問い合わせが見つかりません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-slate-900">{inquiry.name}</p>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          inquiry.status === "new"
                            ? "bg-blue-100 text-blue-800"
                            : inquiry.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {inquiry.status === "new"
                          ? "新規"
                          : inquiry.status === "in_progress"
                          ? "対応中"
                          : "完了"}
                      </span>
                      {inquiry._count.replies > 0 && (
                        <span className="text-xs text-slate-500">
                          ({inquiry._count.replies}件の返信)
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{inquiry.email}</p>
                    {inquiry.stylist && (
                      <p className="mt-1 text-sm text-slate-600">
                        スタイリスト: {inquiry.stylist.name}
                      </p>
                    )}
                    {inquiry.user && (
                      <p className="mt-1 text-sm text-slate-600">
                        ユーザー: {inquiry.user.name} ({inquiry.user.email})
                      </p>
                    )}
                    <p className="mt-2 text-sm text-slate-900">{inquiry.message}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(inquiry.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    <select
                      value={inquiry.status}
                      onChange={(e) => handleStatusUpdate(inquiry.id, e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs focus:border-slate-900 focus:outline-none"
                    >
                      <option value="new">新規</option>
                      <option value="in_progress">対応中</option>
                      <option value="resolved">完了</option>
                    </select>
                    <button
                      onClick={() => {
                        if (expandedInquiry === inquiry.id) {
                          setExpandedInquiry(null);
                        } else {
                          setExpandedInquiry(inquiry.id);
                          if (!replies[inquiry.id]) {
                            fetchReplies(inquiry.id);
                          }
                        }
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:border-slate-900 hover:text-slate-900 transition"
                    >
                      {expandedInquiry === inquiry.id ? "閉じる" : "返信履歴"}
                    </button>
                  </div>
                </div>

                {/* 返信履歴 */}
                {expandedInquiry === inquiry.id && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    {replies[inquiry.id] && replies[inquiry.id].length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-900">返信履歴</h4>
                        {replies[inquiry.id].map((reply) => (
                          <div
                            key={reply.id}
                            className={`rounded-lg p-3 ${
                              reply.fromType === "stylist"
                                ? "bg-slate-50 border border-slate-200"
                                : "bg-blue-50 border border-blue-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-slate-700">
                                  {reply.fromType === "stylist"
                                    ? reply.fromName || "スタイリスト"
                                    : reply.fromName || inquiry.name}
                                </p>
                                <span className="text-xs text-slate-500">
                                  ({reply.fromType === "stylist" ? "スタイリスト" : "ユーザー"})
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">
                                {new Date(reply.createdAt).toLocaleString("ja-JP")}
                              </p>
                            </div>
                            <p className="text-sm text-slate-900 whitespace-pre-wrap">
                              {reply.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">返信はまだありません</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


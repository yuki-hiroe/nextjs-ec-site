"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Reply = {
  id: string;
  inquiryId: string;
  message: string;
  fromType: string;
  fromEmail: string | null;
  fromName: string | null;
  isRead: boolean;
  createdAt: string;
};

type Inquiry = {
  id: string;
  name: string;
  email: string;
  inquiryType: string;
  message: string;
  status: string;
  createdAt: string;
  replies: Reply[];
  stylist?: {
    id: string;
    name: string;
    nameEn: string | null;
    image: string | null;
  } | null;
};

export default function InquiriesPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState(user?.email || "");
  const [emailInput, setEmailInput] = useState("");
  const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null);
  const [replyMessages, setReplyMessages] = useState<Record<string, string>>({});
  const [isReplying, setIsReplying] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      fetchInquiries(user.email);
    }
  }, [user]);

  const fetchInquiries = async (emailAddress: string) => {
    if (!emailAddress) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/inquiries/by-email?email=${encodeURIComponent(emailAddress)}`);
      const data = await response.json();
      if (data && !data.error) {
        setInquiries(data);
      }
    } catch (error) {
      console.error("お問い合わせ取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setEmail(emailInput.trim());
      fetchInquiries(emailInput.trim());
    }
  };

  const markReplyAsRead = async (replyId: string) => {
    try {
      await fetch(`/api/inquiries/replies/${replyId}/read`, {
        method: "PATCH",
      });
      // 返信を既読に更新
      setInquiries((prev) =>
        prev.map((inq) => ({
          ...inq,
          replies: inq.replies.map((reply) =>
            reply.id === replyId ? { ...reply, isRead: true } : reply
          ),
        }))
      );
      // Headerコンポーネントに未読件数の更新を通知
      window.dispatchEvent(new Event("unreadCountUpdate"));
    } catch (error) {
      console.error("既読更新エラー:", error);
    }
  };

  const handleReply = async (inquiryId: string, inquiryName: string, inquiryEmail: string) => {
    const message = replyMessages[inquiryId];
    if (!message || !message.trim()) {
      alert("メッセージを入力してください");
      return;
    }

    // 完了済みのお問い合わせには返信できない
    const inquiry = inquiries.find((inq) => inq.id === inquiryId);
    if (inquiry && inquiry.status === "resolved") {
      alert("完了済みのお問い合わせには返信できません");
      return;
    }

    setIsReplying((prev) => ({ ...prev, [inquiryId]: true }));

    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          fromType: "user",
          fromEmail: inquiryEmail,
          fromName: inquiryName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "不明なエラーが発生しました" }));
        throw new Error(errorData.error || `返信の送信に失敗しました (${response.status})`);
      }

      const data = await response.json();

      if (!data.reply) {
        throw new Error("返信データの取得に失敗しました");
      }

      // 返信を追加
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId
            ? {
                ...inq,
                replies: [...inq.replies, data.reply],
                status: inq.status === "new" ? "in_progress" : inq.status,
              }
            : inq
        )
      );

      // 返信メッセージをクリア
      setReplyMessages((prev) => ({ ...prev, [inquiryId]: "" }));

      alert("返信を送信しました");
    } catch (error) {
      console.error("返信送信エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "返信の送信に失敗しました";
      alert(errorMessage);
    } finally {
      setIsReplying((prev) => ({ ...prev, [inquiryId]: false }));
    }
  };

  const unreadCount = inquiries.reduce(
    (count, inquiry) =>
      count + inquiry.replies.filter((reply) => !reply.isRead && reply.fromType === "stylist").length,
    0
  );

  if (isLoading && !email) {
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
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">お問い合わせ履歴</span>
      </nav>

      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Inquiries</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">お問い合わせ履歴</h1>
        <p className="mt-3 text-slate-600">
          お問い合わせとスタイリストからの返信を確認できます
        </p>
      </div>

      {/* メールアドレス入力フォーム（ログインしていない場合） */}
      {!user && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">メールアドレスで確認</h2>
          <form onSubmit={handleEmailSubmit} className="flex gap-4">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="お問い合わせ時に使用したメールアドレス"
              required
              className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              確認
            </button>
          </form>
        </div>
      )}

      {/* 未読返信通知 */}
      {unreadCount > 0 && (
        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
              {unreadCount}
            </div>
            <div>
              <p className="font-semibold text-blue-900">新しい返信があります</p>
              <p className="text-sm text-blue-700">
                スタイリストから {unreadCount} 件の未読返信があります
              </p>
            </div>
          </div>
        </div>
      )}

      {/* お問い合わせ一覧 */}
      {email && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">お問い合わせ一覧</h2>
            {email && (
              <p className="text-sm text-slate-600">{email}</p>
            )}
          </div>

          {inquiries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600">お問い合わせが見つかりませんでした</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry) => {
                const unreadReplies = inquiry.replies.filter(
                  (reply) => !reply.isRead && reply.fromType === "stylist"
                ).length;

                return (
                  <div
                    key={inquiry.id}
                    className={`rounded-lg border p-4 ${
                      unreadReplies > 0
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-slate-900">{inquiry.name}</p>
                          {/* 未読返信がある場合のマーク */}
                          {unreadReplies > 0 && (
                            <span className="relative inline-flex items-center">
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
                                {unreadReplies}件の未読返信
                              </span>
                            </span>
                          )}
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
                          {inquiry.replies.length > 0 && unreadReplies === 0 && (
                            <span className="text-xs text-slate-500">
                              ({inquiry.replies.length}件の返信)
                            </span>
                          )}
                        </div>
                        {inquiry.stylist && (
                          <p className="mt-1 text-sm text-slate-600">
                            スタイリスト: {inquiry.stylist.name}
                          </p>
                        )}
                        <p className="mt-2 text-sm text-slate-900">{inquiry.message}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {new Date(inquiry.createdAt).toLocaleString("ja-JP")}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (expandedInquiry === inquiry.id) {
                            setExpandedInquiry(null);
                          } else {
                            setExpandedInquiry(inquiry.id);
                            // 未読返信を既読にする
                            const unreadReplies = inquiry.replies.filter(
                              (reply) => !reply.isRead && reply.fromType === "stylist"
                            );
                            for (const reply of unreadReplies) {
                              await markReplyAsRead(reply.id);
                            }
                            // Headerコンポーネントに未読件数の更新を通知
                            if (unreadReplies.length > 0) {
                              window.dispatchEvent(new Event("unreadCountUpdate"));
                            }
                          }
                        }}
                        className="ml-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:border-slate-900 hover:text-slate-900 transition"
                      >
                        {expandedInquiry === inquiry.id ? "閉じる" : "返信を確認"}
                      </button>
                    </div>

                    {/* 返信一覧と返信フォーム */}
                    {expandedInquiry === inquiry.id && (
                      <div className="mt-4 border-t border-slate-200 pt-4 space-y-4">
                        {/* 返信履歴 */}
                        {inquiry.replies.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-slate-900">返信履歴</h4>
                            {inquiry.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className={`rounded-lg p-3 ${
                                  reply.fromType === "stylist"
                                    ? "bg-slate-50 border border-slate-200"
                                    : "bg-blue-50 border border-blue-200"
                                } ${!reply.isRead && reply.fromType === "stylist" ? "ring-2 ring-blue-300" : ""}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-medium text-slate-700">
                                      {reply.fromType === "stylist"
                                        ? reply.fromName || "スタイリスト"
                                        : inquiry.name}
                                    </p>
                                    {!reply.isRead && reply.fromType === "stylist" && (
                                      <span className="inline-flex rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                                        新着
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {new Date(reply.createdAt).toLocaleString("ja-JP")}
                                  </p>
                                </div>
                                <p className="text-sm text-slate-900 whitespace-pre-wrap">{reply.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 返信フォーム（完了していない場合のみ表示） */}
                        {inquiry.status !== "resolved" && (
                          <div className="border-t border-slate-200 pt-4">
                            <h4 className="text-sm font-semibold text-slate-900 mb-2">返信を送信</h4>
                            <textarea
                              value={replyMessages[inquiry.id] || ""}
                              onChange={(e) =>
                                setReplyMessages((prev) => ({
                                  ...prev,
                                  [inquiry.id]: e.target.value,
                                }))
                              }
                              rows={4}
                              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                              placeholder="スタイリストへの返信メッセージを入力してください"
                            />
                            <div className="mt-2 flex items-center justify-between">
                              <p className="text-xs text-slate-500">
                                スタイリストに返信を送信します
                              </p>
                              <button
                                onClick={() => handleReply(inquiry.id, inquiry.name, inquiry.email)}
                                disabled={isReplying[inquiry.id] || !replyMessages[inquiry.id]?.trim()}
                                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isReplying[inquiry.id] ? "送信中..." : "返信を送信"}
                              </button>
                            </div>
                          </div>
                        )}

                        {inquiry.status === "resolved" && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <p className="text-sm text-slate-600">
                              このお問い合わせは完了済みです。新しいお問い合わせは
                              <Link href="/contact" className="ml-1 font-semibold text-slate-900 hover:underline">
                                こちらから
                              </Link>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">
          新しいお問い合わせは
          <Link href="/contact" className="ml-1 font-semibold text-slate-900 hover:underline">
            こちらから
          </Link>
        </p>
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  inquiryType: string;
  message: string;
  status: string;
  createdAt: string;
};

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

type Stylist = {
  id: string;
  name: string;
  nameEn?: string | null;
  bio: string;
  specialties: string[];
  image?: string | null;
  email: string;
};

export default function StylistDashboardPage() {
  const router = useRouter();
  const [stylist, setStylist] = useState<Stylist | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedInquiry, setExpandedInquiry] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [replyMessages, setReplyMessages] = useState<Record<string, string>>({});
  const [isReplying, setIsReplying] = useState<Record<string, boolean>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [editFormData, setEditFormData] = useState({
    name: "",
    nameEn: "",
    email: "",
    bio: "",
    specialties: "",
    image: "",
    password: "",
  });

  useEffect(() => {
    // スタイリスト情報を確認
    const stylistData = localStorage.getItem("stylist");
    if (!stylistData) {
      router.push("/stylist/login");
      return;
    }

    const parsed = JSON.parse(stylistData);
    setStylist(parsed);
    
    // 編集フォームの初期値を設定
    setEditFormData({
      name: parsed.name || "",
      nameEn: parsed.nameEn || "",
      email: parsed.email || "",
      bio: parsed.bio || "",
      specialties: Array.isArray(parsed.specialties) ? parsed.specialties.join(", ") : "",
      image: parsed.image || "",
      password: "",
    });

    // 自分のお問い合わせを取得
    fetch(`/api/inquiries?stylistId=${parsed.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setInquiries(data);
          // 各お問い合わせの返信を取得
          data.forEach((inquiry: Inquiry) => {
            fetchReplies(inquiry.id);
          });
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("お問い合わせ取得エラー:", error);
        setIsLoading(false);
      });

    // 未読返信の件数を取得
    fetchUnreadCount(parsed.id);
    
    // 定期的に未読件数を更新（30秒ごと）
    const interval = setInterval(() => {
      if (parsed.id) {
        fetchUnreadCount(parsed.id);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

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

  const fetchUnreadCount = async (stylistId: string) => {
    try {
      const response = await fetch(`/api/stylists/unread-replies?stylistId=${stylistId}`);
      const data = await response.json();
      if (data && !data.error) {
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("未読返信件数取得エラー:", error);
    }
  };

  const handleReply = async (inquiryId: string, inquiryEmail: string) => {
    const message = replyMessages[inquiryId];
    if (!message || !message.trim()) {
      alert("メッセージを入力してください");
      return;
    }

    if (!stylist) {
      alert("スタイリスト情報が見つかりません。再度ログインしてください。");
      router.push("/stylist/login");
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
          fromType: "stylist",
          fromEmail: stylist.email,
          fromName: stylist.name,
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
      setReplies((prev) => ({
        ...prev,
        [inquiryId]: [...(prev[inquiryId] || []), data.reply],
      }));

      // 返信メッセージをクリア
      setReplyMessages((prev) => ({ ...prev, [inquiryId]: "" }));

      // お問い合わせ一覧を更新
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId ? { ...inq, status: "in_progress" } : inq
        )
      );

      // 未読件数を更新
      if (stylist) {
        fetchUnreadCount(stylist.id);
      }

      alert("返信を送信しました");
    } catch (error) {
      console.error("返信送信エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "返信の送信に失敗しました";
      alert(errorMessage);
    } finally {
      setIsReplying((prev) => ({ ...prev, [inquiryId]: false }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("stylist");
    // カスタムイベントを発火してヘッダーを更新
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("stylistLogout"));
    }
    router.push("/stylist/login");
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
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === inquiryId ? { ...inq, status: newStatus } : inq
          )
        );
      }
    } catch (error) {
      console.error("ステータス更新エラー:", error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stylist) return;

    setIsSaving(true);
    try {
      // 専門分野を配列に変換
      const specialties = editFormData.specialties
        ? editFormData.specialties.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const response = await fetch(`/api/stylists/${stylist.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stylistId: stylist.id,
          name: editFormData.name,
          nameEn: editFormData.nameEn || null,
          email: editFormData.email,
          bio: editFormData.bio,
          specialties: specialties,
          image: editFormData.image || null,
          password: editFormData.password || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "プロフィールの更新に失敗しました");
        setIsSaving(false);
        return;
      }

      // 更新されたスタイリスト情報を保存
      const updatedStylist = data.stylist;
      localStorage.setItem("stylist", JSON.stringify(updatedStylist));
      setStylist(updatedStylist);
      // カスタムイベントを発火してヘッダーを更新
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("stylistLogin"));
      }
      setIsEditing(false);
      setEditFormData((prev) => ({ ...prev, password: "" })); // パスワードフィールドをクリア
      alert("プロフィールを更新しました");
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
      alert("プロフィールの更新に失敗しました");
    } finally {
      setIsSaving(false);
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

  if (!stylist) {
    return null;
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">スタイリストダッシュボード</h1>
          <p className="mt-2 text-slate-600">ようこそ、{stylist.name}さん</p>
        </div>
        <div className="flex items-center gap-4">
          {/* 未読返信通知 */}
          {unreadCount > 0 && (
            <Link
              href="#inquiries"
              className="relative inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-100"
            >
              <span className="relative inline-flex items-center">
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white min-w-[1.25rem]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              </span>
              <span>未読返信</span>
            </Link>
          )}
        <button
          onClick={handleLogout}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
        >
          ログアウト
        </button>
        </div>
      </div>

      {/* プロフィール情報 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">プロフィール情報</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
            >
              編集
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {stylist.image && (
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-600 mb-2">プロフィール画像</p>
                <div className="relative h-32 w-32 overflow-hidden rounded-full bg-slate-100">
                  <img
                    src={stylist.image}
                    alt={stylist.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-600">名前</p>
              <p className="mt-1 font-medium text-slate-900">{stylist.name}</p>
              {stylist.nameEn && (
                <p className="mt-1 text-sm text-slate-500">{stylist.nameEn}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-600">メールアドレス</p>
              <p className="mt-1 font-medium text-slate-900">{stylist.email}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-slate-600">自己紹介</p>
              <p className="mt-1 text-slate-900">{stylist.bio}</p>
            </div>
            {stylist.specialties && Array.isArray(stylist.specialties) && stylist.specialties.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-600">専門分野</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {stylist.specialties.map((specialty: string, index: number) => (
                    <span
                      key={index}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700 mb-2">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-slate-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

              <div>
                <label htmlFor="edit-nameEn" className="block text-sm font-medium text-slate-700 mb-2">
                  英語名
                </label>
                <input
                  id="edit-nameEn"
                  type="text"
                  value={editFormData.nameEn}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, nameEn: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                />
            </div>

            <div>
              <label htmlFor="edit-bio" className="block text-sm font-medium text-slate-700 mb-2">
                自己紹介 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="edit-bio"
                value={editFormData.bio}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, bio: e.target.value }))}
                required
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="edit-specialties" className="block text-sm font-medium text-slate-700 mb-2">
                専門分野
              </label>
              <input
                id="edit-specialties"
                type="text"
                value={editFormData.specialties}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, specialties: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="カンマ区切りで入力（例: ミニマルスタイル, ビジネスカジュアル）"
              />
            </div>

            <div>
              <label htmlFor="edit-image" className="block text-sm font-medium text-slate-700 mb-2">
                プロフィール画像URL
              </label>
              <input
                id="edit-image"
                type="url"
                value={editFormData.image}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, image: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label htmlFor="edit-password" className="block text-sm font-medium text-slate-700 mb-2">
                パスワード変更
              </label>
              <input
                id="edit-password"
                type="password"
                value={editFormData.password}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="変更する場合のみ入力"
              />
              <p className="mt-1 text-xs text-slate-500">パスワードを変更しない場合は空欄のままにしてください</p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "保存中..." : "保存"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  // フォームを元の値にリセット
                  if (stylist) {
                    setEditFormData({
                      name: stylist.name || "",
                      nameEn: stylist.nameEn || "",
                      email: stylist.email || "",
                      bio: stylist.bio || "",
                      specialties: Array.isArray(stylist.specialties) ? stylist.specialties.join(", ") : "",
                      image: stylist.image || "",
                      password: "",
                    });
                  }
                }}
                className="flex-1 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}
      </div>

      {/* お問い合わせ一覧 */}
      <div id="inquiries" className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">お問い合わせ一覧</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
              <span className="relative inline-flex items-center">
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white min-w-[1.25rem]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              </span>
              <span>未読返信あり</span>
            </span>
          )}
        </div>
        {inquiries.length === 0 ? (
          <div className="mt-4 text-center py-8">
            <p className="text-slate-600">お問い合わせはまだありません</p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className={`rounded-lg border p-4 transition ${
                  inquiry.status === "new"
                    ? "border-blue-300 bg-blue-50"
                    : inquiry.status === "in_progress"
                    ? "border-yellow-300 bg-yellow-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {inquiry.status === "new" && (
                        <span className="relative inline-flex items-center">
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                          </span>
                        </span>
                      )}
                      <p className="font-medium text-slate-900">{inquiry.name}</p>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          inquiry.status === "new"
                            ? "bg-blue-600 text-white"
                            : inquiry.status === "in_progress"
                            ? "bg-yellow-500 text-white"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {inquiry.status === "new"
                          ? "新規"
                          : inquiry.status === "in_progress"
                          ? "対応中"
                          : "完了"}
                      </span>
                      {replies[inquiry.id] && replies[inquiry.id].length > 0 && (
                        <span className="text-xs text-slate-500">
                          ({replies[inquiry.id].length}件の返信)
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{inquiry.email}</p>
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
                      onClick={async () => {
                        if (expandedInquiry === inquiry.id) {
                          setExpandedInquiry(null);
                        } else {
                          setExpandedInquiry(inquiry.id);
                          if (!replies[inquiry.id]) {
                            await fetchReplies(inquiry.id);
                          }
                          // ユーザーからの未読返信を既読にする
                          const userReplies = replies[inquiry.id]?.filter(
                            (reply) => reply.fromType === "user" && !reply.isRead
                          ) || [];
                          for (const reply of userReplies) {
                            try {
                              await fetch(`/api/inquiries/replies/${reply.id}/read`, {
                                method: "PATCH",
                              });
                              // 返信を既読に更新
                              setReplies((prev) => ({
                                ...prev,
                                [inquiry.id]: (prev[inquiry.id] || []).map((r) =>
                                  r.id === reply.id ? { ...r, isRead: true } : r
                                ),
                              }));
                            } catch (error) {
                              console.error("既読更新エラー:", error);
                            }
                          }
                          // 未読件数を更新
                          if (stylist && userReplies.length > 0) {
                            fetchUnreadCount(stylist.id);
                          }
                        }
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:border-slate-900 hover:text-slate-900 transition"
                    >
                      {expandedInquiry === inquiry.id ? "閉じる" : "返信・履歴"}
                    </button>
                  </div>
                </div>

                {/* 返信・履歴セクション */}
                {expandedInquiry === inquiry.id && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    {/* 返信履歴 */}
                    {replies[inquiry.id] && replies[inquiry.id].length > 0 && (
                      <div className="mb-4 space-y-3">
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
                                {reply.fromType === "stylist" ? "あなた" : reply.fromName || inquiry.name}
                              </p>
                                {reply.fromType === "user" && (
                                  <span className="inline-flex rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                                    ユーザーからの返信
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
                    <div>
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
                        placeholder="返信メッセージを入力してください"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          返信は {inquiry.email} に送信されます
                        </p>
                        <button
                          onClick={() => handleReply(inquiry.id, inquiry.email)}
                          disabled={isReplying[inquiry.id] || !replyMessages[inquiry.id]?.trim()}
                          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isReplying[inquiry.id] ? "送信中..." : "返信を送信"}
                        </button>
                      </div>
                    </div>
                    )}

                    {/* 完了済みメッセージ */}
                    {inquiry.status === "resolved" && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm text-slate-600">
                          このお問い合わせは完了済みです。返信はできません。
                        </p>
                      </div>
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


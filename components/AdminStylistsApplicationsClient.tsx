"use client";

import { useState } from "react";
import Link from "next/link";

type Application = {
  id: string;
  name: string;
  nameEn?: string | null;
  bio: string;
  specialties: string[];
  image?: string | null;
  email: string;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type AdminStylistsApplicationsClientProps = {
  initialApplications: Application[];
};

export default function AdminStylistsApplicationsClient( { initialApplications }: AdminStylistsApplicationsClientProps ) {
  const [applications, setApplications] = useState<Application[]>(initialApplications || []);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");

  const fetchApplications = async (nextFilterStatus: string = filterStatus) => {
    try {
      const url = nextFilterStatus === "all" 
        ? "/api/admin/stylists/applications"
        : `/api/admin/stylists/applications?status=${nextFilterStatus}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        console.error("申請取得エラー:", data.error, data.details);
        // エラーが発生した場合は空配列を設定（エラーメッセージは後で表示）
        setApplications([]);
        alert(`申請の取得に失敗しました: ${data.error}\n${data.details || ""}`);
      } else if (data && Array.isArray(data)) {
        setApplications(data);
      } else {
        setApplications([]);
      }
    //   setIsLoading(false);
    } catch (error) {
      console.error("申請取得エラー:", error);
      setApplications([]);
    //   setIsLoading(false);
    }
  };

  const handleApprove = (application: Application) => {
    setSelectedApplication(application);
    setActionType("approve");
    setNotes("");
    setShowModal(true);
  };

  const handleReject = (application: Application) => {
    setSelectedApplication(application);
    setActionType("reject");
    setNotes("");
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedApplication || !actionType) return;

    try {
      const response = await fetch(`/api/admin/stylists/applications/${selectedApplication.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: actionType,
          notes: notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "操作に失敗しました");
        return;
      }

      // 申請リストを更新
      await fetchApplications();
      setShowModal(false);
      setSelectedApplication(null);
      setActionType(null);
      setNotes("");
    } catch (error) {
      console.error("操作エラー:", error);
      alert("操作に失敗しました");
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
        <Link href="/admin/stylists" className="hover:text-slate-900">
          スタイリスト管理
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">申請一覧</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">スタイリスト登録申請</h1>
          <p className="mt-2 text-slate-600">
            スタイリスト登録申請の一覧と審査ができます
          </p>
        </div>
        <Link
          href="/admin/stylists"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
        >
          スタイリスト一覧に戻る
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700">フィルター:</label>
        <select
          value={filterStatus}
          onChange={(e) => {
            const value = e.target.value;
            setFilterStatus(value);
            fetchApplications(value);
          } }
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
        >
          <option value="all">すべて</option>
          <option value="pending">審査中</option>
          <option value="approved">承認済み</option>
          <option value="rejected">却下</option>
        </select>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-600">申請が見つかりませんでした。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div
              key={application.id}
              className="rounded-3xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    {application.image && (
                      <div className="relative h-16 w-16 overflow-hidden rounded-full bg-slate-100">
                        <img
                          src={application.image}
                          alt={application.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{application.name}</h3>
                      {application.nameEn && (
                        <p className="text-sm text-slate-500">{application.nameEn}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        application.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : application.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {application.status === "pending"
                        ? "審査中"
                        : application.status === "approved"
                        ? "承認済み"
                        : "却下"}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 mb-4">
                    <div>
                      <p className="text-sm text-slate-600">メールアドレス</p>
                      <p className="mt-1 font-medium text-slate-900">{application.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">申請日</p>
                      <p className="mt-1 text-sm text-slate-900">
                        {new Date(application.createdAt).toLocaleString("ja-JP")}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-slate-600 mb-2">自己紹介</p>
                    <p className="text-slate-900">{application.bio}</p>
                  </div>

                  {application.specialties && Array.isArray(application.specialties) && application.specialties.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 mb-2">専門分野</p>
                      <div className="flex flex-wrap gap-2">
                        {application.specialties.map((specialty: string, index: number) => (
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

                  {application.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 mb-2">メモ</p>
                      <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded-lg">{application.notes}</p>
                    </div>
                  )}
                </div>

                {application.status === "pending" && (
                  <div className="ml-6 flex flex-col gap-2">
                    <button
                      onClick={() => handleApprove(application)}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleReject(application)}
                      className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      却下
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* モーダル */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {actionType === "approve" ? "申請を承認しますか？" : "申請を却下しますか？"}
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              {selectedApplication.name}さんの申請を{actionType === "approve" ? "承認" : "却下"}します。
              {actionType === "approve" && "承認後、スタイリストとして登録され、ログイン可能になります。"}
            </p>
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                メモ（任意）
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="メモを入力（任意）"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleConfirmAction}
                className={`flex-1 rounded-full px-6 py-3 text-sm font-semibold text-white transition ${
                  actionType === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionType === "approve" ? "承認する" : "却下する"}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedApplication(null);
                  setActionType(null);
                  setNotes("");
                }}
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


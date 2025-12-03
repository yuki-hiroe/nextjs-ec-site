"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type User = {
  id: string;
  email: string;
  name: string;
  lastName?: string | null;
  firstName?: string | null;
  phone?: string | null;
  role: string;
  isSuspended: boolean;
  suspendedAt?: string | null;
  suspendedReason?: string | null;
  createdAt: string;
  newsletterSubscription?: {
    id: string;
    isActive: boolean;
  } | null;
  _count: {
    orders: number;
    inquiries: number;
  };
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuspended, setShowSuspended] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "activate" | "delete" | "update" | null>(null);
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // 管理者認証チェック
    const admin = localStorage.getItem("admin");
    if (!admin) {
      router.push("/admin/login");
      return;
    }

    fetchUsers();
  }, [router, showSuspended]);

  const fetchUsers = async () => {
    try {
      const adminData = JSON.parse(localStorage.getItem("admin") || "{}");
      const response = await fetch(
        `/api/admin/users?includeSuspended=${showSuspended}&search=${encodeURIComponent(searchTerm)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminId: adminData.id }),
        }
      );
      const data = await response.json();
      if (data && !data.error) {
        setUsers(data);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("ユーザー取得エラー:", error);
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType || !reason.trim()) {
      alert("操作理由を入力してください");
      return;
    }

    const adminData = JSON.parse(localStorage.getItem("admin") || "{}");

    setIsProcessing(true);
    try {
      let response;
      const requestBody = {
        adminId: adminData.id,
        reason: reason.trim(),
      };

      switch (actionType) {
        case "suspend":
          response = await fetch(`/api/admin/users/${selectedUser.id}/suspend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          break;
        case "activate":
          response = await fetch(`/api/admin/users/${selectedUser.id}/activate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          break;
        case "delete":
          if (!confirm(`本当にユーザー「${selectedUser.email}」を削除しますか？この操作は取り消せません。`)) {
            setIsProcessing(false);
            return;
          }
          response = await fetch(`/api/admin/users/${selectedUser.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });
          break;
        default:
          setIsProcessing(false);
          return;
      }

      const data = await response.json();
      if (response.ok) {
        alert(data.message || "操作が完了しました");
        setSelectedUser(null);
        setActionType(null);
        setReason("");
        fetchUsers();
      } else {
        alert(data.error || "操作に失敗しました");
      }
    } catch (error) {
      console.error("操作エラー:", error);
      alert("操作に失敗しました");
    } finally {
      setIsProcessing(false);
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
          <h1 className="text-3xl font-semibold text-slate-900">ユーザー管理</h1>
          <p className="mt-2 text-slate-600">ユーザーアカウントの管理</p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
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
              placeholder="メールアドレスまたは名前で検索"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            検索
          </button>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSuspended}
              onChange={(e) => setShowSuspended(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">一時停止ユーザーも表示</span>
          </label>
        </div>
      </div>

      {/* ユーザー一覧 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">ユーザー一覧 ({users.length}件)</h2>
        {users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600">ユーザーが見つかりません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">メールアドレス</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">名前</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">電話番号</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">注文数</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Newsletter</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">状態</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm text-slate-900">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.phone || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user._count.orders}</td>
                    <td className="px-4 py-3">
                      {user.newsletterSubscription ? (
                        user.newsletterSubscription.isActive ? (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            登録済み
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                            配信停止
                          </span>
                        )
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                          未登録
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.isSuspended ? (
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                          一時停止
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                          有効
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {user.isSuspended ? (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType("activate");
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:border-slate-900 hover:text-slate-900 transition"
                          >
                            有効化
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType("suspend");
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:border-slate-900 hover:text-slate-900 transition"
                          >
                            一時停止
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setActionType("delete");
                          }}
                          className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs text-red-700 hover:border-red-900 hover:text-red-900 transition"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 操作モーダル */}
      {selectedUser && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {actionType === "suspend" && "ユーザーを一時停止"}
              {actionType === "activate" && "ユーザーを有効化"}
              {actionType === "delete" && "ユーザーを削除"}
            </h3>
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">
                対象ユーザー: <span className="font-medium text-slate-900">{selectedUser.email}</span>
              </p>
              {actionType === "delete" && (
                <p className="text-sm text-red-600 mb-2">
                  警告: この操作は取り消せません。ユーザーのすべてのデータが削除されます。
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                操作理由 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="操作理由を入力してください（必須）"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAction}
                disabled={isProcessing || !reason.trim()}
                className="flex-1 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "処理中..." : "実行"}
              </button>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setActionType(null);
                  setReason("");
                }}
                disabled={isProcessing}
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-900 disabled:opacity-50"
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


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

type AuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  targetEmail: string | null;
  reason: string;
  details: any;
  performedBy: string;
  performedByEmail: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    targetType: "",
    targetEmail: "",
    performedByEmail: "",
  });
  const [total, setTotal] = useState(0);

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

    fetchLogs();
  }, [router, filters, session, status]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.action) params.append("action", filters.action);
      if (filters.targetType) params.append("targetType", filters.targetType);
      if (filters.targetEmail) params.append("targetEmail", filters.targetEmail);
      if (filters.performedByEmail) params.append("performedByEmail", filters.performedByEmail);

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data && !data.error) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("監査ログ取得エラー:", error);
      setIsLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      delete: "削除",
      suspend: "一時停止",
      activate: "有効化",
      update: "更新",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      delete: "bg-red-100 text-red-800",
      suspend: "bg-yellow-100 text-yellow-800",
      activate: "bg-emerald-100 text-emerald-800",
      update: "bg-blue-100 text-blue-800",
    };
    return colors[action] || "bg-slate-100 text-slate-800";
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
          <h1 className="text-3xl font-semibold text-slate-900">監査ログ</h1>
          <p className="mt-2 text-slate-600">管理者操作の記録 ({total}件)</p>
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
        <h2 className="text-lg font-semibold text-slate-900 mb-4">フィルター</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">操作種別</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
            >
              <option value="">すべて</option>
              <option value="delete">削除</option>
              <option value="suspend">一時停止</option>
              <option value="activate">有効化</option>
              <option value="update">更新</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">対象タイプ</label>
            <select
              value={filters.targetType}
              onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
            >
              <option value="">すべて</option>
              <option value="user">ユーザー</option>
              <option value="order">注文</option>
              <option value="product">商品</option>
              <option value="stylist">スタイリスト</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">対象メールアドレス</label>
            <input
              type="text"
              value={filters.targetEmail}
              onChange={(e) => setFilters({ ...filters, targetEmail: e.target.value })}
              placeholder="検索..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">実行者メールアドレス</label>
            <input
              type="text"
              value={filters.performedByEmail}
              onChange={(e) => setFilters({ ...filters, performedByEmail: e.target.value })}
              placeholder="検索..."
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ログ一覧 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">操作ログ</h2>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600">ログが見つかりません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-xs text-slate-500">{log.targetType}</span>
                    {log.targetEmail && (
                      <span className="text-sm text-slate-700">{log.targetEmail}</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString("ja-JP")}
                  </span>
                </div>
                <div className="mb-2">
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">理由:</span> {log.reason}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    実行者: <span className="font-medium text-slate-700">{log.performedByEmail}</span>
                  </span>
                  {log.ipAddress && (
                    <span>IP: {log.ipAddress}</span>
                  )}
                </div>
                {log.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-900">
                      詳細を表示
                    </summary>
                    <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/&/g, '&amp;')}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import Link from "next/link";

type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  name: string;
  product: {
    id: string;
    name: string;
    image: string;
    slug: string;
  } | null;
};

type Order = {
  id: string;
  orderNumber: string;
  total: number;
  shippingFee: number;
  paymentMethod: string;
  status: string;
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  city: string;
  address: string;
  building: string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  items: OrderItem[];
  _count: {
    items: number;
  };
};

type AdminOrdersClientProps = {
  initialOrders: Order[];
}

export default function AdminOrdersClient({ initialOrders }: AdminOrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);


  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data && !data.error) {
        setOrders(data);
      }
      // setIsLoading(false);
    } catch (error) {
      console.error("注文取得エラー:", error);
      // setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus || !statusReason.trim()) {
      alert("ステータスと操作理由を入力してください");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.orderNumber}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message || "注文ステータスを更新しました");
        setSelectedOrder(null);
        setNewStatus("");
        setStatusReason("");
        fetchOrders();
      } else {
        alert(data.error || "ステータスの更新に失敗しました");
      }
    } catch (error) {
      console.error("ステータス更新エラー:", error);
      alert("ステータスの更新に失敗しました");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSearch = () => {
    fetchOrders();
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "保留中",
      confirmed: "確認済み",
      shipped: "発送済み",
      completed: "完了",
      cancelled: "キャンセル",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      completed: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(price);
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
          <h1 className="text-3xl font-semibold text-slate-900">注文管理</h1>
          <p className="mt-2 text-slate-600">すべての注文を確認・管理できます</p>
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
              placeholder="注文番号、メールアドレス、お名前で検索"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
          >
            <option value="all">すべて</option>
            <option value="pending">保留中</option>
            <option value="confirmed">確認済み</option>
            <option value="shipped">発送済み</option>
            <option value="completed">完了</option>
            <option value="cancelled">キャンセル</option>
          </select>
          <button
            onClick={handleSearch}
            className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            検索
          </button>
        </div>
      </div>

      {/* 注文一覧 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          注文一覧 ({orders.length}件)
        </h2>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600">注文が見つかりません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-slate-900">
                        注文番号: {order.orderNumber}
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">お名前:</span> {order.lastName} {order.firstName}
                      </div>
                      <div>
                        <span className="font-medium">メール:</span> {order.email}
                      </div>
                      <div>
                        <span className="font-medium">電話:</span> {order.phone}
                      </div>
                      <div>
                        <span className="font-medium">支払い方法:</span> {order.paymentMethod}
                      </div>
                      <div className="sm:col-span-2">
                        <span className="font-medium">配送先:</span> 〒{order.postalCode} {order.prefecture}{order.city}{order.address}{order.building ? ` ${order.building}` : ""}
                      </div>
                      {order.user && (
                        <div className="sm:col-span-2">
                          <span className="font-medium">ユーザー:</span> {order.user.name} ({order.user.email})
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      注文日時: {new Date(order.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setNewStatus(order.status);
                        setStatusReason("");
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:border-slate-900 hover:text-slate-900 transition"
                    >
                      ステータス変更
                    </button>
                    <button
                      onClick={() => {
                        if (expandedOrder === order.id) {
                          setExpandedOrder(null);
                        } else {
                          setExpandedOrder(order.id);
                        }
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:border-slate-900 hover:text-slate-900 transition"
                    >
                      {expandedOrder === order.id ? "閉じる" : "詳細"}
                    </button>
                  </div>
                </div>

                {/* 注文詳細 */}
                {expandedOrder === order.id && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">注文内容</h4>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                        >
                          <div className="flex items-center gap-3">
                            {item.product?.image && (
                              <img
                                src={item.product.image}
                                alt={item.name}
                                className="h-16 w-16 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-slate-900">{item.name}</p>
                              <p className="text-xs text-slate-500">
                                数量: {item.quantity} × {item.price}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.price}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                      <div className="text-sm text-slate-600">
                        <p>小計: {formatPrice(order.total - order.shippingFee)}</p>
                        <p>送料: {formatPrice(order.shippingFee)}</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          合計: {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                    {order.notes && (
                      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-medium text-slate-700 mb-1">備考</p>
                        <p className="text-sm text-slate-900 whitespace-pre-wrap">{order.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ステータス変更モーダル */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              注文ステータスを変更
            </h3>
            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">
                注文番号: <span className="font-medium text-slate-900">{selectedOrder.orderNumber}</span>
              </p>
              <p className="text-sm text-slate-600 mb-2">
                現在のステータス: <span className="font-medium text-slate-900">{getStatusLabel(selectedOrder.status)}</span>
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                新しいステータス <span className="text-red-500">*</span>
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="pending">保留中</option>
                <option value="confirmed">確認済み</option>
                <option value="shipped">発送済み</option>
                <option value="completed">完了</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                操作理由 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="操作理由を入力してください（必須）"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleStatusUpdate}
                disabled={isUpdating || !newStatus || !statusReason.trim()}
                className="flex-1 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? "更新中..." : "更新"}
              </button>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setNewStatus("");
                  setStatusReason("");
                }}
                disabled={isUpdating}
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


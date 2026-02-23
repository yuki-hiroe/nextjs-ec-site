"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type EditFormData = {
  name: string;
  email: string;
  image: string;
  password: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  image: string;
};

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

type UserProfileClientProps = {
  initialProfile:{
    user: User;
    orders: Order[];
  } ;
};

export default function UserProfileClient({ initialProfile }: UserProfileClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialProfile.orders);
  const [user, setUser] = useState<User | null>(initialProfile.user);
  const { data: session, status, update } = useSession();

  useEffect(() => {
    setOrders(initialProfile.orders);
    setUser(initialProfile.user);
  }, [initialProfile]);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    image: session?.user?.image || "",
    password: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
      return;
    }

    if (!session?.user?.id) return;

    // setIsLoading(true);
    Promise.all([
      fetch(`/api/users/${session.user.id}`).then((res) => res.json()),
      fetch(`/api/orders?userId=${session.user.id}`).then((res) => res.json()),
    ])
      .then(([userData, ordersData]) => {
        if (!userData?.error && userData) {
          const formatted = { ...userData, image: userData.image || "" };
          setUser(formatted);
          setEditFormData({
            name: userData.name || "",
            email: userData.email || "",
            image: userData.image || "",
            password: "",
          });
        }
        if (!ordersData?.error && Array.isArray(ordersData)) {
          setOrders(ordersData);
        }
      })
      .catch((err) => console.error("データ取得エラー:", err))
      .finally(() => setIsLoading(false));
  }, [session?.user?.id, status, router]);

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          email: editFormData.email.trim(),
          image: editFormData.image.trim(),
          password: editFormData.password.trim(),
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        alert(data?.error || "プロフィールの更新に失敗しました");
        setIsSaving(false);
        return;
      }

      // APIは更新後のユーザーオブジェクトを直接返す（data.user ではない）
      const updateUser = data;
      setUser({
        id: updateUser.id,
        name: updateUser.name || "",
        email: updateUser.email || "",
        image: updateUser.image || "",
      });

      await update({
        ...session,
        user: {
          ...session?.user,
          name: updateUser.name,
          email: updateUser.email,
          image: updateUser.image,
        },
      });

      setIsEditing(false);
      setEditFormData((prev) => ({...prev, password: ""}));
      alert("プロフィールを更新しました");
    } catch (error) {
      setError(error instanceof Error ? error.message : "プロフィールの更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
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
      <div>
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">Profile</span>
        </nav>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            {(user?.name ?? session?.user?.name ?? "")}さんのプロフィール
          </h1>
          <p className="mt-3 text-slate-600">
            あなたのプロフィールを編集することができます。
          </p>
        </div>
      </div>
      {/* プロフィール情報 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">プロフィール情報</h2>
          {!isEditing && (
            <button
              onClick={() => {
                setEditFormData({
                  name: user?.name || session?.user?.name || "",
                  email: user?.email || session?.user?.email || "",
                  image: user?.image || session?.user?.image || "",
                  password: "",
                });
                setIsEditing(true);
              }}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900 cursor-pointer"
            >
              編集
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(user?.image ?? session?.user?.image) && (
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-600 mb-2">プロフィール画像</p>
                <div className="relative h-32 w-32 overflow-hidden rounded-full bg-slate-100">
                  <img
                    src={user?.image ?? session?.user?.image ?? ""}
                    alt={user?.name ?? session?.user?.name ?? ""}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-600">名前</p>
              <p className="mt-1 font-medium text-slate-900">{user?.name ?? session?.user?.name ?? ""}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">メールアドレス</p>
              <p className="mt-1 font-medium text-slate-900">{user?.email ?? session?.user?.email ?? ""}</p>
            </div>
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
                className="flex-1 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? "保存中..." : "保存"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  // フォームを元の値にリセット
                  if (session?.user) {
                    setEditFormData({
                      name: session?.user?.name || "",
                      email: session?.user?.email || "",
                      image: session?.user?.image || "",
                      password: "",
                    });
                  }
                }}
                className="flex-1 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-900 cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </form>
        )}
      </div>
      {/* 購入履歴を表示させる */}
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        購入履歴({orders?.length ?? 0}件)
        </h2>
      <p className="mt-2 text-slate-600">すべての購入履歴を確認できます</p>
      <div className="mt-4">
        {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600">購入履歴が見つかりません</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-500">
                      注文日時: {new Date(order.createdAt).toLocaleString("ja-JP")}
                    </p>
                    <p className="font-medium text-slate-900">{formatPrice(order.total)}</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {order.items.map((item: OrderItem) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <img
                          src={item.product?.image ?? ""}
                          alt={item.product?.name ?? ""}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-slate-900">{item.name}</p>
                          <p className="text-sm text-slate-600">
                            {item.quantity}点 × {formatPrice(Number(String(item.price).replace(/[^\d.-]/g, "")) || 0)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
    </div>
  );
}
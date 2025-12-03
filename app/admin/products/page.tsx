"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: string;
  stock: number;
  image: string;
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // 管理者認証チェック
    const admin = localStorage.getItem("admin");
    if (!admin) {
      router.push("/admin/login");
      return;
    }

    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      
      if (!response.ok) {
        throw new Error("商品の取得に失敗しました");
      }

      const data = await response.json();
      
      if (data && !data.error && Array.isArray(data)) {
        // 必要なフィールドのみを抽出
        const productsData = data.map((product: any) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          stock: product.stock,
          image: product.image,
        }));
        setProducts(productsData);
      } else {
        console.error("商品データの形式が正しくありません:", data);
        setError("商品データの取得に失敗しました");
        setProducts([]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("商品取得エラー:", error);
      setError(error instanceof Error ? error.message : "商品の取得に失敗しました");
      setProducts([]);
      setIsLoading(false);
    }
  };

  // UTF-8文字列をbase64エンコードするヘルパー関数
  const encodeToBase64 = (str: string): string => {
    if (!str) return "";
    
    try {
      // TextEncoderでUTF-8バイト配列に変換
      const encoder = new TextEncoder();
      const bytes = encoder.encode(str);
      // バイト配列を文字列に変換（ループを使用して安全に処理）
      let binaryString = "";
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      return btoa(binaryString);
    } catch (error) {
      console.error("Base64エンコードエラー:", error);
      // フォールバック: encodeURIComponentを使用してUTF-8エンコードしてからbase64
      try {
        const utf8 = encodeURIComponent(str);
        const binary = utf8.replace(/%([0-9A-F]{2})/g, (match, hex) => {
          return String.fromCharCode(parseInt(hex, 16));
        });
        return btoa(binary);
      } catch (fallbackError) {
        console.error("フォールバックエンコードエラー:", fallbackError);
        // 最終的なフォールバック: 空文字列を返す
        return "";
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`商品「${name}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      const adminData = localStorage.getItem("admin") || "";
      // base64エンコードしてヘッダーに設定（日本語対応）
      const encodedAdminData = adminData ? encodeToBase64(adminData) : "";
      
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-data": encodedAdminData,
        },
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "削除に失敗しました");
      }
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました");
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
          <h1 className="text-3xl font-semibold text-slate-900">商品管理</h1>
          <p className="mt-2 text-slate-600">商品の一覧、追加、編集、削除ができます</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
          >
            ダッシュボードに戻る
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            新規商品を追加
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {products.length === 0 && !isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-600">商品が見つかりませんでした。</p>
          <Link
            href="/admin/products/new"
            className="mt-4 inline-block rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            最初の商品を追加
          </Link>
        </div>
      ) : products.length > 0 ? (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  画像
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  商品名
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  価格
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  在庫
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-500">/{product.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{product.price}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        product.stock > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.stock}点
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-900"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 transition hover:border-red-900"
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
      ) : null}
    </div>
  );
}


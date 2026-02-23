"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ProductFormData = {
  slug: string;
  name: string;
  price: string;
  tagline: string;
  description: string;
  image: string;
  stock: string;
  shipping: string;
  care: string;
  badges: string;
  features: string;
  specs: string;
  images: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<ProductFormData>({
    slug: "",
    name: "",
    price: "",
    tagline: "",
    description: "",
    image: "",
    stock: "0",
    shipping: "",
    care: "",
    badges: "",
    features: "",
    specs: "",
    images: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // 配列フィールドをパース
      const badges = formData.badges
        ? formData.badges.split(",").map((b) => b.trim()).filter(Boolean)
        : [];
      const features = formData.features
        ? formData.features.split("\n").filter(Boolean)
        : [];
      const images = formData.images
        ? formData.images.split(",").map((i) => i.trim()).filter(Boolean)
        : [];
      
      // specsフィールドのパース（エラーハンドリング付き）
      let specs = {};
      if (formData.specs && formData.specs.trim()) {
        try {
          specs = JSON.parse(formData.specs);
        } catch (parseError) {
          throw new Error("仕様（specs）のJSON形式が正しくありません。例: {\"size\": \"M\", \"color\": \"Black\"}");
        }
      }

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: formData.slug.trim(),
          name: formData.name.trim(),
          price: formData.price.trim(),
          tagline: formData.tagline.trim(),
          description: formData.description.trim(),
          image: formData.image.trim(),
          stock: parseInt(formData.stock, 10) || 0,
          shipping: formData.shipping.trim(),
          care: formData.care.trim(),
          badges,
          features,
          images,
          specs,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "商品の追加に失敗しました");
        setIsSubmitting(false);
        return;
      }

      router.refresh();
      router.push("/admin/products");
    } catch (error) {
      setError(error instanceof Error ? error.message : "商品の追加に失敗しました");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-slate-900">新規商品を追加</h1>
        <Link
          href="/admin/products"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-900 cursor-pointer"
        >
          商品一覧に戻る
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">基本情報</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="slug"
                    required
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="product-slug"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    商品名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="商品名"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    価格 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="28,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    タグライン
                  </label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="シンプルなデザイン"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    在庫数 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    required
                    value={formData.stock}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">画像</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    メイン画像URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="image"
                    required
                    value={formData.image}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    追加画像URL（カンマ区切り）
                  </label>
                  <textarea
                    name="images"
                    value={formData.images}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">詳細情報</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    説明 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="商品の説明"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    バッジ（カンマ区切り）
                  </label>
                  <input
                    type="text"
                    name="badges"
                    value={formData.badges}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="新着, 限定, ベストセラー"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    特徴（改行区切り）
                  </label>
                  <textarea
                    name="features"
                    value={formData.features}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="特徴1&#10;特徴2&#10;特徴3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    仕様（JSON形式）
                  </label>
                  <textarea
                    name="specs"
                    value={formData.specs}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-mono focus:border-slate-900 focus:outline-none"
                    placeholder='{"size": "M", "color": "Black"}'
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    配送情報
                  </label>
                  <textarea
                    name="shipping"
                    value={formData.shipping}
                    onChange={handleInputChange}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="配送料は¥500です。"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    お手入れ方法
                  </label>
                  <textarea
                    name="care"
                    value={formData.care}
                    onChange={handleInputChange}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
                    placeholder="お手入れ方法は、洗濯機で洗濯してください。"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "追加中..." : "商品を追加"}
          </button>
          <Link
            href="/admin/products"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-900 cursor-pointer"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}


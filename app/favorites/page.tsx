"use client";

import Image from "next/image";
import Link from "next/link";
import { useFavorites } from "@/contexts/FavoritesContext";
import AddToCartButton from "@/components/AddToCartButton";

export default function FavoritesPage() {
  const { favorites, removeFromFavorites } = useFavorites();

  if (favorites.length === 0) {
    return (
      <div className="space-y-10">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">Favorites</span>
        </nav>

        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">お気に入りはまだありません</h2>
          <p className="mt-2 text-slate-600">
            気に入った商品をお気に入りに追加すると、ここに表示されます。
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            商品を見る
          </Link>
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
        <span className="text-slate-900">Favorites</span>
      </nav>

      <div>
        <h1 className="text-3xl font-semibold text-slate-900">お気に入り</h1>
        <p className="mt-2 text-slate-600">
          {favorites.length} 点の商品をお気に入りに登録しています
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {favorites.map((item) => (
          <div
            key={item.id}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <Link href={item.slug ? `/products/${item.slug}` : `/products/${item.id}`} className="block">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
              </div>
            </Link>
            <div className="mt-4">
              <Link
                href={item.slug ? `/products/${item.slug}` : `/products/${item.id}`}
                className="text-lg font-semibold text-slate-900 hover:underline"
              >
                {item.name}
              </Link>
              <p className="mt-2 text-sm font-semibold text-slate-900">{item.price}</p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <AddToCartButton
                product={{
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  image: item.image,
                  slug: item.slug,
                }}
                fullWidth={true}
              />
              <button
                onClick={() => removeFromFavorites(item.id)}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-900 hover:bg-slate-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                お気に入りから削除
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-900">もっと商品を見る</h2>
        <p className="mt-2 text-sm text-slate-600">
          新しい商品やおすすめアイテムをチェックしてみませんか？
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/products"
            className="rounded-full border border-slate-300 bg-white px-8 py-3 text-center text-sm font-semibold text-slate-900 transition hover:border-slate-900"
          >
            全商品を見る
          </Link>
          <Link
            href="/collections"
            className="rounded-full bg-slate-900 px-8 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            コレクションを見る
          </Link>
        </div>
      </div>
    </div>
  );
}


import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: string;
  tagline: string;
  badges: string[];
  image: string;
};

export const metadata: Metadata = {
  title: "商品一覧 | Intercambio",
  description: "Intercambio で取り扱う全商品をご覧いただけます。",
};

async function getProducts(): Promise<Product[]> {
  try {
    // ビルド時には直接Prismaを使用（APIサーバーが起動していないため）
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        tagline: true,
        badges: true,
        image: true,
      },
    });
    
    return products.map((product) => {
      // badgesが文字列の場合はパース、配列の場合はそのまま使用
      let badges: string[] = [];
      if (Array.isArray(product.badges)) {
        badges = product.badges.filter((b): b is string => typeof b === "string");
      } else if (typeof product.badges === 'string') {
        try {
          const parsed = JSON.parse(product.badges);
          if (Array.isArray(parsed)) {
            badges = parsed.filter((b): b is string => typeof b === "string");
          }
        } catch {
          badges = [];
        }
      }
      
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        tagline: product.tagline || "",
        badges: badges,
        image: product.image,
      };
    });
  } catch (error) {
    console.error("商品取得エラー:", error);
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <div className="space-y-10">
      <div>
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">Products</span>
        </nav>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Products
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            全商品
          </h1>
          <p className="mt-3 text-slate-600">
            国内外の独立ブランドからセレクトしたアイテムをご紹介します。
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                unoptimized
              />
            </div>
            <div className="mt-4 flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                {product.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {product.price}
              </span>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900 group-hover:underline">
              {product.name}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm text-slate-500">
              {product.tagline}
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-slate-900 group-hover:underline">
              詳細を見る
              <svg
                className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">商品が見つかりませんでした。</p>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-900">
          お探しの商品が見つからない場合
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          スタイリストにご相談いただければ、お客様に合ったアイテムをご提案いたします。
        </p>
        <Link
          href="/stylists"
          className="mt-6 inline-block rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
        >
          スタイリストに相談する
        </Link>
      </div>
    </div>
  );
}


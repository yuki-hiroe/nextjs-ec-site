import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: string;
  tagline: string;
  badges: string[];
  image: string;
  stock: number;
};

export const metadata: Metadata = {
  title: "商品一覧 | Intercambio",
  description: "Intercambio で取り扱う全商品をご覧いただけます。",
};

const formattedPrice = (price: string) => {
  const n = Number(String(price).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n.toLocaleString("ja-JP") : price;
}

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
        stock: true,
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
        price: formattedPrice(product.price),
        tagline: product.tagline || "",
        badges: badges,
        image: product.image,
        stock: product.stock ?? 0,
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
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              tagline: product.tagline,
              badges: product.badges,
              image: product.image,
            }}
            initialStock={product.stock}
            variant="list"
          />
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


import Image from "next/image";
import Link from "next/link";
import NewsletterForm from "@/components/NewsletterForm";
import { prisma } from "@/lib/prisma";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: string;
  tagline: string | null;
  badges: string[] | null;
  image: string;
};

// データベースから商品を取得してランダムに4件を選択
async function getFeaturedProducts(): Promise<Product[]> {
  try {
    // すべての商品を取得
    const allProducts = await prisma.product.findMany({
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

    if (allProducts.length === 0) {
      return [];
    }

    // badgesをパース（JSON文字列の場合は配列に変換）
    const parsedProducts = allProducts.map((product) => {
      let badges: string[] = [];
      if (product.badges) {
        if (Array.isArray(product.badges)) {
          // JsonArrayをstring[]に変換
          badges = product.badges.filter((b): b is string => typeof b === "string");
        } else if (typeof product.badges === "string") {
          try {
            const parsed = JSON.parse(product.badges);
            if (Array.isArray(parsed)) {
              badges = parsed.filter((b): b is string => typeof b === "string");
            }
          } catch {
            badges = [];
          }
        }
      }

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        tagline: product.tagline || "",
        badges,
        image: product.image,
      };
    });

    // ランダムにシャッフルして最大4件を選択
    const shuffled = [...parsedProducts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  } catch (error) {
    console.error("注目アイテム取得エラー:", error);
    return [];
  }
}

const collections = [
  { 
    title: "Everyday Essentials", 
    copy: "通勤・通学に使えるミニマルアイテム。",
    slug: "everyday-essentials"
  },
  { 
    title: "Weekend Escape", 
    copy: "旅先で活躍する軽量ギアとアクセ。",
    slug: "weekend-escape"
  },
  { 
    title: "Tech & Wellness", 
    copy: "スマートデバイスとセルフケア用品を厳選。",
    slug: "tech-wellness"
  },
];

const highlights = [
  "全国一律 ¥500 送料／¥15,000以上で送料無料",
  "14日間の返品保証とチャットサポート",
  "森林保全プロジェクトへの売上1%寄付",
];

const testimonials = [
  {
    name: "Kana",
    role: "UIデザイナー",
    comment:
      "質感が写真以上。チャットでサイズ相談できたので安心して購入できました。",
  },
  {
    name: "Shun",
    role: "Photographer",
    comment:
      "週末トリップ向けコレクションが便利。配送が早く、梱包も丁寧でした。",
  },
];

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="space-y-10">
        <section className="rounded-3xl bg-slate-900 px-6 py-12 sm:px-10 sm:py-16 text-white shadow-xl">
          <p className="text-3xl font-semibold text-white">
            日常を少し上質にする
            <span className="text-slate-300"> ミニマルセレクトショップ</span>
          </p>
          <p className="mt-4 max-w-2xl text-base text-slate-200">
            国内外の独立ブランドからセレクトしたバッグ、フットウェア、テックアクセサリをオンラインでお届けします。
          </p>
          <div className="mt-8 flex flex-col gap-3 text-sm font-semibold sm:flex-row">
            <Link
              href="/products"
              className="rounded-full bg-white px-8 py-3 text-slate-900 transition hover:bg-slate-100"
            >
              商品を見る
            </Link>
            <Link
              href="/collections"
              className="rounded-full border border-white/40 px-8 py-3 text-center text-white transition hover:border-white hover:bg-white/10"
            >
              コレクションを知る
            </Link>
          </div>
          <ul className="mt-8 flex flex-col gap-2 text-sm text-slate-300 sm:flex-row sm:items-center sm:gap-6">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Featured
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                注目アイテム
              </h2>
            </div>
            <Link href="/products" className="text-sm text-slate-500 hover:text-slate-900">
              全商品を見る →
            </Link>
          </div>
          {featuredProducts.length > 0 ? (
            <div className="mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth">
              {featuredProducts.map((product) => (
                <article
                  key={product.id}
                  className="min-w-[280px] snap-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 280px"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {product.badges && product.badges.length > 0 && (
                        <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          {product.badges[0]}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-900">{product.price}</span>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">
                    {product.name}
                  </h3>
                  <p className="mt-3 text-sm text-slate-500">{product.tagline || ""}</p>
                  <Link
                    href={`/products/${product.slug}`}
                    className="mt-6 inline-flex items-center text-sm font-semibold text-slate-900 hover:underline"
                  >
                    詳細を見る
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">商品を読み込んでいます...</p>
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-slate-50 p-6 sm:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Collections
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            シーン別コレクション
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <article
                key={collection.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {collection.title}
                </h3>
                <p className="mt-2 text-sm">{collection.copy}</p>
                <Link
                  href={`/collections/${collection.slug}`}
                  className="mt-4 inline-flex items-center text-sm font-semibold text-slate-900 hover:underline"
                >
                  コーディネートを見る
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 p-6 sm:p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
              Voices
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">お客様の声</h2>
            <div className="mt-6 space-y-6">
              {testimonials.map((testimonial) => (
                <blockquote
                  key={testimonial.name}
                  className="rounded-2xl bg-slate-50 p-5 text-slate-700"
                >
                  <p className="text-sm leading-relaxed">“{testimonial.comment}”</p>
                  <footer className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {testimonial.name} — {testimonial.role}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-slate-500 p-6 sm:p-8 text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
              Newsletter
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              限定入荷と先行セールのお知らせをお届け
            </h2>
            <p className="mt-4 text-sm text-slate-200">
              週1回の編集レターで、新作アイデアやスタイリング提案を受け取れます。
            </p>
            <NewsletterForm />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 p-6 sm:p-10 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">
            スタイリングの相談もお気軽に
          </h2>
          <p className="mt-3 text-slate-600">
            チャットでサイズ比較やコーデ提案を無料サポート。購入前の不安を解消します。
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/cart"
              className="rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              カートを確認
            </Link>
            <Link
              href="/stylists"
              className="rounded-full border border-slate-300 px-8 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-900"
            >
              スタイリストに相談
            </Link>
          </div>
        </section>
    </div>
  );
}

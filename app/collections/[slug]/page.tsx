import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Coordinate = {
  id: string;
  title: string;
  description: string;
  items: {
    id: string;
    slug: string;
    name: string;
    price: string;
    image: string;
    category: string;
  }[];
  image: string;
  occasion: string;
  season: string;
};

// 商品slugから実際の商品情報を取得
async function getProductBySlug(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        image: true,
      },
    });
    return product;
  } catch (error) {
    console.error(`商品取得エラー (slug: ${slug}):`, error);
    return null;
  }
}

type Collection = {
  title: string;
  slug: string;
  description: string;
  coordinates: Coordinate[];
};

const collections: Record<string, Collection> = {
  "everyday-essentials": {
    title: "Everyday Essentials",
    slug: "everyday-essentials",
    description: "通勤・通学に使えるミニマルアイテムで、毎日を快適に過ごすためのコーディネート",
    coordinates: [
      {
        id: "coord-1",
        title: "ビジネススタイル",
        description: "ビジネスで活躍する、上質なネクタイとビジネスシューズ",
        items: [
          {
            id: "1",
            slug: "business-necktie",
            name: "Business Necktie",
            price: "28,000",
            image: "https://isetan.scene7.com/is/image/Isetan/110072002408220322001?$VS_520$",
            category: "アクセサリー",
          },
          {
            id: "2",
            slug: "business-leather-shoes",
            name: "Business Leather Shoes",
            price: "15,000",
            image: "https://business-leather.com/wp-content/uploads/2020/12/R6U8701-min-1-1920x1280-min-e1607654101865.jpg",
            category: "フットウェア",
          },
        ],
        image: "https://www.descente.co.jp/media/wp-content/uploads/2023/01/shutterstock_1076639231.jpg",
        occasion: "オフィス・通勤",
        season: "オールシーズン",
      },
      {
        id: "coord-2",
        title: "ミニマルデイリースタイル",
        description: "シンプルで機能的なアイテムで構成された、毎日使いやすいコーディネート。",
        items: [
          {
            id: "3",
            slug: "watch",
            name: "Watch",
            price: "46,000",
            image: "https://i.anny.gift/uploads/article/image/4858/9f64ee98-97fe-42bc-b4cb-5ac7488507e0.jpeg",
            category: "アクセサリー",
          },
          {
            id: "1",
            slug: "handbag",
            name: "Handbag",
            price: "10,000",
            image: "https://thumbnail.image.rakuten.co.jp/@0_mall/vitafelice/cabinet/bag11/inb-10100p_top.jpg",
            category: "バッグ",
          },
        ],
        image: "https://image.veryweb.jp/wp-content/uploads/2024/06/78_sns_1.jpg",
        occasion: "日常・カフェ",
        season: "オールシーズン",
      },
    ],
  },
  "weekend-escape": {
    title: "Weekend Escape",
    slug: "weekend-escape",
    description: "旅先で活躍する軽量ギアとアクセサリーで、週末の冒険をより快適に。",
    coordinates: [
      {
        id: "coord-3",
        title: "トラベルスタイル",
        description: "旅行で活躍する、機能的なアイテム",
        items: [
          {
            id: "2",
            slug: "backpack",
            name: "Backpack",
            price: "28,000",
            image: "https://itemimg.goldwin.co.jp/itemimg/GDW01/A0GDW000124B/02_BC93.jpg",
            category: "バッグ",
          },
          {
            id: "3",
            slug: "mobile-battery",
            name: "Mobile Battery",
            price: "12,000",
            image: "https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQeZkACX04KA_T0BwDR5Q-fW7q6XoLwiTS4gt0uMen7oOqKqhS5T6DQ9wgUcqn5O6gcuNhBKUlQVnRx8FkBKMM8e-LAseN7mRPGojqVW3tjt27QpUAwQwGb&usqp=CAc",
            category: "アクセサリー",
          },
        ],
        image: "https://couronne-gift.com/wp-content/uploads/2025/01/How-to-Plan-the-Perfect-Weekend-Getaway.jpg",
        occasion: "旅行・アウトドア",
        season: "春夏",
      },
      {
        id: "coord-4",
        title: "シティトリップスタイル",
        description: "観光やショッピングに最適な、スタイリッシュで歩きやすいコーディネート。",
        items: [
          {
            id: "4",
            slug: "leather-boots-ankle",
            name: "Leather Boots Ankle",
            price: "32,000",
            image: "https://img.strasburgo.co.jp/img/item/STB11/STB1125F0790/STB1125F0790_zo_a130.jpg",
            category: "フットウェア",
          },
          {
            id: "1",
            slug: "knit-cardigan",
            name: "Knit Cardigan",
            price: "4,000",
            image: "https://tshop.r10s.jp/mk-house/cabinet/09259619/mkd9078-1.jpg?fitin=720%3A720",
            category: "アウター",
          },
        ],
        image: "https://sumifuku.net/wp-content/uploads/2020/08/boutique-buy-casual-935760.jpg",
        occasion: "観光・ショッピング",
        season: "オールシーズン",
      },
    ],
  },
  "tech-wellness": {
    title: "Tech & Wellness",
    slug: "tech-wellness",
    description: "スマートデバイスとセルフケア用品を厳選し、テクノロジーとウェルネスを融合したライフスタイルを提案します。",
    coordinates: [
      {
        id: "coord-5",
        title: "スマートライフスタイル",
        description: "健康管理と日常の効率化をサポートする、テクノロジーアイテムの組み合わせ。",
        items: [
          {
            id: "3",
            slug: "smart-watch",
            name: "Smart Watch",
            price: "28,000",
            image: "https://www.takashimaya.co.jp/sto/image/product/product_image_main/2120/0002302120-001.jpg",
            category: "アクセサリー",
          },
        ],
        image: "https://ideasforgood.jp/wp-content/uploads/2019/11/photo-1500904156668-758cff89dcff.jpeg",
        occasion: "日常・ワークアウト",
        season: "オールシーズン",
      },
      {
        id: "coord-6",
        title: "バランスの取れた日常",
        description: "テクノロジーと自然素材を組み合わせた、心地よい毎日のためのコーディネート。",
        items: [
          {
            id: "3",
            slug: "running-shoes",
            name: "Running Shoes",
            price: "12,000",
            image: "https://gooda.brangista.com/article/0337/images/main.jpg",
            category: "フットウェア",
          },
          {
            id: "1",
            slug: "training-wear",
            name: "Training Wear",
            price: "12,800",
            image: "https://tshop.r10s.jp/ever-green/cabinet/ssh/ssh5934a_33.jpg?fitin=720%3A720",
            category: "ウェア",
          },
        ],
        image: "https://www.nutas.jp/upload/base32_main.jpg",
        occasion: "日常・リラックス",
        season: "オールシーズン",
      },
    ],
  },
};

export async function generateStaticParams() {
  return Object.keys(collections).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = collections[slug];
  if (!collection) {
    return {
      title: "コーディネート提案 | Intercambio",
      description: "Intercambio のAI提案コーディネートをご覧いただけます。",
    };
  }
  return {
    title: `${collection.title} - コーディネート提案 | Intercambio`,
    description: collection.description,
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = collections[slug];

  if (!collection) {
    notFound();
  }

  // 商品情報を取得（実際のデータベースから取得を試みる）
  const coordinatesWithProducts = await Promise.all(
    collection.coordinates.map(async (coordinate) => {
      const itemsWithProducts = await Promise.all(
        coordinate.items.map(async (item) => {
          const product = await getProductBySlug(item.slug);
          return {
            ...item,
            image: product?.image || item.image,
            price: product?.price || item.price,
            name: product?.name || item.name,
          };
        })
      );
      return {
        ...coordinate,
        items: itemsWithProducts,
      };
    })
  );

  return (
    <div className="space-y-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/collections" className="hover:text-slate-900">
          Collections
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{collection.title}</span>
      </nav>

      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Collections</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{collection.title}</h1>
        <p className="mt-3 max-w-2xl text-slate-600">{collection.description}</p>
      </div>

      <div className="space-y-20">
        {coordinatesWithProducts.map((coordinate, index) => (
          <section
            key={coordinate.id}
            className={`space-y-6 ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
          >
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-slate-100 shadow-lg">
                <Image
                  src={coordinate.image}
                  alt={coordinate.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium uppercase tracking-[0.1em] text-slate-600">
                      {coordinate.occasion}
                    </span>
                    <span className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-medium uppercase tracking-[0.1em] text-slate-600">
                      {coordinate.season}
                    </span>
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold text-slate-900">{coordinate.title}</h2>
                  <p className="mt-3 leading-relaxed text-slate-600">{coordinate.description}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-900">
                    このコーディネートに含まれるアイテム
                  </p>
                  <div className="mt-5 space-y-3">
                    {coordinate.items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/products/${item.slug}`}
                        className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md"
                      >
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="80px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium uppercase tracking-[0.05em] text-slate-500">
                            {item.category}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">¥{item.price}</p>
                        </div>
                        <svg
                          className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-900"
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
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center sm:p-10">
        <h2 className="text-xl font-semibold text-slate-900">カスタムコーディネートのご相談</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          AI提案以外にも、スタイリストがお客様に合わせたコーディネートを無料でご提案いたします。
        </p>
        <Link
          href="/stylists"
          className="mt-6 inline-block rounded-full border border-slate-300 bg-white px-8 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-900 hover:shadow-md"
        >
          スタイリストに相談する
        </Link>
      </div>
    </div>
  );
}


import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

type Collection = {
  title: string;
  slug: string;
  description: string;
  image: string;
  coordinatesCount: number;
};

const collections: Collection[] = [
  {
    title: "Everyday Essentials",
    slug: "everyday-essentials",
    description: "通勤・通学に使えるミニマルアイテムで、毎日を快適に過ごすためのコーディネート提案です。",
    image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800&h=600&fit=crop&q=80",
    coordinatesCount: 2,
  },
  {
    title: "Weekend Escape",
    slug: "weekend-escape",
    description: "旅先で活躍する軽量ギアとアクセサリーで、週末の冒険をより快適に。",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80",
    coordinatesCount: 2,
  },
  {
    title: "Tech & Wellness",
    slug: "tech-wellness",
    description: "スマートデバイスとセルフケア用品を厳選し、テクノロジーとウェルネスを融合したライフスタイルを提案します。",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop&q=80",
    coordinatesCount: 2,
  },
];

export const metadata: Metadata = {
  title: "コレクション一覧 | Intercambio",
  description: "Intercambio のAI提案コーディネートコレクションをご覧いただけます。",
};

export default function CollectionsPage() {
  return (
    <div className="space-y-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Collections</span>
      </nav>

      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Collections</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">シーン別コレクション</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          AIが提案するシーン別コーディネートをご覧いただけます。お気に入りのスタイルを見つけて、毎日をより豊かに。
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <Link
            key={collection.slug}
            href={`/collections/${collection.slug}`}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
              <Image
                src={collection.image}
                alt={collection.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 transition-colors group-hover:text-slate-700">
                {collection.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                {collection.description}
              </p>
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">
                  {collection.coordinatesCount} コーディネート
                </span>
                <svg
                  className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-900"
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
              </div>
            </div>
          </Link>
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


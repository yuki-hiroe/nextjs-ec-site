"use client";

import Image from "next/image";
import Link from "next/link";
import { useInventory } from "@/contexts/InventoryContext";
import { useEffect } from "react";

type ProductCardProps = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: string;
    tagline: string;
    badges: string[];
    image: string;
  };
  initialStock?: number;
  /** 一覧用（コンパクト）か Featured 用か */
  variant?: "list" | "featured";
};

const formattedPrice = (price: string) => {
  const n = Number(String(price).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n.toLocaleString("ja-JP") : price;
};

export default function ProductCard({ product, initialStock = 0, variant = "list" }: ProductCardProps) {
  const { getStock, hasFetchedStock, refreshStock } = useInventory();
  const currentStock = getStock(product.id);
  const stock = hasFetchedStock(product.id) ? currentStock : initialStock;
  const isSoldOut = stock <= 0;

  useEffect(() => {
    if (product.id && !hasFetchedStock(product.id) && initialStock !== undefined) {
      refreshStock(product.id);
    }
  }, [product.id, hasFetchedStock, initialStock, refreshStock]);

  const cardContent = (
    <>
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className={`object-cover transition-transform ${!isSoldOut ? "group-hover:scale-105" : ""}`}
          sizes={variant === "featured" ? "280px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"}
          unoptimized
        />
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px]">
            <span className="rounded-full bg-white/90 px-6 py-2 text-sm font-sm tracking-widest text-slate-900">
            <span className="text-red-500 font-sm">SOLD OUT</span>
            </span>
          </div>
        )}
      </div>
      <div className={`mt-4 flex items-center justify-between gap-2 ${isSoldOut ? "opacity-70" : ""}`}>
        <div className="flex flex-wrap gap-1">
          {variant === "featured" && product.badges[0] ? (
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{product.badges[0]}</span>
          ) : (
            product.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
              >
                {badge}
              </span>
            ))
          )}
        </div>
        <span className={variant === "featured" ? "text-xs font-semibold text-slate-900" : "text-sm font-semibold text-slate-900"}>
          ¥{formattedPrice(product.price)}
        </span>
      </div>
      {variant === "featured" ? (
        <h3 className={`mt-4 text-xl font-semibold text-slate-900 ${!isSoldOut ? "group-hover:underline" : ""}`}>
          {product.name}
        </h3>
      ) : (
        <h2 className={`mt-3 text-lg font-semibold text-slate-900 ${!isSoldOut ? "group-hover:underline" : ""}`}>
          {product.name}
        </h2>
      )}
      <p className={variant === "featured" ? "mt-3 text-sm text-slate-500" : "mt-2 line-clamp-2 text-sm text-slate-500"}>
        {product.tagline}
      </p>
      {variant === "list" ? (
        <span className={`mt-4 inline-flex items-center text-sm font-semibold text-slate-900 ${!isSoldOut ? "group-hover:underline" : ""}`}>
          詳細を見る
          <svg
            className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      ) : (
        <span className={`mt-6 inline-flex items-center text-sm font-semibold text-slate-900 ${!isSoldOut ? "group-hover:underline" : ""}`}>
          詳細を見る
        </span>
      )}
    </>
  );

  const baseClasses = variant === "featured"
    ? "min-w-[280px] snap-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition"
    : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition";

  if (isSoldOut) {
    return (
      <div
        className={`${baseClasses} ${variant === "featured" ? "" : "group"}`}
        aria-label={`${product.name}（在庫切れ）`}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group block ${baseClasses} hover:-translate-y-1 hover:shadow-lg`}
    >
      {cardContent}
    </Link>
  );
}

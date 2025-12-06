import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/AddToCartButton";
import StockDisplay from "@/components/StockDisplay";
import FavoriteButton from "@/components/FavoriteButton";
import ProductImageGallery from "@/components/ProductImageGallery";

// 商品詳細ページを動的レンダリングに設定（商品更新を即座に反映するため）
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Product = {
  id: string;
  slug: string;
  name: string;
  price: string;
  tagline: string;
  description: string;
  badges: string[];
  features: string[];
  specs: { label: string; value: string }[];
  shipping: string;
  care: string;
  image: string;
  images: string[];
  stock: number;
};

async function getProduct(slug: string): Promise<Product | null> {
  try {
    // ビルド時には直接Prismaを使用（APIサーバーが起動していないため）
    const product = await prisma.product.findUnique({
      where: {
        slug: slug,
      },
    });

    if (!product) {
      return null;
    }

    // badgesを配列として処理
    let badges: string[] = [];
    if (product.badges) {
      if (Array.isArray(product.badges)) {
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

    // featuresを配列として処理
    let features: string[] = [];
    if (product.features) {
      if (Array.isArray(product.features)) {
        features = product.features.filter((f): f is string => typeof f === "string");
      } else if (typeof product.features === "string") {
        try {
          const parsed = JSON.parse(product.features);
          if (Array.isArray(parsed)) {
            features = parsed.filter((f): f is string => typeof f === "string");
          }
        } catch {
          features = [];
        }
      }
    }

    // specsを配列として処理
    let specs: { label: string; value: string }[] = [];
    if (product.specs) {
      if (Array.isArray(product.specs)) {
        specs = product.specs.filter((s): s is { label: string; value: string } => 
          typeof s === "object" && s !== null && "label" in s && "value" in s
        );
      } else if (typeof product.specs === "string") {
        try {
          const parsed = JSON.parse(product.specs);
          if (Array.isArray(parsed)) {
            specs = parsed.filter((s): s is { label: string; value: string } => 
              typeof s === "object" && s !== null && "label" in s && "value" in s
            );
          }
        } catch {
          specs = [];
        }
      }
    }

    // imagesを配列として処理（depop.comのURLのみを除外）
    let images: string[] = [];
    if (product.images) {
      if (Array.isArray(product.images)) {
        images = product.images
          .filter((img): img is string => typeof img === "string" && img.trim() !== "" && !img.includes("depop.com"))
          .map((img) => img.trim());
      } else if (typeof product.images === "string") {
        try {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed)) {
            images = parsed
              .filter((img): img is string => typeof img === "string" && img.trim() !== "" && !img.includes("depop.com"))
              .map((img) => img.trim());
          }
        } catch {
          images = [];
        }
      }
    }
    
    // メイン画像がimages配列に含まれていない場合は追加（depop.comでない限り）
    const validMainImage = product.image && !product.image.includes("depop.com") ? product.image.trim() : (product.image?.trim() || "");
    
    // メイン画像を最初に配置（重複を避ける）
    if (validMainImage) {
      // メイン画像が既にimages配列に含まれている場合は削除
      images = images.filter(img => img !== validMainImage);
      // メイン画像を最初に追加
      images = [validMainImage, ...images];
    }

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      tagline: product.tagline || "",
      description: product.description || "",
      badges,
      features,
      specs,
      shipping: product.shipping || "",
      care: product.care || "",
      image: product.image, // 元の画像を使用（depop.comの場合はエラーハンドリングで対応）
      images,
      stock: product.stock,
    };
  } catch (error) {
    console.error("商品取得エラー:", error);
    return null;
  }
}

// generateStaticParamsは削除（動的レンダリングのため）

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) {
    return {
      title: "商品詳細 | Intercambio",
      description: "Intercambio で取り扱う商品の詳細ページです。",
    };
  }
  return {
    title: `${product.name} | Intercambio`,
    description: product.tagline,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // slugのバリデーション
  if (!slug || typeof slug !== "string" || slug.trim() === "") {
    notFound();
  }
  
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-slate-900">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{product.name}</span>
      </nav>

      <section className="grid gap-10 lg:grid-cols-2">
        <ProductImageGallery
          mainImage={product.image}
          images={product.images || []}
          productName={product.name}
        />

        <div className="space-y-6">
          {product.badges && Array.isArray(product.badges) && product.badges.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
              {product.badges.map((badge) => (
                <span key={badge} className="rounded-full border border-slate-300 px-3 py-1">
                  {badge}
                </span>
              ))}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
            <p className="mt-2 text-slate-600">{product.tagline}</p>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{product.price}</p>
          <div className="flex items-center gap-2">
            <StockDisplay productId={product.id} initialStock={product.stock} />
          </div>
          <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
          <div className="flex flex-wrap gap-3">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                slug: product.slug,
                stock: product.stock,
              }}
            />
            <FavoriteButton
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                slug: product.slug,
              }}
            />
          </div>
          {product.features && Array.isArray(product.features) && product.features.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900">特徴</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                {product.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {product.specs && Array.isArray(product.specs) && product.specs.length > 0 && (
          <div className="rounded-3xl border border-slate-200 p-8">
            <h3 className="text-lg font-semibold text-slate-900">仕様</h3>
            <dl className="mt-4 divide-y divide-slate-100 text-sm text-slate-600">
              {product.specs.map((spec) => (
                <div key={spec.label} className="flex items-center justify-between py-3">
                  <dt className="font-medium text-slate-500">{spec.label}</dt>
                  <dd className="text-right text-slate-900">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <div className="space-y-6 rounded-3xl border border-slate-200 p-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">配送について</h3>
            <p className="mt-2 text-sm text-slate-600">{product.shipping}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">お手入れ</h3>
            <p className="mt-2 text-sm text-slate-600">{product.care}</p>
          </div>
        </div>
      </section>

    </div>
  );
}

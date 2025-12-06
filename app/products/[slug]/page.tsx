import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/AddToCartButton";
import StockDisplay from "@/components/StockDisplay";
import FavoriteButton from "@/components/FavoriteButton";
import ProductImageGallery from "@/components/ProductImageGallery";

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
  relatedProducts?: Array<{
    product?: {
      id: string;
      slug: string;
      name: string;
      price: string;
      image: string;
      tagline: string;
      badges: string[];
    };
    related?: {
      id: string;
      slug: string;
      name: string;
      price: string;
      image: string;
      tagline: string;
      badges: string[];
    };
  }>;
};

async function getProduct(slug: string): Promise<Product | null> {
  try {
    // ビルド時には直接Prismaを使用（APIサーバーが起動していないため）
    const product = await prisma.product.findUnique({
      where: {
        slug: slug,
      },
      include: {
        relatedProducts: {
          include: {
            related: {
              select: {
                id: true,
                slug: true,
                name: true,
                price: true,
                image: true,
                tagline: true,
                badges: true,
              },
            },
            product: {
              select: {
                id: true,
                slug: true,
                name: true,
                price: true,
                image: true,
                tagline: true,
                badges: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
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

    // 有効な画像URLかどうかをチェックする関数
    const isValidImageUrl = (url: string): boolean => {
      if (!url || typeof url !== "string" || url.trim() === "") {
        return false;
      }
      
      try {
        const urlObj = new URL(url);
        // 無効なドメインをフィルタリング
        const invalidDomains = ["depop.com", "mediaphotos.depop.com"];
        const hostname = urlObj.hostname.toLowerCase();
        
        if (invalidDomains.some(domain => hostname.includes(domain))) {
          return false;
        }
        
        // HTTPSまたはHTTPプロトコルのみ許可
        return urlObj.protocol === "https:" || urlObj.protocol === "http:";
      } catch {
        return false;
      }
    };

    // imagesを配列として処理
    let images: string[] = [];
    if (product.images) {
      if (Array.isArray(product.images)) {
        images = product.images
          .filter((img): img is string => typeof img === "string" && img.trim() !== "")
          .map((img) => img.trim())
          .filter((img) => isValidImageUrl(img));
      } else if (typeof product.images === "string") {
        try {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed)) {
            images = parsed
              .filter((img): img is string => typeof img === "string" && img.trim() !== "")
              .map((img) => img.trim())
              .filter((img) => isValidImageUrl(img));
          }
        } catch {
          images = [];
        }
      }
    }
    
    // メイン画像が有効な場合のみ追加
    const validMainImage = isValidImageUrl(product.image) ? product.image : "";
    if (images.length === 0 && validMainImage) {
      images = [validMainImage];
    } else if (validMainImage && !images.includes(validMainImage)) {
      images = [validMainImage, ...images];
    }

    // relatedProductsを処理
    const relatedProducts: Array<{
      product?: {
        id: string;
        slug: string;
        name: string;
        price: string;
        image: string;
        tagline: string;
        badges: string[];
      };
      related?: {
        id: string;
        slug: string;
        name: string;
        price: string;
        image: string;
        tagline: string;
        badges: string[];
      };
    }> = product.relatedProducts?.map((rel) => {
      const result: {
        product?: {
          id: string;
          slug: string;
          name: string;
          price: string;
          image: string;
          tagline: string;
          badges: string[];
        };
        related?: {
          id: string;
          slug: string;
          name: string;
          price: string;
          image: string;
          tagline: string;
          badges: string[];
        };
      } = {};

      // productの処理
      if (rel.product) {
        let productBadges: string[] = [];
        if (rel.product.badges) {
          if (Array.isArray(rel.product.badges)) {
            productBadges = rel.product.badges.filter((b): b is string => typeof b === "string");
          } else if (typeof rel.product.badges === "string") {
            try {
              const parsed = JSON.parse(rel.product.badges);
              if (Array.isArray(parsed)) {
                productBadges = parsed.filter((b): b is string => typeof b === "string");
              }
            } catch {
              productBadges = [];
            }
          }
        }
        result.product = {
          id: rel.product.id,
          slug: rel.product.slug,
          name: rel.product.name,
          price: rel.product.price,
          image: rel.product.image,
          tagline: rel.product.tagline || "",
          badges: productBadges,
        };
      }

      // relatedの処理
      if (rel.related) {
        let relatedBadges: string[] = [];
        if (rel.related.badges) {
          if (Array.isArray(rel.related.badges)) {
            relatedBadges = rel.related.badges.filter((b): b is string => typeof b === "string");
          } else if (typeof rel.related.badges === "string") {
            try {
              const parsed = JSON.parse(rel.related.badges);
              if (Array.isArray(parsed)) {
                relatedBadges = parsed.filter((b): b is string => typeof b === "string");
              }
            } catch {
              relatedBadges = [];
            }
          }
        }
        result.related = {
          id: rel.related.id,
          slug: rel.related.slug,
          name: rel.related.name,
          price: rel.related.price,
          image: rel.related.image,
          tagline: rel.related.tagline || "",
          badges: relatedBadges,
        };
      }

      return result;
    }) || [];

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
      image: validMainImage || product.image, // 有効なメイン画像を使用、なければ元の画像
      images,
      stock: product.stock,
      relatedProducts,
    };
  } catch (error) {
    console.error("商品取得エラー:", error);
    return null;
  }
}

async function getAllProducts(): Promise<Array<{ slug: string }>> {
  try {
    // ビルド時には直接Prismaを使用（APIサーバーが起動していないため）
    const products = await prisma.product.findMany({
      select: {
        slug: true,
      },
    });
    return products;
  } catch (error) {
    console.error("商品一覧取得エラー:", error);
    return [];
  }
}

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({ slug: product.slug }));
}

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

  const relatedProducts = product.relatedProducts || [];

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

      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Recommended</p>
              <h3 className="text-2xl font-semibold text-slate-900">合わせて見られている商品</h3>
            </div>
            <Link href="/products" className="text-sm text-slate-500 hover:text-slate-900">
              全商品を見る →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {relatedProducts
              .map((rel) => {
                // rel.product または rel.related のどちらかを使用
                const item = rel.product || rel.related;
                // itemが存在し、必要なプロパティがあることを確認
                if (!item || typeof item !== 'object' || !item.slug || !item.image || !item.name) {
                  return null;
                }
                // imageが文字列であることを確認
                if (typeof item.image !== 'string' || item.image.trim() === '') {
                  return null;
                }
                return (
                  <article
                    key={item.slug}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-slate-100">
                      <Image
                        src={item.image}
                        alt={item.name || "商品画像"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                      />
                    </div>
                    {item.badges && Array.isArray(item.badges) && item.badges.length > 0 && (
                      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">
                        {item.badges[0]}
                      </p>
                    )}
                    <h4 className="mt-2 text-lg font-semibold text-slate-900">{item.name}</h4>
                    {item.tagline && (
                      <p className="mt-1 text-sm text-slate-500">{item.tagline}</p>
                    )}
                    <p className="mt-3 text-sm font-semibold text-slate-900">{item.price}</p>
                    <Link href={`/products/${item.slug}`} className="mt-3 inline-flex text-sm font-semibold text-slate-900 hover:underline">
                      詳細を見る
                    </Link>
                  </article>
                );
              })
              .filter(Boolean)}
          </div>
        </section>
      )}
    </div>
  );
}

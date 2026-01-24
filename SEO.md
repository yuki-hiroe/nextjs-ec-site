# SEO対策ドキュメント

このドキュメントでは、IntercambioアプリケーションのSEO対策の実装について説明します。

## 📋 目次

1. [実装されているSEO対策](#実装されているseo対策)
2. [各ページのメタデータ実装](#各ページのメタデータ実装)
3. [不足しているSEO対策](#不足しているseo対策)
4. [推奨される改善点](#推奨される改善点)

---

## 実装されているSEO対策

### 1. 基本メタデータ（Title & Description）

**実装場所**: 各ページの `page.tsx` ファイル

#### ルートレイアウト（`app/layout.tsx`）

```typescript
export const metadata: Metadata = {
  title: "Intercambio",
  description: "日常を少し上質にするミニマルセレクトショップ",
};
```

**特徴**:
- ✅ デフォルトのタイトルと説明文を設定
- ✅ 各ページで個別にメタデータを上書き可能

#### ホームページ（`app/page.tsx`）

- ルートレイアウトのメタデータを継承

#### 商品一覧ページ（`app/products/page.tsx`）

```typescript
export const metadata: Metadata = {
  title: "商品一覧 | Intercambio",
  description: "Intercambio で取り扱う全商品をご覧いただけます。",
};
```

#### 商品詳細ページ（`app/products/[slug]/page.tsx`）

```typescript
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
```

**特徴**:
- ✅ 動的に商品名をタイトルに含める
- ✅ 商品のタグラインを説明文として使用

#### コレクションページ（`app/collections/[slug]/page.tsx`）

```typescript
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
```

#### スタイリスト詳細ページ（`app/stylists/[id]/page.tsx`）

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const stylist = await prisma.stylist.findUnique({
    where: { id },
    select: { name: true, nameEn: true },
  });

  if (!stylist) {
    return {
      title: "スタイリストが見つかりません | Intercambio",
    };
  }

  return {
    title: `${stylist.name} | スタイリスト | Intercambio`,
    description: `${stylist.name}のプロフィールページです。`,
  };
}
```

---

### 2. セマンティックHTML

**実装場所**: すべてのページコンポーネント

**使用されている要素**:
- ✅ `<html lang="ja">` - 言語指定
- ✅ `<h1>`, `<h2>`, `<h3>` - 見出しタグの階層構造
- ✅ `<nav>` - ナビゲーション
- ✅ `<main>` - メインコンテンツ
- ✅ `<article>` - 記事コンテンツ（商品カード等）
- ✅ `<section>` - セクション
- ✅ `<header>`, `<footer>` - ヘッダー・フッター（コンポーネント）

**例**: `app/page.tsx`

```tsx
<section className="rounded-3xl bg-slate-900...">
  <h2 className="text-2xl font-semibold text-slate-900">注目アイテム</h2>
  {featuredProducts.map((product) => (
    <article key={product.id} className="...">
      <h3 className="mt-4 text-xl font-semibold text-slate-900">
        {product.name}
      </h3>
    </article>
  ))}
</section>
```

---

### 3. 画像のalt属性

**実装場所**: すべての `<Image>` コンポーネント

**例**: `app/page.tsx`

```tsx
<Image
  src={product.image}
  alt={product.name}  // ✅ alt属性を設定
  fill
  className="object-cover..."
/>
```

**例**: `app/products/[slug]/page.tsx`

```tsx
<Image
  src={stylistData.image}
  alt={stylistData.name || "スタイリスト"}  // ✅ フォールバックあり
  fill
/>
```

**特徴**:
- ✅ すべての画像にalt属性を設定
- ✅ 商品名やスタイリスト名など、意味のあるテキストを使用
- ✅ フォールバック値も設定

---

### 4. パンくずリスト

**実装場所**: 各詳細ページ

**例**: `app/products/[slug]/page.tsx`

```tsx
<nav className="text-sm text-slate-500">
  <Link href="/" className="hover:text-slate-900">Home</Link>
  <span className="mx-2">/</span>
  <Link href="/products" className="hover:text-slate-900">Products</Link>
  <span className="mx-2">/</span>
  <span className="text-slate-900">{product.name}</span>
</nav>
```

**特徴**:
- ✅ セマンティックな `<nav>` 要素を使用
- ✅ 階層構造を明確に表示
- ✅ リンクでナビゲーション可能

---

### 5. URL構造

**実装場所**: ファイルベースのルーティング（Next.js App Router）

**URL構造**:
- `/` - ホームページ
- `/products` - 商品一覧
- `/products/[slug]` - 商品詳細（スラッグベース）
- `/collections/[slug]` - コレクション詳細
- `/stylists/[id]` - スタイリスト詳細

**特徴**:
- ✅ クリーンなURL構造
- ✅ スラッグベースのURL（商品詳細）
- ✅ 階層的なURL構造

---

## 各ページのメタデータ実装

### 実装されているページ

| ページ | ファイル | メタデータ実装 |
|--------|----------|----------------|
| ホーム | `app/page.tsx` | ルートレイアウトを継承 |
| 商品一覧 | `app/products/page.tsx` | ✅ 実装済み |
| 商品詳細 | `app/products/[slug]/page.tsx` | ✅ 動的メタデータ |
| コレクション一覧 | `app/collections/page.tsx` | 要確認 |
| コレクション詳細 | `app/collections/[slug]/page.tsx` | ✅ 動的メタデータ |
| スタイリスト一覧 | `app/stylists/page.tsx` | 要確認 |
| スタイリスト詳細 | `app/stylists/[id]/page.tsx` | ✅ 動的メタデータ |

---

## 不足しているSEO対策

### 🔴 重要度: 高

#### 1. Open Graph（OG）タグ

**現状**: 未実装

**必要な実装**:
```typescript
export const metadata: Metadata = {
  openGraph: {
    title: "Intercambio",
    description: "日常を少し上質にするミニマルセレクトショップ",
    url: "https://intercambio.example.com",
    siteName: "Intercambio",
    images: [
      {
        url: "https://intercambio.example.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Intercambio",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
};
```

**推奨ファイル**: `app/layout.tsx`（デフォルト）、各ページで個別設定

---

#### 2. Twitter Card

**現状**: 未実装

**必要な実装**:
```typescript
export const metadata: Metadata = {
  twitter: {
    card: "summary_large_image",
    title: "Intercambio",
    description: "日常を少し上質にするミニマルセレクトショップ",
    images: ["https://intercambio.example.com/twitter-image.jpg"],
  },
};
```

**推奨ファイル**: `app/layout.tsx`（デフォルト）、各ページで個別設定

---

#### 3. 構造化データ（JSON-LD）

**現状**: 未実装

**必要な実装例**:

**商品詳細ページ** (`app/products/[slug]/page.tsx`):
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "image": product.image,
      "offers": {
        "@type": "Offer",
        "price": product.price.replace(/[^0-9]/g, ""),
        "priceCurrency": "JPY",
        "availability": product.stock > 0 
          ? "https://schema.org/InStock" 
          : "https://schema.org/OutOfStock",
      },
    }),
  }}
/>
```

**組織情報** (`app/layout.tsx`):
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Intercambio",
      "url": "https://intercambio.example.com",
      "logo": "https://intercambio.example.com/logo.png",
    }),
  }}
/>
```

**推奨ファイル**: 
- `app/layout.tsx` - 組織情報
- `app/products/[slug]/page.tsx` - 商品情報
- `app/page.tsx` - ウェブサイト情報

---

#### 4. sitemap.xml

**現状**: 未実装

**必要な実装**: `app/sitemap.ts` または `app/sitemap.xml`

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://intercambio.example.com'
  
  // 商品を取得
  const products = await prisma.product.findMany({
    select: { slug: true, updatedAt: true },
  })
  
  // スタイリストを取得
  const stylists = await prisma.stylist.findMany({
    where: { isActive: true },
    select: { id: true, updatedAt: true },
  })
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
    ...stylists.map((stylist) => ({
      url: `${baseUrl}/stylists/${stylist.id}`,
      lastModified: stylist.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
  ]
}
```

---

#### 5. robots.txt

**現状**: 未実装

**必要な実装**: `app/robots.ts` または `app/robots.txt`

```typescript
// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout/', '/cart/'],
      },
    ],
    sitemap: 'https://intercambio.example.com/sitemap.xml',
  }
}
```

---

### 🟡 重要度: 中

#### 6. カノニカルURL

**現状**: 未実装

**必要な実装**:
```typescript
export const metadata: Metadata = {
  alternates: {
    canonical: "https://intercambio.example.com/products/example-product",
  },
};
```

**推奨ファイル**: 各ページの `generateMetadata` 関数

---

#### 7. メタデータの拡張

**現状**: title と description のみ

**推奨される追加項目**:
- `keywords` - キーワード（非推奨だが、一部の検索エンジンで使用）
- `authors` - 著者情報
- `creator` - 作成者情報
- `publisher` - 発行者情報
- `robots` - インデックス制御

---

## 推奨される改善点

### 優先度: 高

1. **Open Graphタグの実装**
   - [ ] ルートレイアウトにデフォルトOGタグを追加
   - [ ] 商品詳細ページに商品画像を含むOGタグを追加
   - [ ] コレクションページにOGタグを追加

2. **Twitter Cardの実装**
   - [ ] ルートレイアウトにデフォルトTwitter Cardを追加
   - [ ] 商品詳細ページにTwitter Cardを追加

3. **構造化データ（JSON-LD）の実装**
   - [ ] 組織情報（Organization）
   - [ ] 商品情報（Product）
   - [ ] ウェブサイト情報（WebSite）
   - [ ] パンくずリスト（BreadcrumbList）

4. **sitemap.xmlの実装**
   - [ ] 動的sitemapの生成
   - [ ] 商品、スタイリスト、コレクションを含める

5. **robots.txtの実装**
   - [ ] 管理者ページとAPIのクロール禁止
   - [ ] sitemap.xmlへの参照

### 優先度: 中

6. **カノニカルURLの実装**
   - [ ] 各ページにカノニカルURLを設定

7. **メタデータの拡張**
   - [ ] より詳細なメタデータを追加
   - [ ] 商品ページに価格情報を含める

8. **パフォーマンス最適化**
   - [ ] 画像の最適化（現在 `unoptimized: true`）
   - [ ] 遅延読み込みの実装確認

### 優先度: 低

9. **その他**
   - [ ] 多言語対応（hreflangタグ）
   - [ ] AMP対応（必要に応じて）
   - [ ] RSSフィードの実装

---

## 実装例

### 商品詳細ページの完全なメタデータ実装例

```typescript
// app/products/[slug]/page.tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  
  if (!product) {
    return {
      title: "商品詳細 | Intercambio",
      description: "Intercambio で取り扱う商品の詳細ページです。",
    };
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://intercambio.example.com';
  const productUrl = `${baseUrl}/products/${slug}`;
  const productImage = product.image.startsWith('http') 
    ? product.image 
    : `${baseUrl}${product.image}`;
  
  return {
    title: `${product.name} | Intercambio`,
    description: product.tagline || product.description,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      title: `${product.name} | Intercambio`,
      description: product.tagline || product.description,
      url: productUrl,
      siteName: "Intercambio",
      images: [
        {
          url: productImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Intercambio`,
      description: product.tagline || product.description,
      images: [productImage],
    },
  };
}
```

---

## 参考資料

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)

---

**最終更新**: 2026年1月19日

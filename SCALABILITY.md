# スケーラビリティ対策まとめ

## 概要

このプロジェクトのスケーラビリティ対策の現状と改善提案をまとめます。

---

## ✅ 実装されている対策

### 1. データベース接続プーリング

**実装箇所**: `lib/prisma.ts`

```typescript
// PrismaClientのシングルトンパターン
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**効果**:
- ✅ サーバーレス環境での接続プーリング最適化
- ✅ 開発環境での接続再利用
- ✅ 接続数の制御

**評価**: ⭐⭐⭐⭐⭐ 良好

---

### 2. データベースインデックス

**実装箇所**: `prisma/schema.prisma`

主要な検索・フィルタリング用にインデックスを設定：

```prisma
model User {
  @@index([email])
  @@index([role])
  @@index([isSuspended])
}

model Order {
  @@index([orderNumber])
  @@index([email])
  @@index([status])
  @@index([userId])
}

model AuditLog {
  @@index([action])
  @@index([targetType])
  @@index([targetId])
  @@index([targetEmail])
  @@index([performedBy])
  @@index([performedByEmail])
  @@index([createdAt])
}
```

**効果**:
- ✅ クエリパフォーマンスの向上
- ✅ 検索・フィルタリングの高速化

**評価**: ⭐⭐⭐⭐⭐ 良好

---

### 3. ページネーション（一部実装）

**実装箇所**: `app/api/admin/audit-logs/route.ts`

```typescript
const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100") || 100, 1), 1000);
const offset = Math.max(parseInt(searchParams.get("offset") || "0") || 0, 0);

const [logs, total] = await Promise.all([
  prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,    // ← ページネーション
    skip: offset,   // ← ページネーション
  }),
  prisma.auditLog.count({ where }),
]);
```

**効果**:
- ✅ 大量データの分割取得
- ✅ メモリ使用量の削減

**評価**: ⭐⭐⭐ 一部のみ実装（改善の余地あり）

---

### 4. 並列処理（Promise.all）

**実装箇所**: 複数のAPI Routes

```typescript
// app/api/admin/stats/route.ts
const [products, orders, inquiries, stylists, pendingApplications, approvedTestimonials] = 
  await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.inquiry.count(),
    prisma.stylist.count({ where: { isActive: true } }),
    prisma.stylistApplication.count({ where: { status: "pending" } }),
    prisma.testimonial.count({ where: { isApproved: true } }),
  ]);
```

**効果**:
- ✅ 複数クエリの並列実行
- ✅ レスポンス時間の短縮

**評価**: ⭐⭐⭐⭐ 良好

---

### 5. 入力検証とリミット

**実装箇所**: `app/api/admin/audit-logs/route.ts`

```typescript
// limit と offset の検証（1-1000の範囲）
const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100") || 100, 1), 1000);
const offset = Math.max(parseInt(searchParams.get("offset") || "0") || 0, 0);
```

**効果**:
- ✅ DoS攻撃の防止
- ✅ データベース負荷の制御

**評価**: ⭐⭐⭐⭐ 良好（一部のみ実装）

---

### 6. クエリ最適化（select指定）

**実装箇所**: 複数のAPI Routes

```typescript
// 必要なフィールドのみ取得
const products = await prisma.product.findMany({
  select: {
    id: true,
    slug: true,
    name: true,
    price: true,
    // 必要なフィールドのみ
  },
});
```

**効果**:
- ✅ ネットワーク転送量の削減
- ✅ メモリ使用量の削減

**評価**: ⭐⭐⭐⭐ 良好

---

## ⚠️ 改善が必要な対策

### 1. ページネーションの不足

**問題箇所**: 複数のAPI Routes

#### 問題のあるAPI

```typescript
// app/api/products/route.ts
// ❌ 全件取得（ページネーションなし）
const products = await prisma.product.findMany({
  orderBy: { createdAt: "desc" },
});

// app/api/admin/orders/route.ts
// ⚠️ 固定で100件のみ（ページネーションなし）
const orders = await prisma.order.findMany({
  take: 100,  // 固定値
});
```

**推奨改善**:

```typescript
// ページネーションを追加
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20") || 20, 100);
  const offset = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count(),
  ]);

  return NextResponse.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

**優先度**: 🔴 高

---

### 2. キャッシュ戦略の不足

**問題**: Next.jsのキャッシュ機能を活用していない

#### 現在の実装

```typescript
// app/page.tsx
// ❌ キャッシュなし（毎回データベースアクセス）
async function getFeaturedProducts() {
  const allProducts = await prisma.product.findMany({ ... });
}

// app/products/[slug]/page.tsx
// ⚠️ force-dynamic（キャッシュ無効化）
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

**推奨改善**:

```typescript
// 1. ISR（Incremental Static Regeneration）の活用
export const revalidate = 3600; // 1時間ごとに再生成

// 2. データフェッチのキャッシュ
async function getFeaturedProducts() {
  const products = await prisma.product.findMany({
    // ...
  });
  return products;
}

// 3. React Cacheの活用
import { cache } from 'react';

const getCachedProducts = cache(async () => {
  return await prisma.product.findMany({ ... });
});
```

**優先度**: 🟡 中

---

### 3. レート制限の未実装

**問題**: APIエンドポイントにレート制限がない

**推奨改善**:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

// app/api/products/route.ts
export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "リクエストが多すぎます" },
      { status: 429 }
    );
  }
  
  // ...
}
```

**優先度**: 🟡 中

---

### 4. 画像最適化の無効化

**問題箇所**: `next.config.ts`

```typescript
images: {
  unoptimized: true, // ❌ 画像最適化が無効
}
```

**推奨改善**:

```typescript
images: {
  unoptimized: false, // 画像最適化を有効化
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

**優先度**: 🟡 中

---

### 5. ポーリングの非効率性

**問題箇所**: `app/inquiries/page.tsx`

```typescript
// ❌ 5秒ごとに全データを取得
const checkIntervalRef = setInterval(checkNewReplies, 5000);
```

**推奨改善**:

```typescript
// 1. Server-Sent Events (SSE) の使用
// 2. WebSocketの使用
// 3. ポーリング間隔の最適化（30秒など）
// 4. 差分取得APIの実装
```

**優先度**: 🟢 低（現状でも動作するが、改善の余地あり）

---

### 6. 全件取得の問題

**問題箇所**: 複数のAPI Routes

```typescript
// app/api/products/route.ts
// ❌ 全商品を一度に取得
const products = await prisma.product.findMany({ ... });

// app/page.tsx
// ❌ 全商品を取得してからランダムに4件選択
const allProducts = await prisma.product.findMany({ ... });
```

**推奨改善**:

```typescript
// 1. データベース側でランダム取得
const products = await prisma.$queryRaw`
  SELECT * FROM "Product" 
  ORDER BY RANDOM() 
  LIMIT 4
`;

// 2. ページネーションの実装
// 3. キャッシュの活用
```

**優先度**: 🟡 中

---

### 7. N+1クエリ問題の可能性

**問題**: リレーションを含むクエリでN+1が発生する可能性

**確認が必要な箇所**:

```typescript
// app/api/admin/orders/route.ts
const orders = await prisma.order.findMany({
  include: {
    user: { ... },
    items: {
      include: {
        product: { ... },  // ← リレーションが深い
      },
    },
  },
});
```

**推奨改善**:

```typescript
// 1. selectで必要なフィールドのみ取得
// 2. クエリの最適化
// 3. データローダーパターンの導入
```

**優先度**: 🟡 中

---

## 📊 スケーラビリティ対策の評価

| 対策 | 実装状況 | 評価 | 優先度 |
|------|---------|------|--------|
| **データベース接続プーリング** | ✅ 実装済み | ⭐⭐⭐⭐⭐ | - |
| **データベースインデックス** | ✅ 実装済み | ⭐⭐⭐⭐⭐ | - |
| **ページネーション** | ⚠️ 一部のみ | ⭐⭐⭐ | 🔴 高 |
| **並列処理（Promise.all）** | ✅ 実装済み | ⭐⭐⭐⭐ | - |
| **入力検証とリミット** | ⚠️ 一部のみ | ⭐⭐⭐ | 🔴 高 |
| **クエリ最適化（select）** | ✅ 実装済み | ⭐⭐⭐⭐ | - |
| **キャッシュ戦略** | ❌ 未実装 | ⭐⭐ | 🟡 中 |
| **レート制限** | ❌ 未実装 | ⭐ | 🟡 中 |
| **画像最適化** | ❌ 無効化 | ⭐⭐ | 🟡 中 |
| **リアルタイム更新** | ⚠️ ポーリング | ⭐⭐ | 🟢 低 |
| **全件取得の回避** | ⚠️ 一部で問題 | ⭐⭐⭐ | 🟡 中 |

---

## 🎯 推奨される改善の優先順位

### 優先度: 高 🔴

1. **ページネーションの実装**
   - `/api/products` にページネーションを追加
   - `/api/admin/orders` にページネーションを追加
   - その他の一覧取得APIにページネーションを追加

2. **入力検証とリミットの統一**
   - すべてのAPI Routesでリミットを実装
   - 入力検証の統一

### 優先度: 中 🟡

3. **キャッシュ戦略の実装**
   - ISR（Incremental Static Regeneration）の活用
   - React Cacheの活用
   - データフェッチのキャッシュ

4. **レート制限の実装**
   - API Routesにレート制限を追加
   - Upstash Redisなどの使用

5. **全件取得の改善**
   - データベース側でランダム取得
   - 不要な全件取得を削除

6. **画像最適化の有効化**
   - `unoptimized: false` に変更
   - 適切な画像サイズ設定

### 優先度: 低 🟢

7. **リアルタイム更新の改善**
   - Server-Sent Events (SSE) の導入
   - WebSocketの導入
   - ポーリング間隔の最適化

---

## 📝 実装例

### 例1: ページネーション付きAPI

```typescript
// app/api/products/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20") || 20, 100);
  const offset = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        image: true,
      },
    }),
    prisma.product.count(),
  ]);

  return NextResponse.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}
```

### 例2: キャッシュ付きデータ取得

```typescript
// app/page.tsx
import { cache } from 'react';

const getCachedFeaturedProducts = cache(async () => {
  // データベースから取得
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, name: true, price: true, image: true },
  });
  
  // ランダムに4件選択
  return products.sort(() => Math.random() - 0.5).slice(0, 4);
});

export const revalidate = 3600; // 1時間ごとに再生成

export default async function HomePage() {
  const featuredProducts = await getCachedFeaturedProducts();
  // ...
}
```

### 例3: レート制限付きAPI

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

// app/api/products/route.ts
export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success, limit, remaining } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから再試行してください。" },
      { 
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
        },
      }
    );
  }
  
  // 通常の処理
  // ...
}
```

---

## 🔍 パフォーマンス監視

### 推奨される監視項目

1. **データベースクエリ時間**
   - スロークエリの検出
   - クエリ数の監視

2. **APIレスポンス時間**
   - 各エンドポイントのレスポンス時間
   - エラーレート

3. **メモリ使用量**
   - サーバーレス関数のメモリ使用量
   - データベース接続数

4. **キャッシュヒット率**
   - キャッシュの効果測定

---

## まとめ

### 現在の状態

- ✅ **良好**: データベース接続プーリング、インデックス、並列処理
- ⚠️ **改善必要**: ページネーション、キャッシュ、レート制限
- ❌ **未実装**: レート制限、画像最適化

### 推奨アクション

1. **即座に対応**: ページネーションの実装
2. **短期**: キャッシュ戦略の実装、レート制限の追加
3. **中期**: 画像最適化、リアルタイム更新の改善

現在の実装は基本的なスケーラビリティ対策は実装されていますが、上記の改善を実施することで、より堅牢なスケーラブルなアプリケーションになります。

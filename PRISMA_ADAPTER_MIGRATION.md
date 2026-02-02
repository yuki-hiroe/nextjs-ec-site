# PrismaAdapterを活用する場合の変更ファイル一覧

## 概要

`session.strategy: "jwt"` から `session.strategy: "database"` に変更してPrismaAdapterを活用する場合、以下のファイルを変更する必要があります。

---

## 必須変更ファイル

### 1. `lib/auth.ts` ⭐ **必須**

```typescript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // ...
  ],
  session: {
    strategy: "database", // ← "jwt" から "database" に変更
    maxAge: 30 * 24 * 60 * 60, // 30日（オプション）
    updateAge: 24 * 60 * 60, // 24時間ごとに更新（オプション）
  },
  // callbacks の jwt コールバックは不要になる
  callbacks: {
    // jwt コールバックは削除（データベースセッションでは使用しない）
    async session({ session, user }) {
      // user はデータベースから取得されるUserオブジェクト
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
};
```

**変更点**:
- `session.strategy: "jwt"` → `session.strategy: "database"`
- `jwt` コールバックを削除
- `session` コールバックで `user` パラメータを使用（データベースから取得）

---

### 2. `types/next-auth.d.ts` ⭐ **必須**

データベースセッション戦略の場合、型定義を更新する必要があります。

```typescript
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      email?: string;
      name?: string;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role?: string;
    image?: string | null;
  }
}

// データベースセッション戦略の場合、JWTモジュールの拡張は不要
// declare module "next-auth/jwt" { ... } は削除可能
```

**変更点**:
- `JWT` インターフェースの拡張は不要（データベースセッションではJWTを使用しない）
- `Session` と `User` の型定義は維持

---

## 変更不要だが確認推奨ファイル

### 3. `middleware.ts` ✅ **変更不要（動作確認推奨）**

```typescript
// データベースセッション戦略でも、withAuthは同じように動作
export default withAuth(
  function middleware(req) {
    // req.nextauth.token は引き続き使用可能
    if (req.nextauth.token?.role !== "admin") {
      // ...
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // token は引き続き使用可能
        return !!token && token.role === "admin";
      }
    }
  }
);
```

**確認点**:
- `withAuth` はデータベースセッションでも動作する
- `req.nextauth.token` は引き続き使用可能（NextAuthが自動的に処理）

---

### 4. API Routes（`getServerSession`使用箇所） ✅ **変更不要**

以下のファイルは変更不要ですが、動作確認を推奨します：

- `app/api/admin/stats/route.ts`
- `app/api/users/stylists/route.ts`
- `app/api/stylists/ratings/route.ts`
- `app/api/testimonials/route.ts`
- `app/api/newsletter/status/route.ts`
- `app/api/newsletter/unsubscribe/route.ts`
- `app/api/newsletter/subscribe/route.ts`
- `lib/admin-auth.ts`

```typescript
// 使用方法は同じ
const session = await getServerSession(authOptions);
if (session?.user?.role !== "admin") {
  // ...
}
```

**確認点**:
- `getServerSession` の使用方法は同じ
- セッションの取得方法は変更不要

---

### 5. クライアントコンポーネント（`useSession`使用箇所） ✅ **変更不要**

以下のファイルは変更不要です：

- `components/Header.tsx`
- `app/admin/page.tsx`
- `app/login/page.tsx`
- その他すべてのクライアントコンポーネント

```typescript
// 使用方法は同じ
const { data: session, status } = useSession();
if (session?.user?.role === "admin") {
  // ...
}
```

**確認点**:
- `useSession` の使用方法は同じ
- クライアント側のコードは変更不要

---

## データベースマイグレーション

### Sessionテーブルの確認

PrismaAdapterを使用する場合、`Session`テーブルが正しく設定されている必要があります。

```prisma
// prisma/schema.prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**確認点**:
- `Session`テーブルが存在するか
- `Account`テーブルが存在するか（OAuth未使用でも必要）
- `VerificationToken`テーブルが存在するか（メール認証未使用でも必要）

---

## 主な違い

### JWT戦略 vs データベース戦略

| 項目 | JWT戦略（現在） | データベース戦略 |
|------|----------------|-----------------|
| **セッション保存場所** | JWTトークン（クライアント） | Sessionテーブル（データベース） |
| **セッション無効化** | 困難（トークン有効期限まで） | 容易（データベースから削除） |
| **データベースアクセス** | 少ない | 多い（セッション取得時に毎回） |
| **パフォーマンス** | 高速 | やや遅い（DBアクセスが必要） |
| **セキュリティ** | 中（トークンが漏洩するリスク） | 高（サーバーサイドで管理） |
| **callbacks** | `jwt` + `session` | `session` のみ |

---

## 移行手順

### ステップ1: データベーススキーマの確認

```bash
# Session, Account, VerificationTokenテーブルが存在するか確認
npx prisma studio
```

### ステップ2: `lib/auth.ts` を更新

```typescript
session: {
  strategy: "database", // 変更
},
callbacks: {
  // jwt コールバックを削除
  async session({ session, user }) {
    // user パラメータを使用
    if (session.user) {
      session.user.id = user.id;
      session.user.role = user.role;
    }
    return session;
  },
},
```

### ステップ3: 型定義を更新

`types/next-auth.d.ts` から `JWT` インターフェースの拡張を削除（オプション）

### ステップ4: 動作確認

1. ログインが正常に動作するか
2. セッションが正しく保持されるか
3. ログアウトが正常に動作するか
4. 管理者ページへのアクセス制御が正常に動作するか

---

## 注意点

### 1. パフォーマンスへの影響

データベースセッション戦略では、セッション取得のたびにデータベースにアクセスします。

```typescript
// 毎回データベースにアクセス
const session = await getServerSession(authOptions);
```

**対策**:
- データベース接続プーリングを最適化
- セッション取得結果をキャッシュ（慎重に）

### 2. セッションの有効期限

```typescript
session: {
  strategy: "database",
  maxAge: 30 * 24 * 60 * 60, // 30日
  updateAge: 24 * 60 * 60,   // 24時間ごとに更新
},
```

### 3. 既存セッションの無効化

データベースセッション戦略では、セッションを即座に無効化できます。

```typescript
// セッションを削除
await prisma.session.deleteMany({
  where: { userId: userId },
});
```

---

## まとめ

### 必須変更ファイル

1. ✅ `lib/auth.ts` - セッション戦略を変更
2. ✅ `types/next-auth.d.ts` - 型定義を更新（JWT拡張を削除）

### 変更不要だが確認推奨

3. ⚠️ `middleware.ts` - 動作確認
4. ⚠️ API Routes（`getServerSession`使用箇所） - 動作確認
5. ⚠️ クライアントコンポーネント（`useSession`使用箇所） - 動作確認

### データベース

6. ⚠️ `Session`, `Account`, `VerificationToken`テーブルの存在確認

---

## 結論

**最小限の変更**: `lib/auth.ts` と `types/next-auth.d.ts` の2ファイルのみ変更すれば動作します。

ただし、パフォーマンスとセキュリティのバランスを考慮し、現在のJWT戦略を維持することも選択肢です。

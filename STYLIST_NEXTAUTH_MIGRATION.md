# スタイリスト認証をNextAuthに統一する方法

## 現在の状況

- **ユーザー**: NextAuth.js使用（Userテーブル、roleフィールド）
- **スタイリスト**: カスタムAPI + localStorage（Stylistテーブル、独立）

## アプローチ1: StylistテーブルをUserテーブルに統合（推奨）

### 概要
StylistテーブルのデータをUserテーブルに統合し、`role="stylist"`で管理します。

### メリット
- ✅ 認証が完全に統一される
- ✅ セッション管理が一元化される
- ✅ コードの保守性が向上
- ✅ セキュリティが向上（localStorage不使用）

### デメリット
- ⚠️ データベースマイグレーションが必要
- ⚠️ 既存のStylistデータを移行する必要がある

### 実装手順

#### 1. データベーススキーマの変更

```prisma
// prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String
  role          String    @default("user") // user, admin, stylist
  // ... 既存のフィールド
  
  // スタイリスト専用フィールド（role="stylist"の場合のみ使用）
  nameEn        String?   // 英語名
  bio           String?   // 自己紹介
  specialties   Json?     @default("[]") // 専門分野
  isActive      Boolean   @default(true) // スタイリストの有効/無効
  
  // Relations
  stylistInquiries Inquiry[] @relation("StylistInquiries")
  stylistRatings   StylistRating[]
}

// Stylistテーブルは削除または参照テーブルに変更
// （既存のリレーションを維持するため）
```

#### 2. NextAuth設定の更新

```typescript
// lib/auth.ts

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "text" }, // "user" or "stylist"
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールアドレスとパスワードを入力してください");
        }

        // Userテーブルから検索（role="stylist"も含む）
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("メールアドレスまたはパスワードが正しくありません");
        }

        // スタイリストログインの場合、isActiveをチェック
        if (credentials.userType === "stylist" && user.role === "stylist") {
          if (!user.isActive) {
            throw new Error("このアカウントは無効化されています");
          }
        }

        // パスワード検証
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error("メールアドレスまたはパスワードが正しくありません");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          // スタイリスト情報も含める
          ...(user.role === "stylist" && {
            nameEn: user.nameEn,
            bio: user.bio,
            specialties: user.specialties,
            isActive: user.isActive,
          }),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        // スタイリスト情報もトークンに含める
        if (user.role === "stylist") {
          token.nameEn = user.nameEn;
          token.bio = user.bio;
          token.specialties = user.specialties;
          token.isActive = user.isActive;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        // スタイリスト情報もセッションに含める
        if (token.role === "stylist") {
          session.user.nameEn = token.nameEn as string | undefined;
          session.user.bio = token.bio as string | undefined;
          session.user.specialties = token.specialties as any;
          session.user.isActive = token.isActive as boolean;
        }
      }
      return session;
    },
  },
  // ...
};
```

#### 3. スタイリストログインページの更新

```typescript
// app/stylist/login/page.tsx

"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function StylistLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await signIn("credentials", {
      email,
      password,
      userType: "stylist", // スタイリストログインを指定
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      return;
    }

    if (result?.ok) {
      // セッションを確認してスタイリストかチェック
      const session = await getSession();
      if (session?.user?.role === "stylist") {
        router.push("/stylist");
      } else {
        setError("スタイリストアカウントでログインしてください");
        await signOut();
      }
    }
  };

  // ...
}
```

#### 4. スタイリストダッシュボードの更新

```typescript
// app/stylist/page.tsx

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function StylistDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated" || !session?.user) {
      router.push("/stylist/login");
      return;
    }

    if (session.user.role !== "stylist") {
      router.push("/stylist/login");
      return;
    }

    // スタイリスト情報はsession.userから取得
    const stylist = {
      id: session.user.id,
      name: session.user.name,
      nameEn: session.user.nameEn,
      email: session.user.email,
      bio: session.user.bio,
      specialties: session.user.specialties,
      isActive: session.user.isActive,
    };

    // お問い合わせを取得
    fetchInquiries(session.user.id);
  }, [session, status, router]);

  // localStorageは不要
  // const stylistData = localStorage.getItem("stylist"); // 削除

  // ...
}
```

#### 5. APIルートの認証チェック

```typescript
// app/api/stylists/route.ts など

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || session.user.role !== "stylist") {
    return NextResponse.json(
      { error: "スタイリスト権限が必要です" },
      { status: 403 }
    );
  }

  // session.user.id でスタイリストIDを取得
  const stylistId = session.user.id;
  
  // ...
}
```

---

## アプローチ2: Stylistテーブルを維持しつつNextAuthで認証

### 概要
Stylistテーブルは維持し、NextAuthのCredentialsProviderでStylistテーブルも認証可能にします。

### メリット
- ✅ 既存のデータベース構造を維持
- ✅ マイグレーションが最小限

### デメリット
- ⚠️ 2つのテーブルで認証を管理する必要がある
- ⚠️ セッションにスタイリスト情報を含める必要がある

### 実装手順

#### 1. NextAuth設定の更新

```typescript
// lib/auth.ts

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "text" }, // "user" or "stylist"
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールアドレスとパスワードを入力してください");
        }

        // userTypeに応じてテーブルを切り替え
        if (credentials.userType === "stylist") {
          // Stylistテーブルから検索
          const stylist = await prisma.stylist.findUnique({
            where: { email: credentials.email },
          });

          if (!stylist || !stylist.password) {
            throw new Error("メールアドレスまたはパスワードが正しくありません");
          }

          if (!stylist.isActive) {
            throw new Error("このアカウントは無効化されています");
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            stylist.password
          );

          if (!isValidPassword) {
            throw new Error("メールアドレスまたはパスワードが正しくありません");
          }

          return {
            id: stylist.id,
            email: stylist.email,
            name: stylist.name,
            role: "stylist",
            image: stylist.image,
            nameEn: stylist.nameEn,
            bio: stylist.bio,
            specialties: stylist.specialties,
            isActive: stylist.isActive,
          };
        } else {
          // Userテーブルから検索（既存のロジック）
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            throw new Error("メールアドレスまたはパスワードが正しくありません");
          }

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValidPassword) {
            throw new Error("メールアドレスまたはパスワードが正しくありません");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        // スタイリスト情報もトークンに含める
        if (user.role === "stylist") {
          token.nameEn = (user as any).nameEn;
          token.bio = (user as any).bio;
          token.specialties = (user as any).specialties;
          token.isActive = (user as any).isActive;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        // スタイリスト情報もセッションに含める
        if (token.role === "stylist") {
          (session.user as any).nameEn = token.nameEn;
          (session.user as any).bio = token.bio;
          (session.user as any).specialties = token.specialties;
          (session.user as any).isActive = token.isActive;
        }
      }
      return session;
    },
  },
  // ...
};
```

#### 2. TypeScript型定義の拡張

```typescript
// types/next-auth.d.ts

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      image?: string;
      // スタイリスト専用フィールド
      nameEn?: string;
      bio?: string;
      specialties?: any;
      isActive?: boolean;
    };
  }

  interface User {
    role: string;
    nameEn?: string;
    bio?: string;
    specialties?: any;
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    nameEn?: string;
    bio?: string;
    specialties?: any;
    isActive?: boolean;
  }
}
```

---

## 推奨アプローチ

**アプローチ1（StylistテーブルをUserテーブルに統合）を推奨します。**

### 理由
1. **認証の一元化**: すべての認証がUserテーブルで管理される
2. **セキュリティ**: localStorageを使用しない
3. **保守性**: 認証ロジックが1箇所に集約される
4. **拡張性**: 将来的に他のロールを追加しやすい

### 移行手順

1. **データ移行スクリプトの作成**
   ```typescript
   // prisma/migrations/migrate-stylists.ts
   // StylistテーブルのデータをUserテーブルに移行
   ```

2. **段階的な移行**
   - ステップ1: Userテーブルにスタイリストフィールドを追加
   - ステップ2: 既存のStylistデータをUserテーブルに移行
   - ステップ3: NextAuth設定を更新
   - ステップ4: フロントエンドを更新（localStorage削除）
   - ステップ5: Stylistテーブルを削除または参照テーブルに変更

---

## 実装後の認証フロー

### スタイリストログイン
```
1. /stylist/login でログイン
   ↓
2. signIn("credentials", { email, password, userType: "stylist" })
   ↓
3. NextAuthがUserテーブル（role="stylist"）またはStylistテーブルを検索
   ↓
4. パスワード検証
   ↓
5. isActiveチェック（スタイリストの場合）
   ↓
6. JWTトークン生成（スタイリスト情報を含む）
   ↓
7. セッション確立
   ↓
8. /stylist にリダイレクト
```

### 認証チェック
```typescript
// クライアント側
const { data: session } = useSession();
if (session?.user?.role === "stylist") {
  // スタイリストとして認証済み
}

// サーバー側
const session = await getServerSession(authOptions);
if (session?.user?.role === "stylist") {
  // スタイリストとして認証済み
}
```

---

## 注意点

1. **既存のStylistデータの移行**: アプローチ1の場合、既存データを移行する必要がある
2. **APIルートの更新**: すべてのスタイリスト用APIで認証チェックを更新
3. **localStorageの削除**: 既存のlocalStorageベースのコードを削除
4. **型定義の拡張**: TypeScriptの型定義を更新

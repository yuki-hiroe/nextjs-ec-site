# Prisma Studio エラー解決方法

## 問題の原因

Prisma Studioでクライアントエラーが発生する主な原因：

1. **`StylistApplication`テーブルがデータベースに存在しない**
   - スキーマには定義されているが、実際のデータベースには作成されていない
   - 解決方法：SupabaseダッシュボードからSQLを実行してテーブルを作成

2. **接続プーラー（pgbouncer）の問題**
   - Prisma Studioは接続プーラー経由では動作しない場合がある
   - 解決方法：`DIRECT_URL`を使用するか、一時的に`directUrl`をコメントアウト

## 解決方法

### 方法1: テーブルを作成する（推奨）

Supabaseダッシュボードから以下のSQLを実行：

```sql
CREATE TABLE IF NOT EXISTS "StylistApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "bio" TEXT NOT NULL,
    "specialties" JSONB NOT NULL DEFAULT '[]',
    "image" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StylistApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StylistApplication_email_idx" ON "StylistApplication"("email");
CREATE INDEX IF NOT EXISTS "StylistApplication_status_idx" ON "StylistApplication"("status");
CREATE INDEX IF NOT EXISTS "StylistApplication_createdAt_idx" ON "StylistApplication"("createdAt");
```

### 方法2: Prisma StudioをDIRECT_URLで起動

Prisma Studioを起動する際に、環境変数を一時的に変更：

```bash
# DIRECT_URLを使用してPrisma Studioを起動
DIRECT_URL="postgresql://postgres.xxmkatizftqbpenqesnn:watashihahiroedesu@aws-1-ap-southeast-1.connect.supabase.com:5432/postgres" npx prisma studio
```

### 方法3: 一時的にdirectUrlをコメントアウト

`prisma/schema.prisma`の`directUrl`を一時的にコメントアウト：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // directUrl = env("DIRECT_URL")  // 一時的にコメントアウト
}
```

その後、Prisma Studioを起動：

```bash
npx prisma studio
```

**注意**: この方法を使用した後、マイグレーションを実行する前に`directUrl`のコメントを外してください。

## 確認方法

テーブルが作成されているか確認：

```bash
# Prisma Studioを起動
npx prisma studio

# ブラウザで http://localhost:5555 を開く
# StylistApplicationテーブルが表示されれば成功
```


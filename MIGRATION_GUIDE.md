# NewsletterSubscriptionにuserIdを追加するマイグレーションガイド

## 問題
データベース接続エラーが発生しており、`prisma migrate dev`が実行できません。
また、ユーザーデータが消えている可能性があります。

## 解決方法

### 1. データベース接続の確認

まず、`.env`ファイルに`DIRECT_URL`が設定されているか確認してください。
Supabaseの接続プーラーを使用している場合、マイグレーションには`DIRECT_URL`が必要です。

```env
DATABASE_URL="postgresql://user:password@aws-1-ap-southeast-1.connect.supabase.com:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@aws-1-ap-southeast-1.connect.supabase.com:5432/postgres"
```

### 2. ユーザーデータの確認

SupabaseのSQL Editorで以下のクエリを実行して、ユーザーデータが存在するか確認してください：

```sql
SELECT COUNT(*) as user_count FROM "User";
SELECT * FROM "User" LIMIT 10;
```

### 3. マイグレーションの実行方法

#### 方法A: SupabaseのSQL Editorを使用（推奨）

1. Supabaseダッシュボードにログイン
2. 左メニューから「SQL Editor」を選択
3. `add_user_id_to_newsletter.sql`の内容をコピー＆ペースト
4. 「Run」ボタンをクリック

#### 方法B: 接続が復旧したらPrismaを使用

データベース接続が復旧したら、以下のコマンドを実行：

```bash
npx prisma migrate dev --name add_user_id_to_newsletter_subscription
```

または、`prisma db push`を使用：

```bash
npx prisma db push
```

### 4. マイグレーション後の確認

マイグレーション実行後、以下のクエリで確認：

```sql
-- NewsletterSubscriptionテーブルの構造を確認
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'NewsletterSubscription';

-- userIdが正しく追加されているか確認
SELECT id, email, "userId", "isActive" 
FROM "NewsletterSubscription" 
LIMIT 10;
```

### 5. Prisma Clientの再生成

マイグレーション実行後、Prisma Clientを再生成：

```bash
npx prisma generate
```

## 注意事項

- マイグレーション実行前に、データベースのバックアップを取ることを推奨します
- 既存のNewsletterSubscriptionレコードがある場合、emailが一致するUserのIDが自動的に設定されます
- userIdに一意制約があるため、1人のユーザーは1つのNewsletter登録しか持てません

## トラブルシューティング

### エラー: "Can't reach database server"

- `.env`ファイルの`DATABASE_URL`と`DIRECT_URL`が正しく設定されているか確認
- Supabaseのファイアウォール設定を確認
- ネットワーク接続を確認

### エラー: "duplicate key value violates unique constraint"

- 既存のNewsletterSubscriptionレコードで、同じuserIdが複数存在する可能性があります
- 以下のクエリで重複を確認：

```sql
SELECT "userId", COUNT(*) 
FROM "NewsletterSubscription" 
WHERE "userId" IS NOT NULL 
GROUP BY "userId" 
HAVING COUNT(*) > 1;
```

重複がある場合は、手動で修正してから再度マイグレーションを実行してください。


# データ復元ガイド

## データが消えてしまった場合の復元方法

### 方法1: Supabaseの自動バックアップから復元（推奨）

Supabaseは自動的にデータベースのバックアップを取っています。

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com/dashboard にログイン
   - プロジェクトを選択

2. **バックアップを確認**
   - 左メニューから「Database」→「Backups」を選択
   - 利用可能なバックアップの一覧が表示されます
   - 最新のバックアップを選択して復元

3. **ポイントインタイムリカバリー（PITR）**
   - Supabase Proプラン以上では、特定の時点に戻すことができます
   - 「Database」→「Backups」→「Point-in-time Recovery」から利用可能

### 方法2: シードファイルから再生成

商品データやスタイリスト、管理者アカウントはシードファイルから再生成できます。

```bash
# シードファイルを実行
npx prisma db seed
```

**注意**: シードファイルは以下のデータのみ再生成します：
- 商品データ（50件以上）
- スタイリストアカウント（3件）
- 管理者アカウント（1件）

**再生成されないデータ**:
- ユーザーアカウント
- 注文データ
- お問い合わせデータ
- スタイリスト申請データ
- Newsletter購読者データ

### 方法3: 手動でSQLダンプから復元

以前にSQLダンプを取っていた場合：

```bash
# PostgreSQLに接続してダンプを復元
psql -h [ホスト名] -U [ユーザー名] -d [データベース名] < backup.sql
```

### 方法4: SupabaseのSQL Editorから確認

Supabaseダッシュボードの「SQL Editor」から、データが実際に消えているか確認：

```sql
-- 各テーブルのデータ数を確認
SELECT 'Product' as table_name, COUNT(*) as count FROM "Product"
UNION ALL
SELECT 'User', COUNT(*) FROM "User"
UNION ALL
SELECT 'Order', COUNT(*) FROM "Order"
UNION ALL
SELECT 'Inquiry', COUNT(*) FROM "Inquiry"
UNION ALL
SELECT 'Stylist', COUNT(*) FROM "Stylist"
UNION ALL
SELECT 'StylistApplication', COUNT(*) FROM "StylistApplication";
```

## 今後の対策

### 1. 定期的なバックアップの設定

Supabaseのバックアップ設定を確認し、自動バックアップが有効になっていることを確認してください。

### 2. 重要なデータのエクスポート

定期的に重要なデータをエクスポート：

```bash
# Supabase CLIを使用してダンプを取得
supabase db dump -f backup.sql
```

### 3. 本番環境と開発環境の分離

本番環境のデータを誤って削除しないよう、開発環境と本番環境を分離してください。

## 緊急時の連絡先

データが完全に失われた場合、Supabaseのサポートに連絡してください：
- サポートチケット: https://supabase.com/support
- ドキュメント: https://supabase.com/docs/guides/platform/backups


# データベースセットアップガイド

## セットアップ手順

### 1. 環境変数の設定

`.env`ファイルを作成し、以下の内容を追加してください：

```env
DATABASE_URL="file:./dev.db"
```

### 2. Prismaクライアントの生成

```bash
npm install
npm run db:generate
```

### 3. データベーススキーマの適用

```bash
npm run db:push
```

または、マイグレーションを使用する場合：

```bash
npm run db:migrate
```

### 4. シードデータの投入

```bash
npm run db:seed
```

## 便利なコマンド

- `npm run db:studio` - Prisma Studioを起動（データベースのGUI管理ツール）
- `npm run db:generate` - Prismaクライアントを再生成
- `npm run db:push` - スキーマをデータベースに適用（開発用）
- `npm run db:migrate` - マイグレーションを作成・適用（本番用）
- `npm run db:seed` - シードデータを投入

## データベース構造

- **User**: ユーザー情報（メールアドレス、パスワード、名前など）
- **Product**: 商品情報
- **ProductRelation**: 関連商品のリレーション
- **Order**: 注文情報
- **OrderItem**: 注文アイテム
- **Inquiry**: お問い合わせ

## データベースの確認方法

### Prisma Studio（推奨）

GUIでデータベースを確認・編集できます：

```bash
npm run db:studio
```

ブラウザで `http://localhost:5555` にアクセスすると、すべてのテーブルとデータを確認できます。

### SQLiteコマンドライン

データベースファイルを直接確認する場合：

```bash
# SQLiteコマンドラインツールを使用
sqlite3 prisma/dev.db

# テーブル一覧を表示
.tables

# Userテーブルのデータを確認
SELECT * FROM User;

# 終了
.quit
```

## SQLiteについて

このプロジェクトはSQLiteを使用しています。SQLiteはファイルベースのデータベースで、Dockerなどの外部サービスを必要としません。

- データベースファイル: `prisma/dev.db`（Prismaディレクトリ内）
- 配列やJSONオブジェクトはJSON文字列として保存されます
- API Routesで自動的にパースされて返されます

## トラブルシューティング

### データベースに接続できない場合

1. `.env`ファイルが正しく設定されているか確認：
   ```bash
   cat .env
   ```

2. Prismaクライアントを再生成：
   ```bash
   npm run db:generate
   ```

3. データベースファイルを削除して再作成：
   ```bash
   rm dev.db dev.db-journal
   npm run db:push
   npm run db:seed
   ```

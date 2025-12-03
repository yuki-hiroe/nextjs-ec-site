# Intercambio

日常を少し上質にするミニマルセレクトショップ

国内外の独立ブランドからセレクトしたバッグ、フットウェア、テックアクセサリをオンラインでお届けする、モダンなECサイトです。

## ✨ 主な機能

### ユーザー向け機能
- **商品閲覧・検索**: 豊富な商品ラインナップからお気に入りを見つけられます
- **ショッピングカート**: 複数商品をまとめて購入
- **お気に入り機能**: 気になる商品を保存
- **注文管理**: 注文履歴の確認
- **スタイリスト相談**: プロのスタイリストからのスタイリング提案
- **お問い合わせ**: チャット形式でのサポート
- **Newsletter購読**: 新作アイテムやスタイリング提案の最新情報を受け取れます
- **シーン別コレクション**: AIが提案するコーディネートを見ることができます

### スタイリスト向け機能
- **スタイリストダッシュボード**: プロフィール管理
- **お問い合わせ対応**: ユーザーからの相談に回答
- **申請システム**: スタイリストとしての登録申請

### 管理者向け機能
- **商品管理**: 商品の追加・編集・削除
- **ユーザー管理**: ユーザーアカウントの管理（一時停止、削除など）
- **注文管理**: 注文状況の確認・更新
- **スタイリスト管理**: スタイリスト申請の承認・拒否
- **お問い合わせ管理**: お問い合わせ履歴の確認
- **統計ダッシュボード**: 売上、注文数、ユーザー数などの統計情報
- **監査ログ**: 管理者操作の記録

## 🛠 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS 4
- **データベース**: PostgreSQL (Supabase)
- **ORM**: Prisma 5.22
- **認証**: NextAuth.js
- **パスワードハッシュ化**: bcryptjs

## 📋 必要条件

- Node.js 18.0 以上
- npm, yarn, pnpm, または bun
- PostgreSQL データベース（Supabase推奨）

## 🚀 セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd intercambio
```

### 2. 依存関係のインストール

```bash
npm install
# または
yarn install
# または
pnpm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下の環境変数を設定してください：

```env
# データベース接続（Supabaseの場合）
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/database"

# NextAuth設定
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Next.js設定
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

#### 環境変数の説明

- `DATABASE_URL`: 接続プーラーを使用する場合のデータベース接続URL（通常のアプリケーション動作用）
- `DIRECT_URL`: マイグレーション実行時に必要な直接接続URL
- `NEXTAUTH_URL`: NextAuthのベースURL（本番環境では実際のURLに変更）
- `NEXTAUTH_SECRET`: NextAuthの秘密鍵（`openssl rand -base64 32`で生成可能）
- `NEXT_PUBLIC_BASE_URL`: アプリケーションのベースURL

### 4. データベースセットアップ

#### Prisma Clientの生成

```bash
npm run db:generate
```

#### データベースマイグレーション

```bash
npm run db:migrate
```

または、スキーマを直接プッシュする場合：

```bash
npm run db:push
```

#### 初期データの投入（シード）

```bash
npm run db:seed
```

これにより、以下のデータが投入されます：
- 10件の商品データ
- 3件のスタイリストアカウント
- 1件の管理者アカウント（メール: admin@example.com, パスワード: admin123）

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## 📁 プロジェクト構造

```
intercambio/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理者画面
│   │   ├── products/      # 商品管理
│   │   ├── users/         # ユーザー管理
│   │   ├── orders/        # 注文管理
│   │   └── stylists/      # スタイリスト管理
│   ├── api/               # API Routes
│   ├── products/          # 商品ページ
│   ├── collections/       # コレクションページ
│   └── ...
├── components/            # Reactコンポーネント
├── contexts/              # React Context
├── lib/                   # ユーティリティ関数
├── prisma/               # Prisma設定
│   ├── schema.prisma     # データベーススキーマ
│   └── seed.ts           # シードデータ
└── public/               # 静的ファイル
```

## 🎯 主要なスクリプト

```bash
# 開発サーバーの起動
npm run dev

# 本番用ビルド
npm run build

# 本番サーバーの起動
npm start

# リント
npm run lint

# Prisma Clientの生成
npm run db:generate

# データベースマイグレーション
npm run db:migrate

# スキーマを直接プッシュ
npm run db:push

# Prisma Studioの起動（データベースGUI）
npm run db:studio

# シードデータの投入
npm run db:seed
```

## 👥 アカウントタイプ

### 一般ユーザー
- 商品の閲覧・購入
- お気に入り機能
- スタイリストへの相談
- Newsletter購読

### スタイリスト
- プロフィール管理
- ユーザーからの相談への回答
- スタイリストダッシュボードへのアクセス

### 管理者
- すべての管理機能へのアクセス
- 商品・ユーザー・注文の管理
- スタイリスト申請の承認

## 🔐 認証システム

このアプリケーションでは、3種類の認証方式を使用しています：

1. **NextAuth.js**: 一般ユーザーの認証（メールアドレス・パスワード）
2. **スタイリスト認証**: localStorageベース（スタイリストログインページ）
3. **管理者認証**: localStorageベース（管理者ログインページ）

## 📊 データベーススキーマ

主要なテーブル：
- `User`: ユーザー情報
- `Product`: 商品情報
- `Order`: 注文情報
- `Stylist`: スタイリスト情報
- `Inquiry`: お問い合わせ情報
- `NewsletterSubscription`: Newsletter購読者
- `AuditLog`: 監査ログ

詳細は `prisma/schema.prisma` を参照してください。

## 🛒 注文フロー

1. ユーザーが商品をカートに追加
2. チェックアウトページで配送情報を入力
3. 注文確定
4. 管理者が注文を確認・処理
5. 注文状況の更新

## 📝 その他のドキュメント

- [データ復元ガイド](./DATA_RESTORE_GUIDE.md): データが消えてしまった場合の復元方法
- [マイグレーションガイド](./MIGRATION_GUIDE.md): Newsletter機能追加時のマイグレーション手順
- [Prisma Studio 起動方法](./PRISMA_STUDIO_FIX_DETAILED.md): Prisma Studio起動時のトラブルシューティング

## 🐛 トラブルシューティング

### データベース接続エラー

```
Error: P1001: Can't reach database server
```

**解決方法**:
1. `.env`ファイルの`DATABASE_URL`と`DIRECT_URL`が正しく設定されているか確認
2. Supabaseのファイアウォール設定を確認
3. ネットワーク接続を確認

### Prisma Clientの生成エラー

```bash
npm run db:generate
```

を実行してPrisma Clientを再生成してください。

### マイグレーションエラー

接続プーラーを使用している場合、`DIRECT_URL`が設定されているか確認してください。

## 🤝 コントリビューション

プルリクエストを歓迎します。大きな変更を加える場合は、まず issue を開いて変更内容を議論してください。

## 📄 ライセンス

このプロジェクトはプライベートプロジェクトです。

## 📧 お問い合わせ

プロジェクトに関する質問やサポートが必要な場合は、管理者に連絡してください。

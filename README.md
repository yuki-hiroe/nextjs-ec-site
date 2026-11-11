# Next.js EC Site - スタイリスト相談機能付きECサイト

お店とお客様を繋ぎ、スタイリストに相談できる機能を持ったECサイト

## 🎯 プロジェクト概要

単なる商品販売だけでなく、スタイリストへの相談機能やシーン別コレクションを通じて、
ユーザー体験を重視したECサイトです。

### 独自機能
- **スタイリスト相談**: お客様が専門スタイリストに直接相談可能
- **シーン別コレクション**: 使用シーンごとに商品を提案
- **お客様の声**: レビュー機能
- **メルマガ登録機能**: 新作やコーディネートのお知らせが届く機能


## 🛠️ 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **UI** | React 19 |
| **Styling** | Tailwind CSS 4 |
| **Database** | PostgreSQL（ローカルは Docker、本番は Supabase も利用可能） |
| **ORM** | Prisma |
| **Authentication** | NextAuth.js |
| **Password Hashing** | bcryptjs |
| **Deployment** | Vercel |

## ✨ 主な機能

### お客様側
- ✅ 商品一覧・詳細
- ✅ カート機能
- ✅ お気に入り機能
- ✅ 会員登録・ログイン（NextAuth.js）
- ✅ 購入手続き（注文の作成まで。外部決済は未連携）
- ✅ メルマガ登録
- ✅ スタイリスト相談・評価
- ✅ 問い合わせ履歴機能
- ✅ お客様の声投稿機能
- ✅ 注目アイテムの表示
- ✅ シーン別コレクション閲覧
- ✅ 注文履歴
- ✅ 在庫切れ時のSOLD OUT表示・購入制御

### スタイリスト側
- ✅ スタイリスト専用ダッシュボード
- ✅ スタイリスト登録申請機能
- ✅ 相談対応機能
- ✅ プロフィール編集機能

### 管理者側
- ✅ 商品管理（登録・編集・削除）
- ✅ スタイリスト管理（申請一覧・アカウントの無効・有効・新規追加）
- ✅ ユーザー管理（アカウントの無効・有効・削除）
- ✅ 注文管理機能
- ✅ お問い合わせ確認
- ✅ お客様の声管理機能
- ✅ 監査ログ

## 📸 スクリーンショット

### ユーザー画面(ログイン)
![ユーザー画面](./public/screenshots/user-login.png)

### ユーザー画面(トップページ)
![ユーザー画面](./public/screenshots/home.png)

### ユーザー画面(新規登録)
![ユーザー画面](./public/screenshots/register.png)

### ユーザー画面(商品一覧)
![ユーザー画面](./public/screenshots/products.png)

### ユーザー画面(商品詳細)
![ユーザー画面](./public/screenshots/product-detail.png)

### ユーザー画面(お気に入り)
![ユーザー画面](./public/screenshots/favorite.png)

### ユーザー画面(マイページ)
![ユーザー画面](./public/screenshots/mypage.png)

### ユーザー画面(カート)
![ユーザー画面](./public/screenshots/cart.png)

### スタイリスト画面(スタイリスト一覧)
![ユーザー画面](./public/screenshots/stylists.png)

### ユーザー画面(お問い合わせ)
![ユーザー画面](./public/screenshots/contact.png)

### ユーザー画面(お問い合わせ履歴)
![ユーザー画面](./public/screenshots/inquiry.png)

### ユーザー画面(レビュー機能)
![ユーザー画面](./public/screenshots/inquiry-review.png)

### ユーザー画面(シーン別コレクション)
![ユーザー画面](./public/screenshots/collections.png)

### ユーザー画面(シーン別コレクション詳細)
![ユーザー画面](./public/screenshots/collection-detail.png)

### ユーザー画面(お客様の声)
![ユーザー画面](./public/screenshots/voices.png)

### スタイリスト画面(ログイン画面)
![スタイリスト画面](./public/screenshots/stylist-login.png)

### スタイリスト画面(申請画面)
![スタイリスト画面](./public/screenshots/stylist-apply.png)

### スタイリスト画面
![スタイリスト画面](./public/screenshots/stylist-dashboard.png)

### スタイリスト画面(プロフィール編集画面)
![スタイリスト画面](./public/screenshots/stylist-edit.png)

### スタイリスト画面(相談回答画面)
![スタイリスト画面](./public/screenshots/stylist-inquiry.png)

### 管理画面(ログイン画面)
![管理画面](./public/screenshots/admin-login.png)

### 管理画面
![管理画面](./public/screenshots/admin-dashboard.png)

### 管理画面（商品管理）
![管理画面](./public/screenshots/admin-products.png)

### 管理画面（商品追加機能）
![管理画面](./public/screenshots/admin-addProducts.png)

### 管理画面（ユーザー管理）
![管理画面](./public/screenshots/admin-users.png)

### 管理画面（スタイリスト管理）
![管理画面](./public/screenshots/admin-stylists.png)

### 管理画面（スタイリスト申請管理）
![管理画面](./public/screenshots/admin-applyStylists.png)

### 管理画面（監査ログ）
![管理画面](./public/screenshots/admin-logs.png)

### 管理画面（お客様の声管理）
![管理画面](./public/screenshots/admin-reviews.png)

## 🔧 技術的な工夫

### セキュリティ
- **NextAuth.js** による認証（JWT セッション）
- **bcryptjs** によるパスワードハッシュ化（ソルトラウンド 10）
- **Prisma** でクエリを組み立て、SQL を文字列結合しない
- ログイン失敗時は、パスワード相違と未登録を同じ文言で返す
- クライアントとサーバーの両方で入力を検証する

### パフォーマンス
- Next.js App Router を使う
- 初期表示は Server Components、操作が必要な画面は Client Components に分ける
- Prisma による型の付いたデータベース操作
- 在庫・プロフィール・管理画面は、更新後に再取得する

### 開発効率
- AIツール（Cursor, Gemini, Claude）の積極活用
- TypeScriptによる型安全性の確保
- Prisma Studioによる直感的なデータ管理
- 機能を段階的に実装する

## 🚀 セットアップ

### 必要な環境
- Node.js 18以上
- Docker（ローカルの PostgreSQL を使う場合）

### インストール手順
```bash
# 1. リポジトリをクローン
git clone https://github.com/yuki-hiroe/nextjs-ec-site.git
cd nextjs-ec-site

# 2. 依存関係をインストール
npm install

# 3. プロジェクト直下に .env を作成する（内容は下記）

# 4. ローカルの PostgreSQL を起動する
docker compose up -d

# 5. マイグレーションとシード
npx prisma migrate dev
npx prisma db seed

# 6. 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開く。

### 環境変数

ローカルの Docker Postgres では、`DATABASE_URL` と `DIRECT_URL` に同じ接続文字列を書きます。Prisma のスキーマが両方を必須にしているためです。

```env
DATABASE_URL="postgresql://intercambio:intercambio_password@localhost:5432/intercambio_db"
DIRECT_URL="postgresql://intercambio:intercambio_password@localhost:5432/intercambio_db"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<GENERATED_SECRET>"
```

`NEXTAUTH_SECRET` は次のコマンドで生成します。これがないと、ログイン後のセッションが保持されません。

```bash
openssl rand -base64 32
```

Supabase を使う場合は、プーラー経由の URL を `DATABASE_URL`、直接接続の URL を `DIRECT_URL` にします。本番の URL は、ホスティング側の環境変数に公開サイトの `https` URL を設定します。ローカルの `.env` はデプロイされません。

## 📝 開発経緯

プログラミングスクールでの学習を実践で深めるため、
フロントエンドからバックエンド、データベース、認証まで
一貫した開発経験を積むことを目的に開発しました。

### 開発期間
2025年9月〜2025年11月（約2ヶ月）

### 開発プロセス
1. **要件定義**: 一般的なECサイト機能に加え、独自の価値提案を検討
2. **技術選定**: 開発当時は Next.js 15 (App Router)、Prisma、NextAuth.js を採用。その後 Next.js 16 に更新
3. **DB設計**: Prismaでリレーションとインデックスを設計
4. **段階的実装**: お客様側→管理者側→認証の順で実装
5. **AIツール活用**: Cursorで効率化しつつ、コードは必ず理解・検証

### 学んだこと
- Next.js App Routerの設計思想とSSR/CSRの使い分け
- Prismaによる効率的なデータベース操作とマイグレーション管理
- NextAuth.jsによる安全な認証実装とセキュリティベストプラクティス
- AIツールを活用した開発効率化と学習効果の両立
- TypeScriptの型システムを活かした堅牢なコード設計

## 🎯 今後の改善予定

- [ ] 外部決済サービス連携（Stripe等）
- [ ] エラーハンドリングの強化
- [ ] テストの実装（Jest, React Testing Library）

## 🚀 デモ

**本番環境:** https://nextjs-ec-site-cffg.vercel.app/

実際に動作するサイトをご覧いただけます。

### テストアカウント

お試しいただく際は、以下のアカウントをご利用ください：

`npx prisma db seed` で作成されます。

**一般ユーザー:**
- メールアドレス: `test@example.com`
- パスワード: `test123`

**管理者:**
- メールアドレス: `admin@intercambio.com`
- パスワード: `admin123`

**スタイリスト（パスワードは共通）:**
- `kento@intercambio.com`
- `naoki@intercambio.com`
- `shota@intercambio.com`
- `kazuaki@intercambio.com`
- パスワード: `stylist123`

テスト用のアカウントです。本番のデモ環境で使うには、そのデータベースに対してもシードを実行してください。

## 👤 作者

Yuki Hiroe
- GitHub: [@yuki-hiroe](https://github.com/yuki-hiroe)
- プログラミングスクール在学中
- エンジニアへの転職を目指して活動中

## 📄 ライセンス

MIT License
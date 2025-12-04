# Next.js EC Site - スタイリスト相談機能付きECサイト

お店とお客様を繋ぎ、スタイリストに相談できる機能を持ったECサイト

## 🎯 プロジェクト概要

単なる商品販売だけでなく、スタイリストへの相談機能やシーン別コレクションを通じて、
ユーザー体験を重視したECサイトです。

### 独自機能
- **スタイリスト相談**: お客様が専門スタイリストに直接相談可能
- **シーン別コレクション**: 使用シーンごとに商品を提案
- **お客様の声**: レビュー・評価機能
- **メルマガ登録機能**: 新作やコーディネートのお知らせが届く機能


## 🛠️ 技術スタック

| カテゴリ | 技術 |
|---------|------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma |
| **Authentication** | NextAuth.js |
| **Password Hashing** | bcryptjs |
| **Deployment** | Vercel |

## ✨ 主な機能

### お客様側
- ✅ 商品一覧・詳細・検索
- ✅ カート機能
- ✅ お気に入り機能
- ✅ 会員登録・ログイン（NextAuth.js）
- ✅ 購入手続き
- ✅ メルマガ登録
- ✅ スタイリスト相談
- ✅ 問い合わせ履歴機能
- ✅ 注目アイテムの表示
- ✅ シーン別コレクション閲覧
- ✅ 注文履歴

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
- ✅ 監査ログ

## 🔧 技術的な工夫

### セキュリティ
- **NextAuth.js**による安全な認証（JWT, セッション管理）
- **bcryptjs**によるパスワードハッシュ化（ソルトラウンド10）
- **Prisma ORM**によるSQLインジェクション対策
- **エラーメッセージの曖昧化**でブルートフォース攻撃を対策
- クライアント・サーバー双方でのバリデーション

### パフォーマンス
- Next.js App Routerの活用
- Server ComponentsとClient Componentsの適切な使い分け
- Prismaによる型安全なDB操作とクエリ最適化

### 開発効率
- AIツール（Cursor, GitHub Copilot, Claude）の積極活用
- TypeScriptによる型安全性の確保
- Prisma Studioによる直感的なデータ管理
- 段階的な機能実装とテスト

## 🚀 セットアップ

### 必要な環境
- Node.js 18以上
- PostgreSQL（またはSupabaseアカウント）

### インストール手順
```bash
# 1. リポジトリをクローン
git clone https://github.com/yuki-hiroe/nextjs-ec-site.git
cd nextjs-ec-site

# 2. 依存関係をインストール
npm install

# 3. 環境変数を設定
cp .env.example .env
# .env ファイルを編集（DATABASE_URL, NEXTAUTH_SECRETなど）

# 4. データベースのマイグレーション
npx prisma migrate dev

# 5. 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 を開く

### 環境変数
```env
# Database
DATABASE_URL="postgresql://postgres.xxmkatizftqbpenqesnn:watashihahiroedesu@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

DIRECT_URL="postgresql://postgres.xxmkatizftqbpenqesnn:watashihahiroedesu@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=26TAUSh0o4dgbGK+mrU8LcaxLo7e6pwLH/6H0m0hfXs=
```

NEXTAUTH_SECRETは以下のコマンドで生成:
```bash
openssl rand -base64 32
```

## 📝 開発経緯

プログラミングスクールでの学習を実践で深めるため、
フロントエンドからバックエンド、データベース、認証まで
一貫した開発経験を積むことを目的に開発しました。

### 開発期間
2024年11月〜現在進行中（約1ヶ月）

### 開発プロセス
1. **要件定義**: 一般的なECサイト機能に加え、独自の価値提案を検討
2. **技術選定**: Next.js 15 (App Router), Prisma, NextAuth.jsを採用
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

- [ ] 注文履歴表示機能（お客様側）
- [ ] パフォーマンス最適化（画像最適化、キャッシング）
- [ ] エラーハンドリングの強化
- [ ] テストの実装（Jest, React Testing Library）
- [ ] E2Eテスト（Playwright）
- [ ] Vercelへのデプロイ
- [ ] 技術ブログ記事の執筆（Qiita）

## 👤 作者

Yuki Hiroe
- GitHub: [@yuki-hiroe](https://github.com/yuki-hiroe)
- プログラミングスクール在学中
- 2027年新卒入社を目指して就職活動中

## 📄 ライセンス

MIT License
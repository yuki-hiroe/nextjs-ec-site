# Intercambio 技術スタック（面接用まとめ）

## 1. プロジェクト概要（30秒で話す場合）

「スタイリストとユーザーをつなぐ EC ・お問い合わせ・スタイリスト管理ができる Web アプリです。Next.js の App Router でフロントと API を実装し、PostgreSQL と Prisma でデータを管理、NextAuth で一般ユーザー・管理者・スタイリストの 3 種類の認証を一本化しています。」

---

## 2. 技術スタック一覧

| レイヤー | 技術 | 選定理由・役割 |
|----------|------|----------------|
| **フロント** | Next.js 16 (App Router), React 19, TypeScript | ルーティング・API・SSR を一つのフレームワークで統一 |
| **スタイル** | Tailwind CSS 4 | コンポーネント単位のスタイルとレスポンシブを効率化 |
| **状態管理** | React Context | カート・お気に入り・在庫などクライアント状態をコンテキストで共有 |
| **認証** | NextAuth.js (JWT, Credentials) | ユーザー / 管理者 / スタイリストを同一の認証基盤で運用 |
| **DB・ORM** | PostgreSQL, Prisma | 型安全なクエリとマイグレーションでスキーマを管理 |
| **デプロイ** | Vercel | Next との相性と CI/CD のしやすさ |

---

## 3. 面接で話しやすいポイント

### 「フロントエンドで工夫した点」
- **App Router** でページと API ルートを同じプロジェクトで管理し、`page.tsx` と `route.ts` で責務を分離。
- **Server / Client の切り分け**: データ取得や認証が必要な部分はサーバー、インタラクションは `"use client"` でクライアントコンポーネントに。
- **Context** でカート・お気に入り・在庫を共有し、ヘッダーや商品詳細など複数画面で一貫した状態を保持。

### 「認証まわりで工夫した点」
- **NextAuth の Credentials プロバイダー** で「一般ユーザー」「管理者」「スタイリスト」の 3 ロールを同じセッション基盤で扱うように統一（当初スタイリストは localStorage だったが、セキュリティと一貫性のため NextAuth に寄せた）。
- **middleware** で `/admin/*`・`/cart`・`/checkout`・`/stylist` を保護し、未認証時はログイン or スタイリストログインへリダイレクト。`/stylist/apply` は申請用のため公開のまま許可。

### 「バックエンド・DB で工夫した点」
- **Prisma** でスキーマをコード管理し、マイグレーションで変更履歴を残している。
- API は **Route Handler** で実装し、管理者系は `getServerSession` でロールを確認してから DB 操作。
- 監査ログ用のテーブルと `createAuditLog` で管理者操作を記録する設計にしている。

### 「運用・デプロイで意識した点」
- **Vercel** にデプロイし、Git 連携で push 時にビルド・デプロイ。環境変数で `DATABASE_URL` や `NEXTAUTH_SECRET` を管理。
- 画像は `next.config` の `images.unoptimized` や `remotePatterns` で外部 URL を扱えるようにしている。

---

## 4. 簡潔な自己紹介用（1 文〜2 文）

**短く:**  
「Next.js と TypeScript で EC とスタイリスト管理機能を持つ Web アプリを開発しました。認証は NextAuth、DB は PostgreSQL と Prisma です。」

**少し詳しく:**  
「Next.js の App Router でフロントと API を実装し、NextAuth でユーザー・管理者・スタイリストの 3 ロールを統一、Prisma で PostgreSQL を操作する構成です。カートやお気に入りは React Context、ルート保護は middleware で行っています。」

---

## 5. 想定 Q&A

**Q: なぜ Next.js を選んだか？**  
「フロントと API を一つのプロジェクトで扱え、Vercel との相性も良いため。App Router で RSC と Client Component を分けつつ、`route.ts` で API も書ける点が開発効率に合っていました。」

**Q: 認証はどう実装しているか？**  
「NextAuth の Credentials でメール・パスワード認証をしています。User テーブルで一般・管理者、Stylist テーブルでスタイリストを別々に持ちつつ、JWT の role で区別し、middleware と getServerSession で保護範囲を分けています。」

**Q: 状態管理はなぜ Context か？**  
「グローバルに必要なのはカート・お気に入り・在庫チェック程度で、サーバー状態は API 経由で都度取得しているため。Redux などを入れず、Context で足りると判断しました。」

**Q: 今後の拡張で考えていることは？**  
「認証を NextAuth に寄せたので、OAuth や MFA を追加しやすい状態にはしてあります。パフォーマンス面では、商品一覧のページネーションや API のレート制限など、スケーラビリティのドキュメントに書いた項目を順に検討する想定です。」

---

*（プロジェクトルートの README や DATABASE_SCHEMA.md などと合わせて使うと説明しやすいです。）*

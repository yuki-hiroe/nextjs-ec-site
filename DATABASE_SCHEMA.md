# データベーススキーマ設計書

## 概要

このプロジェクトは**ECサイト + スタイリストサービス**の統合プラットフォームです。  
PostgreSQLデータベースを使用し、Prisma ORMで管理されています。

**総テーブル数**: 16テーブル

---

## 目次

1. [認証・ユーザー管理](#1-認証ユーザー管理)
2. [商品・注文管理](#2-商品注文管理)
3. [スタイリストサービス](#3-スタイリストサービス)
4. [お問い合わせ・コミュニケーション](#4-お問い合わせコミュニケーション)
5. [コンテンツ・マーケティング](#5-コンテンツマーケティング)
6. [管理・監査](#6-管理監査)
7. [リレーションシップ図](#リレーションシップ図)
8. [インデックス戦略](#インデックス戦略)
9. [設計の特徴](#設計の特徴)

---

## 1. 認証・ユーザー管理

### User（ユーザー）

統合ユーザーアカウントテーブル。一般ユーザー、管理者、スタイリストのすべてを管理。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | ユーザーID |
| email | String | UNIQUE | メールアドレス |
| emailVerified | DateTime? | | メール認証日時 |
| password | String | | ハッシュ化されたパスワード |
| name | String | | 表示名 |
| lastName | String? | | 姓 |
| firstName | String? | | 名 |
| phone | String? | | 電話番号 |
| role | String | DEFAULT 'user' | ロール: user, admin, stylist |
| image | String? | | プロフィール画像URL |
| isSuspended | Boolean | DEFAULT false | アカウント一時停止フラグ |
| suspendedAt | DateTime? | | 一時停止日時 |
| suspendedReason | String? | | 一時停止理由 |
| createdAt | DateTime | DEFAULT now() | 作成日時 |
| updatedAt | DateTime | AUTO UPDATE | 更新日時 |

**リレーション**:
- `accounts`: Account[] (1対多)
- `sessions`: Session[] (1対多)
- `orders`: Order[] (1対多)
- `inquiries`: Inquiry[] (1対多)
- `newsletterSubscription`: NewsletterSubscription? (1対1)
- `testimonials`: Testimonial[] (1対多)
- `stylistRatings`: StylistRating[] (1対多)

**インデックス**:
- `email`
- `role`
- `isSuspended`

---

### Account（NextAuth用アカウント）

OAuthプロバイダー連携用のアカウント情報。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | アカウントID |
| userId | String | FK → User.id | ユーザーID |
| type | String | | アカウントタイプ |
| provider | String | | プロバイダー名 |
| providerAccountId | String | | プロバイダー側のアカウントID |
| refresh_token | String? | TEXT | リフレッシュトークン |
| access_token | String? | TEXT | アクセストークン |
| expires_at | Int? | | トークン有効期限 |
| token_type | String? | | トークンタイプ |
| scope | String? | | スコープ |
| id_token | String? | TEXT | IDトークン |
| session_state | String? | | セッション状態 |

**リレーション**:
- `user`: User (多対1)

**ユニーク制約**:
- `[provider, providerAccountId]`

**インデックス**:
- `userId`

---

### Session（NextAuth用セッション）

ユーザーセッション管理。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | セッションID |
| sessionToken | String | UNIQUE | セッショントークン |
| userId | String | FK → User.id | ユーザーID |
| expires | DateTime | | 有効期限 |

**リレーション**:
- `user`: User (多対1)

**インデックス**:
- `userId`

---

### VerificationToken（認証トークン）

メール認証などの一時トークン。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| identifier | String | | 識別子 |
| token | String | UNIQUE | トークン |
| expires | DateTime | | 有効期限 |

**ユニーク制約**:
- `[identifier, token]`

---

## 2. 商品・注文管理

### Product（商品）

商品情報テーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | 商品ID |
| slug | String | UNIQUE | URL用スラッグ |
| name | String | | 商品名 |
| price | String | | 価格 |
| tagline | String | | キャッチコピー |
| description | String | | 説明文 |
| image | String | | メイン画像URL |
| stock | Int | DEFAULT 0 | 在庫数 |
| badges | Json | DEFAULT "[]" | バッジ（JSON配列） |
| features | Json | DEFAULT "[]" | 特徴（JSON配列） |
| specs | Json | DEFAULT "{}" | 仕様（JSONオブジェクト） |
| shipping | String | | 配送情報 |
| care | String | | お手入れ方法 |
| images | Json | DEFAULT "[]" | 画像一覧（JSON配列） |
| createdAt | DateTime | DEFAULT now() | 作成日時 |
| updatedAt | DateTime | AUTO UPDATE | 更新日時 |

**リレーション**:
- `orderItems`: OrderItem[] (1対多)
- `relatedProducts`: ProductRelation[] (1対多) - この商品に関連する商品
- `relatedToProducts`: ProductRelation[] (1対多) - この商品に関連付けられた商品

**インデックス**:
- `slug`
- `stock`

---

### ProductRelation（商品関連付け）

商品間の関連付け（おすすめ商品など）。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | 関連付けID |
| productId | String | FK → Product.id | 商品ID |
| relatedId | String | FK → Product.id | 関連商品ID |
| createdAt | DateTime | DEFAULT now() | 作成日時 |

**リレーション**:
- `product`: Product (多対1) - 元の商品
- `related`: Product (多対1) - 関連商品

**ユニーク制約**:
- `[productId, relatedId]` - 同じ商品の重複関連付けを防止

**インデックス**:
- `productId`
- `relatedId`

---

### Order（注文）

注文情報テーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | 注文ID |
| orderNumber | String | UNIQUE | 注文番号 |
| total | Int | | 合計金額（円） |
| shippingFee | Int | DEFAULT 0 | 配送料 |
| paymentMethod | String | | 支払い方法 |
| status | String | DEFAULT 'pending' | ステータス: pending, confirmed, shipped, completed, cancelled |
| userId | String? | FK → User.id | ユーザーID（ログイン済みの場合） |
| lastName | String | | 配送先姓 |
| firstName | String | | 配送先名 |
| lastNameKana | String | | 配送先姓（カナ） |
| firstNameKana | String | | 配送先名（カナ） |
| postalCode | String | | 郵便番号 |
| prefecture | String | | 都道府県 |
| city | String | | 市区町村 |
| address | String | | 番地 |
| building | String? | | 建物名 |
| phone | String | | 電話番号 |
| email | String | | メールアドレス |
| notes | String? | | 備考 |
| cardLast4 | String? | | クレジットカード下4桁 |
| cardExpiryMonth | String? | | カード有効期限（月） |
| cardExpiryYear | String? | | カード有効期限（年） |
| createdAt | DateTime | DEFAULT now() | 作成日時 |
| updatedAt | DateTime | AUTO UPDATE | 更新日時 |

**リレーション**:
- `user`: User? (多対1)
- `items`: OrderItem[] (1対多)

**インデックス**:
- `orderNumber`
- `email`
- `status`
- `userId`

---

### OrderItem（注文明細）

注文に含まれる商品の詳細。注文時点の価格・商品名を保存（スナップショット）。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | 明細ID |
| orderId | String | FK → Order.id | 注文ID |
| productId | String | FK → Product.id | 商品ID |
| quantity | Int | | 数量 |
| price | String | | 商品価格（注文時点） |
| name | String | | 商品名（注文時点） |

**リレーション**:
- `order`: Order (多対1)
- `product`: Product? (多対1)

**インデックス**:
- `orderId`
- `productId`

---

## 3. スタイリストサービス

### Stylist（スタイリスト）

スタイリスト情報テーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | スタイリストID |
| name | String | | 名前 |
| nameEn | String? | | 英語名 |
| bio | String | | 自己紹介 |
| specialties | Json | DEFAULT "[]" | 専門分野（JSON配列） |
| image | String? | | プロフィール画像URL |
| email | String | UNIQUE | メールアドレス |
| password | String? | | ハッシュ化されたパスワード（スタイリストログイン用） |
| isActive | Boolean | DEFAULT true | 有効/無効フラグ |
| createdAt | DateTime | DEFAULT now() | 作成日時 |
| updatedAt | DateTime | AUTO UPDATE | 更新日時 |

**リレーション**:
- `inquiries`: Inquiry[] (1対多)
- `ratings`: StylistRating[] (1対多)

**インデックス**:
- `isActive`
- `email`

---

### StylistApplication（スタイリスト申請）

スタイリスト登録申請の一時保存テーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | 申請ID |
| name | String | | 名前 |
| nameEn | String? | | 英語名 |
| bio | String | | 自己紹介 |
| specialties | Json | DEFAULT "[]" | 専門分野（JSON配列） |
| image | String? | | プロフィール画像URL |
| email | String | | メールアドレス |
| password | String? | | ハッシュ化されたパスワード（申請時に設定可能） |
| status | String | DEFAULT 'pending' | ステータス: pending, approved, rejected |
| notes | String? | | 管理者によるメモ |
| createdAt | DateTime | DEFAULT now() | 作成日時 |
| updatedAt | DateTime | AUTO UPDATE | 更新日時 |

**インデックス**:
- `email`
- `status`
- `createdAt`

---

### StylistRating（スタイリスト評価）

ユーザーによるスタイリスト評価テーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | 評価ID |
| stylistId | String | FK → Stylist.id | スタイリストID |
| userId | String | FK → User.id | 評価したユーザーID |
| rating | Int | | 評価（1-5） |
| comment | String? | TEXT | コメント（任意） |
| inquiryId | String? | FK → Inquiry.id | 関連するお問い合わせID（任意） |
| createdAt | DateTime | DEFAULT now() | 作成日時 |
| updatedAt | DateTime | AUTO UPDATE | 更新日時 |

**リレーション**:
- `stylist`: Stylist (多対1)
- `user`: User (多対1)
- `inquiry`: Inquiry? (多対1)

**ユニーク制約**:
- `[stylistId, userId]` - 1ユーザーは1スタイリストに対して1回のみ評価可能

**インデックス**:
- `stylistId`
- `userId`
- `rating`
- `createdAt`

---

## 4. お問い合わせ・コミュニケーション

### Inquiry（お問い合わせ）

お問い合わせテーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | お問い合わせID |
| name | String | | お名前 |
| email | String | | メールアドレス |
| inquiryType | String | | 種類: styling, product, order, other |
| message | String | | メッセージ内容 |
| status | String | DEFAULT 'new' | ステータス: new, in_progress, resolved |
| userId | String? | FK → User.id | ユーザーID（ログイン済みの場合） |
| stylistId | String? | FK → Stylist.id | スタイリストID（スタイリング相談の場合） |
| createdAt | DateTime | DEFAULT now() | 作成日時 |
| updatedAt | DateTime | AUTO UPDATE | 更新日時 |

**リレーション**:
- `user`: User? (多対1)
- `stylist`: Stylist? (多対1)
- `replies`: InquiryReply[] (1対多)
- `ratings`: StylistRating[] (1対多)

**インデックス**:
- `email`
- `status`
- `createdAt`
- `userId`
- `stylistId`

---

### InquiryReply（お問い合わせ返信）

お問い合わせへの返信テーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | 返信ID |
| inquiryId | String | FK → Inquiry.id | お問い合わせID |
| message | String | | 返信メッセージ |
| fromType | String | | 返信者タイプ: "stylist" or "user" |
| fromEmail | String? | | 返信者のメールアドレス（スタイリストの場合） |
| fromName | String? | | 返信者の名前（スタイリストの場合） |
| isRead | Boolean | DEFAULT false | 既読フラグ |
| createdAt | DateTime | DEFAULT now() | 作成日時 |
| updatedAt | DateTime | AUTO UPDATE | 更新日時 |

**リレーション**:
- `inquiry`: Inquiry (多対1)

**インデックス**:
- `inquiryId`
- `createdAt`
- `isRead`

---

## 5. コンテンツ・マーケティング

### Testimonial（お客様の声）

顧客レビュー・推薦文テーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | お客様の声ID |
| name | String | | 投稿者名 |
| role | String? | | 役職・職業（オプショナル） |
| comment | String | | コメント内容 |
| userId | String? | FK → User.id | ログインユーザーのID（オプショナル） |
| email | String? | | メールアドレス（非公開、管理者確認用） |
| isApproved | Boolean | DEFAULT false | 承認フラグ |
| createdAt | DateTime | DEFAULT now() | 作成日時 |
| updatedAt | DateTime | AUTO UPDATE | 更新日時 |

**リレーション**:
- `user`: User? (多対1)

**インデックス**:
- `userId`
- `isApproved`
- `createdAt`

---

### NewsletterSubscription（ニュースレター購読）

メールマガジン購読者管理テーブル。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | 購読ID |
| email | String | UNIQUE | メールアドレス |
| userId | String? | UNIQUE, FK → User.id | ログインユーザーのID（オプショナル、1対1関係） |
| isActive | Boolean | DEFAULT true | 配信停止フラグ |
| createdAt | DateTime | DEFAULT now() | 作成日時 |
| updatedAt | DateTime | AUTO UPDATE | 更新日時 |

**リレーション**:
- `user`: User? (1対1)

**インデックス**:
- `email`
- `userId`
- `isActive`
- `createdAt`

---

## 6. 管理・監査

### AuditLog（監査ログ）

管理者操作の記録テーブル。セキュリティ監査とコンプライアンス対応に使用。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | String | PK, cuid | ログID |
| action | String | | 操作種別: delete, suspend, activate, update |
| targetType | String | | 対象タイプ: user, order, product, stylist, inquiry |
| targetId | String | | 対象ID |
| targetEmail | String? | | 対象ユーザーのメールアドレス（検索用） |
| reason | String | | 操作理由（必須） |
| details | Json? | | 詳細情報（変更前後の値など、JSON形式） |
| performedBy | String | | 実行者ID（管理者のUser ID） |
| performedByEmail | String | | 実行者メールアドレス（検索用） |
| ipAddress | String? | | IPアドレス |
| userAgent | String? | | User Agent |
| createdAt | DateTime | DEFAULT now() | 作成日時 |

**インデックス**:
- `action`
- `targetType`
- `targetId`
- `targetEmail`
- `performedBy`
- `performedByEmail`
- `createdAt`

---

## リレーションシップ図

```
User (ユーザー)
├── accounts (1対多) → Account
├── sessions (1対多) → Session
├── orders (1対多) → Order
├── inquiries (1対多) → Inquiry
├── newsletterSubscription (1対1) → NewsletterSubscription
├── testimonials (1対多) → Testimonial
└── stylistRatings (1対多) → StylistRating

Order (注文)
├── user (多対1) → User
└── items (1対多) → OrderItem
    └── product (多対1) → Product

Product (商品)
├── orderItems (1対多) → OrderItem
└── relations (自己参照)
    ├── relatedProducts (1対多) → ProductRelation
    └── relatedToProducts (1対多) → ProductRelation

Stylist (スタイリスト)
├── inquiries (1対多) → Inquiry
└── ratings (1対多) → StylistRating

Inquiry (お問い合わせ)
├── user (多対1) → User
├── stylist (多対1) → Stylist
├── replies (1対多) → InquiryReply
└── ratings (1対多) → StylistRating

StylistRating (スタイリスト評価)
├── stylist (多対1) → Stylist
├── user (多対1) → User
└── inquiry (多対1) → Inquiry
```

---

## インデックス戦略

### 検索・フィルタリング用インデックス

- **メールアドレス**: `User.email`, `Stylist.email`, `Order.email`, `Inquiry.email`, `NewsletterSubscription.email`
- **ステータス**: `Order.status`, `Inquiry.status`, `StylistApplication.status`
- **日時**: `createdAt`（多くのテーブル）
- **外部キー**: リレーション検索用（`userId`, `orderId`, `stylistId`など）

### ユニーク制約

- `User.email`
- `Stylist.email`
- `Order.orderNumber`
- `Product.slug`
- `NewsletterSubscription.email`
- `ProductRelation.[productId, relatedId]`
- `StylistRating.[stylistId, userId]`

---

## 設計の特徴

### 1. スナップショットパターン

**OrderItem**テーブルに注文時点の価格・商品名を保存することで、商品情報が変更されても注文履歴は正確に保持されます。

```typescript
OrderItem {
  price: String  // 注文時点の価格
  name: String   // 注文時点の商品名
}
```

### 2. 柔軟なJSONフィールド

以下のフィールドでJSONを使用し、スキーマ変更なしで拡張可能：

- `Product.badges`: バッジ配列
- `Product.features`: 特徴配列
- `Product.specs`: 仕様オブジェクト
- `Product.images`: 画像配列
- `Stylist.specialties`: 専門分野配列
- `AuditLog.details`: 変更前後の詳細情報

### 3. ソフトデリート・状態管理

削除ではなく状態管理でデータを保持：

- `User.isSuspended`: アカウント停止（削除しない）
- `Order.status`: 注文ステータス管理
- `Stylist.isActive`: スタイリストの有効/無効
- `Inquiry.status`: お問い合わせの進捗管理

### 4. 監査ログによる追跡可能性

すべての管理者操作を`AuditLog`テーブルに記録：

- 操作種別（action）
- 対象情報（targetType, targetId, targetEmail）
- 操作理由（reason）
- 変更前後の詳細（details: JSON）
- 実行者情報（performedBy, performedByEmail）
- アクセス情報（ipAddress, userAgent）

### 5. セキュリティ対策

- **パスワード**: すべてハッシュ化（bcrypt）
- **クレジットカード情報**: 最後4桁のみ保存（`cardLast4`）
- **監査ログ**: すべての管理者操作を記録
- **アカウント管理**: ソフトデリートで削除履歴を保持

### 6. 多様なユーザータイプの統合

`User`テーブルで`role`フィールドにより、一般ユーザー・管理者・スタイリストを統合管理：

- `role: "user"`: 一般ユーザー
- `role: "admin"`: 管理者
- `role: "stylist"`: スタイリスト（ただし、専用の`Stylist`テーブルも存在）

### 7. オプショナルなリレーション

多くのテーブルで`userId`がオプショナル（`String?`）になっており、ログインしていないユーザーも利用可能：

- `Order.userId`: ゲスト注文対応
- `Inquiry.userId`: ゲストお問い合わせ対応
- `Testimonial.userId`: ゲストレビュー対応

---

## データベース接続情報

- **データベース**: PostgreSQL
- **ORM**: Prisma
- **接続URL**: 環境変数 `DATABASE_URL`（接続プーラー経由）
- **直接接続URL**: 環境変数 `DIRECT_URL`（マイグレーション・Prisma Studio用）

---

## 更新履歴

- 2026年1月19日: 初版作成

---

## 参考資料

- Prisma Schema: `/prisma/schema.prisma`
- Prisma Documentation: https://www.prisma.io/docs

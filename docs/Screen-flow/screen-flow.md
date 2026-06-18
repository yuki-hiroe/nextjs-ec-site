# Intercambio 画面遷移図

**全画面数:** 33（404含む）  
**ロール:** 一般ユーザー / スタイリスト / 管理者

---

## 全体構成（ロール別）

```mermaid
flowchart TB
    subgraph Public["公開画面（未ログイン可）"]
        TOP["/ トップ"]
        PRODUCTS["/products 商品一覧"]
        PRODUCT_DETAIL["/products/[slug] 商品詳細"]
        COLLECTIONS["/collections コレクション"]
        COLLECTION_DETAIL["/collections/[slug]"]
        STYLISTS["/stylists スタイリスト一覧"]
        STYLIST_DETAIL["/stylists/[id] スタイリスト詳細"]
        TESTIMONIALS["/testimonials お客様の声"]
        CONTACT["/contact お問い合わせ"]
        FAVORITES["/favorites お気に入り"]
        LOGIN["/login ログイン"]
        REGISTER["/register 新規登録"]
        STYLIST_LOGIN["/stylist/login"]
        STYLIST_APPLY["/stylist/apply 申請"]
        ADMIN_LOGIN["/admin/login"]
    end

    subgraph User["一般ユーザー（要ログイン）"]
        CART["/cart カート"]
        CHECKOUT["/checkout 購入手続き"]
        COMPLETE["/checkout/complete 完了"]
        INQUIRIES["/inquiries お問い合わせ履歴"]
        PROFILE["/profile マイページ"]
    end

    subgraph Stylist["スタイリスト（要ログイン）"]
        STYLIST_DASH["/stylist ダッシュボード"]
    end

    subgraph Admin["管理者（要ログイン）"]
        ADMIN["/admin ダッシュボード"]
        ADMIN_PRODUCTS["/admin/products"]
        ADMIN_PRODUCT_NEW["/admin/products/new"]
        ADMIN_PRODUCT_EDIT["/admin/products/[id]/edit"]
        ADMIN_ORDERS["/admin/orders"]
        ADMIN_INQUIRIES["/admin/inquiries"]
        ADMIN_STYLISTS["/admin/stylists"]
        ADMIN_STYLIST_NEW["/admin/stylists/new"]
        ADMIN_STYLIST_APP["/admin/stylists/applications"]
        ADMIN_USERS["/admin/users"]
        ADMIN_TESTIMONIALS["/admin/testimonials"]
        ADMIN_AUDIT["/admin/audit-logs"]
    end

    TOP --> PRODUCTS & COLLECTIONS & STYLISTS & TESTIMONIALS & CONTACT
    PRODUCTS --> PRODUCT_DETAIL
    COLLECTIONS --> COLLECTION_DETAIL
    STYLISTS --> STYLIST_DETAIL
    STYLIST_DETAIL --> CONTACT
    PRODUCT_DETAIL --> CART
    FAVORITES --> CART
    CART -->|未ログイン| LOGIN
    CART --> CHECKOUT
    CHECKOUT -->|未ログイン| LOGIN
    CHECKOUT --> COMPLETE
    LOGIN --> REGISTER
    LOGIN --> STYLIST_LOGIN
    LOGIN --> ADMIN_LOGIN
    LOGIN -->|成功| TOP & CART & ADMIN
    STYLIST_LOGIN -->|成功| STYLIST_DASH
    ADMIN_LOGIN -->|成功| ADMIN
    CONTACT --> INQUIRIES
    ADMIN --> ADMIN_PRODUCTS & ADMIN_ORDERS & ADMIN_INQUIRIES
    ADMIN_PRODUCTS --> ADMIN_PRODUCT_NEW & ADMIN_PRODUCT_EDIT
    ADMIN_STYLISTS --> ADMIN_STYLIST_NEW & ADMIN_STYLIST_APP
```

---

## 一般ユーザー：購入フロー

```mermaid
flowchart LR
    A["/products<br/>商品一覧"] --> B["/products/[slug]<br/>商品詳細"]
    B --> C["/cart<br/>カート"]
    C -->|未ログイン| D["/login"]
    D --> C
    C --> E["/checkout<br/>購入手続き"]
    E -->|未ログイン| D
    E --> F["/checkout/complete<br/>注文完了"]
    F --> A
    F --> G["/ トップ"]

    B -.->|お気に入り| H["/favorites"]
    H --> C
```

**認証:** `/cart` `/checkout` は Middleware で保護（未ログイン → `/login`）

---

## 一般ユーザー：相談・お問い合わせフロー

```mermaid
flowchart LR
    A["/stylists<br/>スタイリスト一覧"] --> B["/stylists/[id]<br/>プロフィール"]
    B --> C["/contact<br/>お問い合わせ"]
    A --> C
    C -->|送信後| D["/inquiries<br/>お問い合わせ履歴"]
    D -->|返信・評価| D
    B --> D

    E["/ トップ"] --> C
    F["Header<br/>Contact"] --> C
```

---

## スタイリストフロー

```mermaid
flowchart TB
    A["/stylist/login<br/>スタイリストログイン"] -->|成功| B["/stylist<br/>ダッシュボード"]
    A --> C["/stylist/apply<br/>登録申請"]
    C --> D["/ トップ"]
    A --> E["/login<br/>一般ログイン"]
    B -->|相談対応・返信| B
    B -->|ログアウト| D

    F["Header"] -->|スタイリストログイン時| B
```

**認証:** `/stylist` は Middleware で保護（未ログイン or 非stylist → `/stylist/login`）

---

## 管理者フロー

```mermaid
flowchart TB
    A["/admin/login<br/>管理者ログイン"] -->|成功| B["/admin<br/>ダッシュボード"]

    B --> C["/admin/products<br/>商品管理"]
    B --> D["/admin/orders<br/>注文管理"]
    B --> E["/admin/inquiries<br/>お問い合わせ管理"]
    B --> F["/admin/stylists<br/>スタイリスト管理"]
    B --> G["/admin/users<br/>ユーザー管理"]
    B --> H["/admin/testimonials<br/>お客様の声管理"]
    B --> I["/admin/audit-logs<br/>監査ログ"]

    C --> J["/admin/products/new<br/>商品追加"]
    C --> K["/admin/products/[id]/edit<br/>商品編集"]
    J --> C
    K --> C

    F --> L["/admin/stylists/new<br/>スタイリスト追加"]
    F --> M["/admin/stylists/applications<br/>申請管理"]
    L --> F
    M --> F

    A --> N["/login<br/>一般ログイン"]
    A --> O["/ トップ"]
```

**認証:** `/admin/*`（`/admin/login` 除く）は Middleware で保護（非admin → `/` または `/login`）

---

## 認証・ログイン導線

```mermaid
flowchart TB
    subgraph Entry["ログイン入口"]
        L1["/login<br/>一般ユーザー"]
        L2["/stylist/login<br/>スタイリスト"]
        L3["/admin/login<br/>管理者"]
    end

    L1 <-->|相互リンク| L2
    L1 <-->|相互リンク| L3
    L2 --> APPLY["/stylist/apply"]
    L1 --> REG["/register"]

    L1 -->|credentials 成功| R1{"role?"}
    R1 -->|user| HOME["/ または callbackUrl"]
    R1 -->|admin| ADM["/admin"]

    L2 -->|stylist 成功| STY["/stylist"]
    L3 -->|admin 成功| ADM

    CART["/cart"] -->|未ログイン| L1
    CHECK["/checkout"] -->|未ログイン| L1
```

---

## グローバルナビゲーション（Header）

一般画面・スタイリスト／管理者画面以外で表示。

```mermaid
flowchart LR
    H["Header"] --> TOP["/"]
    H --> P["/products"]
    H --> ST["/stylists"]
    H --> F["/favorites"]
    H --> C["/cart"]
    H --> CT["/contact"]

    H -->|ログイン済| IQ["/inquiries"]
    H -->|ログイン済| PR["/profile"]
    H -->|スタイリスト| SD["/stylist"]

    H -->|未ログイン| LG["/login"]
    H -->|未ログイン| RG["/register"]
```

---

## 画面一覧

### 公開画面

| パス | 画面名 | 備考 |
|------|--------|------|
| `/` | トップ | 注目商品・コレクション・お客様の声 |
| `/products` | 商品一覧 | |
| `/products/[slug]` | 商品詳細 | カート追加 |
| `/collections` | コレクション一覧 | |
| `/collections/[slug]` | コレクション詳細 | |
| `/stylists` | スタイリスト一覧 | |
| `/stylists/[id]` | スタイリスト詳細 | 相談へ誘導 |
| `/testimonials` | お客様の声 | |
| `/contact` | お問い合わせ | スタイリスト指定可 |
| `/favorites` | お気に入り | localStorage ベース |
| `/login` | ログイン | 一般ユーザー |
| `/register` | 新規登録 | |
| `/stylist/login` | スタイリストログイン | |
| `/stylist/apply` | スタイリスト申請 | |
| `/admin/login` | 管理者ログイン | |

### 一般ユーザー（要ログイン）

| パス | 画面名 | 保護 |
|------|--------|------|
| `/cart` | カート | Middleware |
| `/checkout` | 購入手続き | Middleware |
| `/checkout/complete` | 注文完了 | 購入後遷移 |
| `/inquiries` | お問い合わせ履歴 | セッション利用 |
| `/profile` | マイページ | Server redirect |

### スタイリスト（要ログイン）

| パス | 画面名 | 保護 |
|------|--------|------|
| `/stylist` | ダッシュボード | Middleware（role=stylist） |

### 管理者（要ログイン）

| パス | 画面名 | 保護 |
|------|--------|------|
| `/admin` | ダッシュボード | Middleware（role=admin） |
| `/admin/products` | 商品管理 | 同上 |
| `/admin/products/new` | 商品追加 | 同上 |
| `/admin/products/[id]/edit` | 商品編集 | 同上 |
| `/admin/orders` | 注文管理 | 同上 |
| `/admin/inquiries` | お問い合わせ管理 | 同上 |
| `/admin/stylists` | スタイリスト管理 | 同上 |
| `/admin/stylists/new` | スタイリスト追加 | 同上 |
| `/admin/stylists/applications` | 申請管理 | 同上 |
| `/admin/users` | ユーザー管理 | 同上 |
| `/admin/testimonials` | お客様の声管理 | 同上 |
| `/admin/audit-logs` | 監査ログ | 同上 |

### その他

| パス | 画面名 |
|------|--------|
| `not-found` | 404ページ → `/` `/products` へ誘導 |

---

## Middleware 保護ルート

```
/admin/:path*     → admin ロール必須（/admin/login は除外）
/cart             → ログイン必須
/checkout         → ログイン必須
/stylist          → stylist ロール必須
/stylist/:path*   → /stylist/login, /stylist/apply は除外
```

---

## 画像化の手順（Canva 用）

| スライド | 使う図 |
|---------|--------|
| 1 | 全体構成（ロール別） |
| 2 | 購入フロー |
| 3 | 相談フロー |
| 4 | 管理者フロー |
| 5 | 画面一覧表 |

1. [Mermaid Live Editor](https://mermaid.live/) を開く
2. 上記コードを貼り付け
3. **Actions → PNG / SVG** でエクスポート
4. Canva に配置

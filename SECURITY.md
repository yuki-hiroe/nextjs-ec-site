# セキュリティ管理ドキュメント

このドキュメントでは、Intercambioアプリケーションのセキュリティ管理の実装について説明します。

## 📋 目次

1. [認証・認可](#認証認可)
2. [パスワード管理](#パスワード管理)
3. [セッション管理](#セッション管理)
4. [API セキュリティ](#api-セキュリティ)
5. [データ保護](#データ保護)
6. [監査ログ](#監査ログ)
7. [入力検証](#入力検証)
8. [既知のセキュリティリスク](#既知のセキュリティリスク)
9. [推奨される改善点](#推奨される改善点)

---

## 認証・認可

### 1. ユーザー認証（NextAuth.js）

**実装場所**: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`

- **認証プロバイダー**: Credentials Provider（メールアドレス/パスワード）
- **セッション戦略**: JWT（JSON Web Token）
- **アダプター**: Prisma Adapter（データベース連携）

```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [CredentialsProvider({ ... })],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
}
```

**特徴**:
- ✅ JWTトークンにユーザーIDとロール情報を含める
- ✅ セッション情報にロール情報を含める
- ✅ 環境変数 `NEXTAUTH_SECRET` でシークレット管理

### 2. ルート保護（ミドルウェア）

**実装場所**: `middleware.ts`

```typescript
// middleware.ts
export default withAuth(
  function middleware(req) {
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (req.nextauth.token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url))
      }
    }
  }
)
```

**保護対象**:
- `/admin/*` - 管理者のみアクセス可能
- `/checkout` - 認証済みユーザーのみ
- `/cart` - 認証済みユーザーのみ

**特徴**:
- ✅ NextAuth.jsのミドルウェアを使用
- ✅ トークンのロール情報で権限チェック
- ✅ 未認証ユーザーは `/login` にリダイレクト

### 3. 管理者認証

**実装場所**: `lib/admin-auth.ts`, `app/api/auth/admin/login/route.ts`

**認証方法**:
1. メールアドレス/パスワードでログイン
2. 管理者権限（`role === "admin"`）をチェック
3. パスワード検証（bcrypt）
4. 管理者情報を返す

**API保護**:
- `verifyAdmin()` 関数で管理者APIを保護
- リクエストボディから `adminId` を取得して検証

⚠️ **セキュリティリスク**: 管理者認証情報を `localStorage` に保存（後述）

---

## パスワード管理

### ハッシュ化

**実装場所**: `app/api/auth/register/route.ts`, `app/api/auth/login/route.ts`

```typescript
// パスワードハッシュ化（登録時）
const hashedPassword = await bcrypt.hash(password, 10);

// パスワード検証（ログイン時）
const isValidPassword = await bcrypt.compare(password, user.password);
```

**特徴**:
- ✅ **bcryptjs** を使用（salt rounds: 10）
- ✅ パスワードは平文で保存されない
- ✅ データベースにはハッシュ値のみ保存

### パスワードポリシー

**実装場所**: `app/api/auth/register/route.ts`

```typescript
if (password.length < 6) {
  return NextResponse.json(
    { error: "パスワードは6文字以上である必要があります" },
    { status: 400 }
  );
}
```

**現在のポリシー**:
- ✅ 最小6文字
- ❌ 複雑さ要件なし（大文字・小文字・数字・記号の組み合わせ）
- ❌ パスワード履歴管理なし
- ❌ パスワード有効期限なし

---

## セッション管理

### 1. 通常ユーザー（NextAuth.js）

**実装場所**: `lib/auth.ts`

- **セッション戦略**: JWT
- **トークン有効期限**: NextAuth.jsのデフォルト設定
- **保存場所**: HTTP-only Cookie（ブラウザ）

**特徴**:
- ✅ セキュアなHTTP-only Cookie
- ✅ サーバーサイドで検証可能
- ✅ ロール情報を含む

### 2. 管理者（localStorage）

**実装場所**: `app/admin/login/page.tsx`

```typescript
// 管理者情報をlocalStorageに保存
localStorage.setItem("admin", JSON.stringify(data.admin));
```

⚠️ **重大なセキュリティリスク**:
- ❌ XSS攻撃に対して脆弱
- ❌ JavaScriptからアクセス可能
- ❌ HTTP-only Cookieではない
- ❌ セキュアなセッション管理ではない

**推奨**: NextAuth.jsのセッション管理に統一すべき

---

## API セキュリティ

### 1. 管理者API保護

**実装場所**: `lib/admin-auth.ts`

```typescript
export async function verifyAdmin(request: Request) {
  const body = await request.clone().json().catch(() => ({}));
  const adminId = body.adminId;
  
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { id: true, email: true, name: true, role: true },
  });
  
  if (!admin || admin.role !== "admin") {
    return { error: NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 }) };
  }
}
```

**保護対象**:
- `/api/admin/*` - すべての管理者API

⚠️ **セキュリティリスク**:
- ❌ リクエストボディから `adminId` を取得（改ざん可能）
- ❌ トークンベースの認証ではない
- ❌ CSRF対策が不十分

### 2. 通常ユーザーAPI

**実装場所**: 各API Route

- 認証が必要なAPIは `useSession()` や `getServerSession()` で検証
- ユーザーIDの検証を実装

---

## データ保護

### 1. データベース

**ORM**: Prisma

**特徴**:
- ✅ **SQLインジェクション対策**: Prismaのパラメータ化クエリ
- ✅ 型安全なクエリ
- ✅ 自動エスケープ

### 2. 機密情報の保存

**クレジットカード情報**:
```typescript
// prisma/schema.prisma
// 支払い情報（クレジットカードの場合）
cardLast4       String?  // 下4桁のみ保存
cardExpiryMonth String?
cardExpiryYear  String?
```

**特徴**:
- ✅ 完全なカード番号は保存しない
- ✅ 下4桁のみ保存（表示用）
- ⚠️ 有効期限情報は保存（セキュリティリスク）

**推奨**: 決済処理はStripe等の外部サービスを使用し、カード情報は一切保存しない

### 3. 環境変数管理

**実装場所**: `.gitignore`

```gitignore
# env files (can opt-in for committing if needed)
.env*
```

**特徴**:
- ✅ 環境変数ファイルをGitから除外
- ✅ 機密情報の漏洩を防止

**必要な環境変数**:
- `DATABASE_URL` - データベース接続文字列
- `DIRECT_URL` - 直接接続URL
- `NEXTAUTH_SECRET` - NextAuth.jsのシークレット
- `NEXTAUTH_URL` - NextAuth.jsのURL

---

## 監査ログ

### 実装

**実装場所**: `lib/audit-log.ts`, `prisma/schema.prisma`

**記録内容**:
- 操作種別（action）: `delete`, `suspend`, `activate`, `update`
- 対象タイプ（targetType）: `user`, `order`, `product`, `stylist`, `inquiry`
- 対象ID（targetId）
- 対象メールアドレス（targetEmail）
- 操作理由（reason）: **必須**
- 詳細情報（details）: JSON形式（変更前後の値など）
- 実行者ID（performedBy）
- 実行者メールアドレス（performedByEmail）
- IPアドレス（ipAddress）
- User Agent（userAgent）
- 作成日時（createdAt）

**記録される操作**:
- ✅ ユーザー削除
- ✅ ユーザー一時停止/有効化
- ✅ ユーザー情報更新
- ✅ 注文ステータス更新

**特徴**:
- ✅ すべての管理者操作を記録
- ✅ IPアドレスとUser Agentを記録
- ✅ 操作理由を必須化
- ✅ 変更前後の値を記録（更新操作）

---

## 入力検証

### 1. 基本的なバリデーション

**実装場所**: 各API Route

**例**: `app/api/auth/register/route.ts`

```typescript
// バリデーション
if (!email || !password || !name) {
  return NextResponse.json(
    { error: "メールアドレス、パスワード、名前は必須です" },
    { status: 400 }
  );
}

if (password.length < 6) {
  return NextResponse.json(
    { error: "パスワードは6文字以上である必要があります" },
    { status: 400 }
  );
}
```

**特徴**:
- ✅ 必須項目のチェック
- ✅ パスワード長の検証
- ⚠️ メールアドレスの形式検証が不十分
- ⚠️ 入力サニタイゼーションが不十分

### 2. データベース制約

**実装場所**: `prisma/schema.prisma`

```typescript
model User {
  email String @unique  // 一意制約
  // ...
}
```

**特徴**:
- ✅ データベースレベルでの一意制約
- ✅ 型安全性

---

## 既知のセキュリティリスク

### 🔴 重大

1. **管理者認証情報のlocalStorage保存**
   - 場所: `app/admin/login/page.tsx`
   - リスク: XSS攻撃に対して脆弱
   - 影響: 管理者アカウントの乗っ取り

2. **管理者API認証の脆弱性**
   - 場所: `lib/admin-auth.ts`
   - リスク: リクエストボディから `adminId` を取得（改ざん可能）
   - 影響: 権限昇格攻撃

### 🟡 中程度

3. **パスワードポリシーの弱さ**
   - 最小6文字のみ
   - 複雑さ要件なし
   - 影響: ブルートフォース攻撃に脆弱

4. **入力サニタイゼーションの不足**
   - XSS対策が不十分
   - 影響: クロスサイトスクリプティング攻撃

5. **CSRF対策の不十分**
   - 管理者APIにCSRFトークンなし
   - 影響: クロスサイトリクエストフォージェリ攻撃

### 🟢 軽微

6. **クレジットカード情報の保存**
   - 有効期限情報を保存
   - 推奨: 外部決済サービスを使用

7. **セッション有効期限の管理**
   - 明示的な有効期限設定なし
   - 影響: セッションハイジャックのリスク

---

## 推奨される改善点

### 優先度: 高

1. **管理者認証の改善**
   - [ ] NextAuth.jsのセッション管理に統一
   - [ ] localStorageの使用を廃止
   - [ ] HTTP-only Cookieでセッション管理

2. **API認証の強化**
   - [ ] JWTトークンベースの認証に変更
   - [ ] リクエストボディではなくヘッダーから認証情報を取得
   - [ ] CSRFトークンの実装

3. **パスワードポリシーの強化**
   - [ ] 最小8文字以上
   - [ ] 複雑さ要件の追加（大文字・小文字・数字・記号）
   - [ ] パスワード履歴管理
   - [ ] レート制限（ブルートフォース対策）

### 優先度: 中

4. **入力検証の強化**
   - [ ] メールアドレスの形式検証
   - [ ] 入力サニタイゼーション（XSS対策）
   - [ ] ファイルアップロードの検証（もしあれば）

5. **セッション管理の改善**
   - [ ] セッション有効期限の明示的な設定
   - [ ] セッション無効化機能
   - [ ] 同時ログイン数の制限

6. **監査ログの拡張**
   - [ ] ログイン試行の記録
   - [ ] 失敗した認証試行の記録
   - [ ] 異常なアクセスパターンの検出

### 優先度: 低

7. **その他**
   - [ ] 2要素認証（2FA）の実装
   - [ ] レート制限の実装（API全体）
   - [ ] セキュリティヘッダーの追加（CSP, HSTS等）
   - [ ] 定期的なセキュリティ監査

---

## セキュリティチェックリスト

### 開発時

- [ ] 環境変数が `.gitignore` に含まれている
- [ ] パスワードがハッシュ化されている
- [ ] 機密情報がコードにハードコードされていない
- [ ] SQLインジェクション対策（Prisma使用）
- [ ] 認証が必要なAPIが保護されている

### デプロイ時

- [ ] 環境変数が正しく設定されている
- [ ] `NEXTAUTH_SECRET` が強力な値に設定されている
- [ ] HTTPSが有効になっている
- [ ] データベース接続がセキュアになっている
- [ ] 不要なデバッグ情報が出力されていない

### 運用時

- [ ] 監査ログを定期的に確認
- [ ] 異常なアクセスパターンを監視
- [ ] セキュリティアップデートを適用
- [ ] バックアップのセキュリティを確保

---

## 参考資料

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Prisma Security](https://www.prisma.io/docs/guides/security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

**最終更新**: 2026年1月19日

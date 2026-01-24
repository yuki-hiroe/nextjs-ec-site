# セキュリティ評価レポート: 監査ログ機能

## 評価対象
- `/app/admin/audit-logs/page.tsx` (クライアント側)
- `/app/api/admin/audit-logs/route.ts` (APIルート)
- `/lib/admin-auth.ts` (認証関数)

## 評価日
2026年1月19日

---

## ✅ 良い点

### 1. 認証・認可の実装
- ✅ NextAuthセッションを使用した認証
- ✅ クライアント側とサーバー側の両方で認証チェック
- ✅ 管理者ロールの検証 (`session.user.role !== "admin"`)
- ✅ ミドルウェアによるルート保護

### 2. 基本的なセキュリティ対策
- ✅ Prisma ORM使用によるSQLインジェクション対策
- ✅ JWTセッション戦略
- ✅ エラーハンドリングの実装

---

## ⚠️ セキュリティ上の問題点

### 🔴 高リスク

#### 1. 入力検証の欠如
**場所**: `/app/api/admin/audit-logs/route.ts` (行18-19, 30, 33)

**問題**:
```typescript
const limit = parseInt(searchParams.get("limit") || "100");
const offset = parseInt(searchParams.get("offset") || "0");
// ...
where.targetEmail = { contains: targetEmail, mode: "insensitive" };
where.performedByEmail = { contains: performedByEmail, mode: "insensitive" };
```

**リスク**:
- `limit` と `offset` に負の値や非常に大きな値が設定可能
- `targetEmail` と `performedByEmail` に特殊文字や長すぎる文字列が入力可能
- データベース負荷攻撃（DoS）の可能性

**推奨修正**:
```typescript
// limit と offset の検証
const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100"), 1), 1000);
const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

// メールアドレスの検証とサニタイゼーション
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (targetEmail && (!emailRegex.test(targetEmail) || targetEmail.length > 255)) {
  return NextResponse.json({ error: "無効なメールアドレス形式です" }, { status: 400 });
}
```

#### 2. XSS (Cross-Site Scripting) のリスク
**場所**: `/app/admin/audit-logs/page.tsx` (行229)

**問題**:
```typescript
<pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-x-auto">
  {JSON.stringify(log.details, null, 2)}
</pre>
```

**リスク**:
- `log.details` に悪意のあるJavaScriptコードが含まれる可能性
- Reactは自動的にエスケープするが、`<pre>` タグ内のJSON文字列に特殊文字が含まれる場合、表示上の問題が発生する可能性

**推奨修正**:
```typescript
// より安全な表示方法
<pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-x-auto">
  {JSON.stringify(log.details, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}
</pre>
// または、専用のJSONビューアーコンポーネントを使用
```

### 🟡 中リスク

#### 3. エラーメッセージの情報漏洩
**場所**: `/app/api/admin/audit-logs/route.ts` (行53-57)

**問題**:
```typescript
catch (error) {
  console.error("監査ログ取得エラー:", error);
  return NextResponse.json(
    { error: "監査ログの取得に失敗しました" },
    { status: 500 }
  );
}
```

**リスク**:
- コンソールログに詳細なエラー情報が出力される
- 本番環境で機密情報が漏洩する可能性

**推奨修正**:
```typescript
catch (error) {
  // 本番環境では詳細なエラーをログに記録しない
  if (process.env.NODE_ENV === 'development') {
    console.error("監査ログ取得エラー:", error);
  } else {
    console.error("監査ログ取得エラー");
  }
  return NextResponse.json(
    { error: "監査ログの取得に失敗しました" },
    { status: 500 }
  );
}
```

#### 4. レート制限の欠如
**場所**: `/app/api/admin/audit-logs/route.ts`

**問題**:
- APIエンドポイントにレート制限がない
- 大量のリクエストによるDoS攻撃の可能性

**推奨修正**:
```typescript
// next-rate-limit などのライブラリを使用
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
});
```

#### 5. 認証関数の無駄なパラメータ
**場所**: `/lib/admin-auth.ts` (行10)

**問題**:
```typescript
export async function verifyAdmin(request: Request) {
  // request パラメータが使用されていない
  const session = await getServerSession(authOptions);
  // ...
}
```

**リスク**:
- コードの可読性と保守性の問題
- 将来的に `request` を使用する意図がある場合は問題ないが、現状では不要

**推奨修正**:
```typescript
export async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  // ...
}
```

### 🟢 低リスク

#### 6. デバッグログの残存
**場所**: `/middleware.ts` (行8-12, 34-39, 48-53)

**問題**:
```typescript
console.log("Middleware function called:", { ... });
console.log("Authorized callback called:", { ... });
```

**リスク**:
- 本番環境でデバッグ情報が出力される
- パフォーマンスへの影響

**推奨修正**:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log("Middleware function called:", { ... });
}
```

#### 7. フィルター値のホワイトリスト検証
**場所**: `/app/api/admin/audit-logs/route.ts` (行23-28)

**問題**:
```typescript
if (action) {
  where.action = action;
}
if (targetType) {
  where.targetType = targetType;
}
```

**リスク**:
- `action` と `targetType` に予期しない値が設定可能
- データベースクエリの結果に影響を与える可能性

**推奨修正**:
```typescript
const ALLOWED_ACTIONS = ['delete', 'suspend', 'activate', 'update'];
const ALLOWED_TARGET_TYPES = ['user', 'order', 'product', 'stylist'];

if (action && ALLOWED_ACTIONS.includes(action)) {
  where.action = action;
}
if (targetType && ALLOWED_TARGET_TYPES.includes(targetType)) {
  where.targetType = targetType;
}
```

---

## 📋 推奨される修正の優先順位

### 優先度: 高
1. ✅ 入力検証の追加（limit, offset, email）
2. ✅ フィルター値のホワイトリスト検証
3. ✅ XSS対策の強化

### 優先度: 中
4. ✅ レート制限の実装
5. ✅ エラーログの改善
6. ✅ デバッグログの削除/条件付き出力

### 優先度: 低
7. ✅ 認証関数のパラメータ整理

---

## 🔒 追加のセキュリティ推奨事項

### 1. Content Security Policy (CSP)
- ヘッダーにCSPを設定してXSS攻撃をさらに軽減

### 2. 監査ログの機密情報マスキング
- パスワードやクレジットカード情報などの機密情報が `log.details` に含まれないようにする

### 3. アクセスログの記録
- 誰がいつ監査ログにアクセスしたかを記録

### 4. ページネーションの改善
- 大量のデータを一度に取得しないように、適切なページネーションを実装

---

## 総合評価

**セキュリティスコア: 7/10**

**評価**:
- 基本的な認証・認可は適切に実装されている
- 入力検証とサニタイゼーションが不足している
- レート制限などの追加のセキュリティ対策が必要

**結論**:
現在の実装は基本的なセキュリティ要件を満たしていますが、上記の推奨事項を実装することで、より堅牢なセキュリティ体制を構築できます。

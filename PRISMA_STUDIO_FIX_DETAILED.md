# Prisma Studio エラー解決ガイド

## エラーの原因

画像から確認できるエラー：

1. **データベース接続エラー**
   - `aws-1-ap-southeast-1.connect.supabase.com:5432`のデータベースサーバーにアクセスできない
   - Prisma Studioが`DIRECT_URL`を使用しようとしているが、接続に失敗

2. **Prismaエンジンの解決エラー**
   - "Prismaエンジンパスを解決できません。これはバグです。"
   - Prismaエンジンが見つからない、またはパスが解決できない

3. **モジュール解決エラー**
   - モジュールが見つからないエラー

## 解決方法

### ステップ1: Prismaクライアントとキャッシュをクリーンアップ

```bash
# Prismaキャッシュを削除
rm -rf node_modules/.prisma

# Prismaクライアントを再生成
npx prisma generate
```

### ステップ2: node_modulesを再インストール（必要に応じて）

```bash
# node_modulesを削除
rm -rf node_modules

# パッケージを再インストール
npm install

# Prismaクライアントを再生成
npx prisma generate
```

### ステップ3: Prisma StudioをDIRECT_URLで起動

**方法A: シェルスクリプトを使用（推奨）**

```bash
./start-prisma-studio.sh
```

**方法B: 直接コマンドを実行**

```bash
DIRECT_URL="postgresql://postgres.xxmkatizftqbpenqesnn:watashihahiroedesu@aws-1-ap-southeast-1.connect.supabase.com:5432/postgres" npx prisma studio
```

**方法C: 環境変数をエクスポートしてから起動**

```bash
export DIRECT_URL="postgresql://postgres.xxmkatizftqbpenqesnn:watashihahiroedesu@aws-1-ap-southeast-1.connect.supabase.com:5432/postgres"
npx prisma studio
```

### ステップ4: Supabase接続の確認

Supabaseダッシュボードで以下を確認：

1. プロジェクトがアクティブか確認
2. 接続文字列が正しいか確認
3. IP制限がかかっていないか確認

## 代替案: Supabase Table Editorを使用

Prisma Studioが動作しない場合、SupabaseダッシュボードのTable Editorを使用できます：

1. https://supabase.com/dashboard にログイン
2. プロジェクトを選択
3. 左メニューから「Table Editor」を開く
4. `StylistApplication`テーブルを選択

## トラブルシューティング

### エラーが続く場合

1. **Prismaのバージョンを確認**
   ```bash
   npm list prisma @prisma/client
   ```

2. **Prismaを最新バージョンに更新**
   ```bash
   npm install prisma@latest @prisma/client@latest
   npx prisma generate
   ```

3. **データベース接続をテスト**
   ```bash
   npx prisma db pull --print
   ```

4. **開発サーバーを再起動**
   ```bash
   # 開発サーバーを停止（Ctrl+C）
   npm run dev
   ```


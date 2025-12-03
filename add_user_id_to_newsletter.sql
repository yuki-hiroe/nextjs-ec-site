-- NewsletterSubscriptionテーブルにuserIdカラムを追加するマイグレーション
-- 既存のデータを保持しながら、新しいカラムを追加します

-- 1. userIdカラムを追加（NULL許可、一意制約なし）
ALTER TABLE "NewsletterSubscription" 
ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- 2. 既存のNewsletterSubscriptionレコードに対して、emailが一致するUserのIDを設定
UPDATE "NewsletterSubscription" ns
SET "userId" = u.id
FROM "User" u
WHERE ns.email = u.email
AND ns."userId" IS NULL;

-- 3. userIdに一意制約を追加
-- 注意: 既存のデータで重複がある場合は、このステップでエラーが発生する可能性があります
-- その場合は、重複を解決してから実行してください
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'NewsletterSubscription_userId_key'
    ) THEN
        ALTER TABLE "NewsletterSubscription" 
        ADD CONSTRAINT "NewsletterSubscription_userId_key" UNIQUE ("userId");
    END IF;
END $$;

-- 4. 外部キー制約を追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'NewsletterSubscription_userId_fkey'
    ) THEN
        ALTER TABLE "NewsletterSubscription" 
        ADD CONSTRAINT "NewsletterSubscription_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE CASCADE;
    END IF;
END $$;

-- 5. インデックスを追加（既に存在する場合はスキップ）
CREATE INDEX IF NOT EXISTS "NewsletterSubscription_userId_idx" 
ON "NewsletterSubscription"("userId");


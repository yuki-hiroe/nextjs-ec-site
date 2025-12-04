-- Testimonialテーブルを作成するマイグレーション

-- 1. Testimonialテーブルを作成
CREATE TABLE IF NOT EXISTS "Testimonial" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT,
  "comment" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT,
  "isApproved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- 2. インデックスを追加
CREATE INDEX IF NOT EXISTS "Testimonial_userId_idx" ON "Testimonial"("userId");
CREATE INDEX IF NOT EXISTS "Testimonial_isApproved_idx" ON "Testimonial"("isApproved");
CREATE INDEX IF NOT EXISTS "Testimonial_createdAt_idx" ON "Testimonial"("createdAt");

-- 3. 外部キー制約を追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Testimonial_userId_fkey'
    ) THEN
        ALTER TABLE "Testimonial" 
        ADD CONSTRAINT "Testimonial_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE SET NULL;
    END IF;
END $$;


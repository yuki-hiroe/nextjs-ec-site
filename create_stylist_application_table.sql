-- StylistApplicationテーブルを作成するSQL
-- SupabaseダッシュボードのSQL Editorで実行してください

CREATE TABLE IF NOT EXISTS "StylistApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "bio" TEXT NOT NULL,
    "specialties" JSONB NOT NULL DEFAULT '[]',
    "image" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StylistApplication_pkey" PRIMARY KEY ("id")
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS "StylistApplication_email_idx" ON "StylistApplication"("email");
CREATE INDEX IF NOT EXISTS "StylistApplication_status_idx" ON "StylistApplication"("status");
CREATE INDEX IF NOT EXISTS "StylistApplication_createdAt_idx" ON "StylistApplication"("createdAt");


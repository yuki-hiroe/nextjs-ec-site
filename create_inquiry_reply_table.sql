-- InquiryReplyテーブルを作成するSQL
-- SupabaseダッシュボードのSQL Editorで実行してください

CREATE TABLE IF NOT EXISTS "InquiryReply" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "fromType" TEXT NOT NULL,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InquiryReply_pkey" PRIMARY KEY ("id")
);

-- 外部キー制約を追加
ALTER TABLE "InquiryReply" ADD CONSTRAINT "InquiryReply_inquiryId_fkey" 
    FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- インデックスを作成
CREATE INDEX IF NOT EXISTS "InquiryReply_inquiryId_idx" ON "InquiryReply"("inquiryId");
CREATE INDEX IF NOT EXISTS "InquiryReply_createdAt_idx" ON "InquiryReply"("createdAt");
CREATE INDEX IF NOT EXISTS "InquiryReply_isRead_idx" ON "InquiryReply"("isRead");


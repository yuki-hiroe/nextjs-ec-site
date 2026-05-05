/*
  Warnings:

  - A unique constraint covering the columns `[userId,inquiryId]` on the table `StylistRating` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "StylistRating_stylistId_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "StylistRating_userId_inquiryId_key" ON "StylistRating"("userId", "inquiryId");

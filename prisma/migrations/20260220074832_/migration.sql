/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `NewsletterSubscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "NewsletterSubscription" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "Testimonial" (
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

-- CreateTable
CREATE TABLE "StylistRating" (
    "id" TEXT NOT NULL,
    "stylistId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "inquiryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StylistRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Testimonial_userId_idx" ON "Testimonial"("userId");

-- CreateIndex
CREATE INDEX "Testimonial_isApproved_idx" ON "Testimonial"("isApproved");

-- CreateIndex
CREATE INDEX "Testimonial_createdAt_idx" ON "Testimonial"("createdAt");

-- CreateIndex
CREATE INDEX "StylistRating_stylistId_idx" ON "StylistRating"("stylistId");

-- CreateIndex
CREATE INDEX "StylistRating_userId_idx" ON "StylistRating"("userId");

-- CreateIndex
CREATE INDEX "StylistRating_rating_idx" ON "StylistRating"("rating");

-- CreateIndex
CREATE INDEX "StylistRating_createdAt_idx" ON "StylistRating"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StylistRating_stylistId_userId_key" ON "StylistRating"("stylistId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_userId_key" ON "NewsletterSubscription"("userId");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_userId_idx" ON "NewsletterSubscription"("userId");

-- AddForeignKey
ALTER TABLE "NewsletterSubscription" ADD CONSTRAINT "NewsletterSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StylistRating" ADD CONSTRAINT "StylistRating_stylistId_fkey" FOREIGN KEY ("stylistId") REFERENCES "Stylist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StylistRating" ADD CONSTRAINT "StylistRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StylistRating" ADD CONSTRAINT "StylistRating_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

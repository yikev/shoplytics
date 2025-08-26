-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PAID', 'PENDING', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "status" "public"."OrderStatus" NOT NULL DEFAULT 'PAID';

-- CreateIndex
CREATE INDEX "Order_tenantId_createdAt_idx" ON "public"."Order"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_tenantId_status_idx" ON "public"."Order"("tenantId", "status");

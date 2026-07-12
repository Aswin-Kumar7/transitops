-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "region" TEXT;

-- CreateIndex
CREATE INDEX "Vehicle_region_idx" ON "Vehicle"("region");

-- AlterTable
ALTER TABLE "Device" ALTER COLUMN "shortId" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ALTER COLUMN "facilityId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DeviceModel" ADD COLUMN     "gtin" VARCHAR(14);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceModel_gtin_key" ON "DeviceModel"("gtin");

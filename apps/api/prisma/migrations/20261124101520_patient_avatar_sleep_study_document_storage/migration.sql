-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "avatar" TEXT;

-- AlterTable
ALTER TABLE "PatientClinicalInfo" ADD COLUMN     "sleepStudyBloodOxygenPct" DOUBLE PRECISION,
ADD COLUMN     "sleepStudyHeartRateBpm" INTEGER,
ADD COLUMN     "sleepStudySnoringHours" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PatientDocument" DROP COLUMN "fileUrl",
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL,
ADD COLUMN     "storageKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PatientDocument_storageKey_key" ON "PatientDocument"("storageKey");


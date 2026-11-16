-- DropForeignKey
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_facilityId_fkey";

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

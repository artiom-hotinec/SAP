/*
  Warnings:

  - Added the required column `ein` to the `Facility` table without a default value. This is not possible if the table is not empty.
  - Added the required column `npi` to the `Facility` table without a default value. This is not possible if the table is not empty.
  - Added the required column `permit` to the `Facility` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "ein" TEXT NOT NULL,
ADD COLUMN     "npi" TEXT NOT NULL,
ADD COLUMN     "permit" TEXT NOT NULL;

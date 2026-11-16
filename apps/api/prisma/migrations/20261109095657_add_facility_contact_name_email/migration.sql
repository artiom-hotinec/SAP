/*
  Warnings:

  - Added the required column `contactEmail` to the `Facility` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactName` to the `Facility` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "contactEmail" TEXT NOT NULL,
ADD COLUMN     "contactName" TEXT NOT NULL;

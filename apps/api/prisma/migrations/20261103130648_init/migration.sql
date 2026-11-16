-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'PROVIDER', 'PORTAL_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UnitsPreference" AS ENUM ('METRIC', 'IMPERIAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PATIENT',
    "unitsPreference" "UnitsPreference" NOT NULL DEFAULT 'METRIC',
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "resetToken" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

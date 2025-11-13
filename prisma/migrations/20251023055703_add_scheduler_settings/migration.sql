-- AlterTable
ALTER TABLE "Portfolio" ADD COLUMN     "checkFrequency" TEXT NOT NULL DEFAULT 'hourly',
ADD COLUMN     "schedulerEnabled" BOOLEAN NOT NULL DEFAULT true;

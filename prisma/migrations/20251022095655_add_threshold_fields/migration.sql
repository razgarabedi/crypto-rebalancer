-- AlterTable
ALTER TABLE "Portfolio" ADD COLUMN     "smartRoutingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "thresholdRebalanceEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "thresholdRebalancePercentage" DOUBLE PRECISION NOT NULL DEFAULT 5.0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "krakenApiAddedAt" TIMESTAMP(3),
ADD COLUMN     "krakenApiKey" TEXT,
ADD COLUMN     "krakenApiSecret" TEXT;

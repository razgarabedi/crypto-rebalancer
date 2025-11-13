-- CreateTable
CREATE TABLE "PerformanceHistory" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assetValues" JSONB,
    "dailyReturn" DOUBLE PRECISION,
    "weeklyReturn" DOUBLE PRECISION,
    "monthlyReturn" DOUBLE PRECISION,

    CONSTRAINT "PerformanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceHistory_portfolioId_idx" ON "PerformanceHistory"("portfolioId");

-- CreateIndex
CREATE INDEX "PerformanceHistory_timestamp_idx" ON "PerformanceHistory"("timestamp");

-- CreateIndex
CREATE INDEX "PerformanceHistory_portfolioId_timestamp_idx" ON "PerformanceHistory"("portfolioId", "timestamp");

-- AddForeignKey
ALTER TABLE "PerformanceHistory" ADD CONSTRAINT "PerformanceHistory_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "targetWeights" JSONB NOT NULL,
    "rebalanceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rebalanceInterval" TEXT NOT NULL DEFAULT 'weekly',
    "rebalanceThreshold" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "maxOrdersPerRebalance" INTEGER,
    "lastRebalancedAt" TIMESTAMP(3),
    "nextRebalanceAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RebalanceHistory" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "portfolioValue" DOUBLE PRECISION NOT NULL,
    "ordersPlanned" INTEGER NOT NULL,
    "ordersExecuted" INTEGER NOT NULL,
    "ordersFailed" INTEGER NOT NULL,
    "totalValueTraded" DOUBLE PRECISION NOT NULL,
    "orders" JSONB NOT NULL,
    "errors" JSONB,
    "triggeredBy" TEXT NOT NULL DEFAULT 'scheduler',
    "duration" INTEGER,

    CONSTRAINT "RebalanceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");

-- CreateIndex
CREATE INDEX "Portfolio_rebalanceEnabled_idx" ON "Portfolio"("rebalanceEnabled");

-- CreateIndex
CREATE INDEX "Portfolio_nextRebalanceAt_idx" ON "Portfolio"("nextRebalanceAt");

-- CreateIndex
CREATE INDEX "RebalanceHistory_portfolioId_idx" ON "RebalanceHistory"("portfolioId");

-- CreateIndex
CREATE INDEX "RebalanceHistory_executedAt_idx" ON "RebalanceHistory"("executedAt");

-- AddForeignKey
ALTER TABLE "RebalanceHistory" ADD CONSTRAINT "RebalanceHistory_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

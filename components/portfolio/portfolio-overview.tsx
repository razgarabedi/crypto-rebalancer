'use client';

import { Portfolio } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface PortfolioOverviewProps {
  portfolio: Portfolio;
}

export function PortfolioOverview({ portfolio }: PortfolioOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Portfolio balance</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{portfolio.assets.length}</div>
          <p className="text-xs text-muted-foreground">Different cryptocurrencies</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rebalance Needed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {portfolio.assets.filter((a) => a.action !== 'hold').length}
          </div>
          <p className="text-xs text-muted-foreground">Actions required</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Rebalanced</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {portfolio.lastRebalanced
              ? formatDistanceToNow(new Date(portfolio.lastRebalanced), { addSuffix: true })
              : 'Never'}
          </div>
          <p className="text-xs text-muted-foreground">Portfolio status</p>
        </CardContent>
      </Card>
    </div>
  );
}


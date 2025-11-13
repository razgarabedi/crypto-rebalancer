export interface Asset {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  percentage: number;
  targetPercentage: number;
  difference: number;
  action: 'buy' | 'sell' | 'hold';
  amount?: number;
}

export interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  assets: Asset[];
  lastRebalanced?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioTarget {
  symbol: string;
  targetPercentage: number;
}

export interface RebalanceAction {
  symbol: string;
  action: 'buy' | 'sell';
  amount: number;
  currentValue: number;
  targetValue: number;
}


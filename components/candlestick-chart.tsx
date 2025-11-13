'use client';

interface CandlestickChartProps {
  symbol: string;
  interval: number;
  height?: number;
}

export function CandlestickChart({ symbol, interval }: CandlestickChartProps) {
  // Temporarily disabled due to lightweight-charts API compatibility issues
  return (
    <div className="flex items-center justify-center h-full bg-muted rounded-lg">
      <div className="text-center">
        <p className="text-muted-foreground mb-2">Candlestick Chart</p>
        <p className="text-sm text-muted-foreground">
          Chart temporarily disabled due to library compatibility issues
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Symbol: {symbol} | Interval: {interval}m
        </p>
      </div>
    </div>
  );
}


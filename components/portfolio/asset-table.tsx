'use client';

import { Asset } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

interface AssetTableProps {
  assets: Asset[];
}

export function AssetTable({ assets }: AssetTableProps) {
  const getActionIcon = (action: Asset['action']) => {
    switch (action) {
      case 'buy':
        return <ArrowUpIcon className="h-4 w-4" />;
      case 'sell':
        return <ArrowDownIcon className="h-4 w-4" />;
      case 'hold':
        return <MinusIcon className="h-4 w-4" />;
    }
  };

  const getActionVariant = (action: Asset['action']) => {
    switch (action) {
      case 'buy':
        return 'default';
      case 'sell':
        return 'destructive';
      case 'hold':
        return 'secondary';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Asset</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead className="text-right">Current %</TableHead>
          <TableHead className="text-right">Target %</TableHead>
          <TableHead className="text-right">Difference</TableHead>
          <TableHead className="text-right">Action</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => (
          <TableRow key={asset.symbol}>
            <TableCell className="font-medium">
              <div>
                <div className="font-semibold">{asset.symbol}</div>
                <div className="text-xs text-muted-foreground">{asset.name}</div>
              </div>
            </TableCell>
            <TableCell className="text-right">{asset.balance.toFixed(4)}</TableCell>
            <TableCell className="text-right">
              ${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </TableCell>
            <TableCell className="text-right">{asset.percentage.toFixed(1)}%</TableCell>
            <TableCell className="text-right">{asset.targetPercentage.toFixed(1)}%</TableCell>
            <TableCell className="text-right">
              <span
                className={
                  asset.difference > 0
                    ? 'text-green-600'
                    : asset.difference < 0
                    ? 'text-red-600'
                    : ''
                }
              >
                {asset.difference > 0 ? '+' : ''}
                {asset.difference.toFixed(1)}%
              </span>
            </TableCell>
            <TableCell className="text-right">
              <Badge variant={getActionVariant(asset.action)} className="gap-1">
                {getActionIcon(asset.action)}
                {asset.action}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {asset.amount ? `$${asset.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}


'use client';

import { Asset } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ComparisonChartProps {
  assets: Asset[];
}

export function ComparisonChart({ assets }: ComparisonChartProps) {
  const data = assets.map((asset) => ({
    name: asset.symbol,
    current: asset.percentage,
    target: asset.targetPercentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current vs Target Allocation</CardTitle>
        <CardDescription>Comparison of current and target percentages</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis unit="%" />
            <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
            <Legend />
            <Bar dataKey="current" fill="#3b82f6" name="Current %" />
            <Bar dataKey="target" fill="#10b981" name="Target %" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


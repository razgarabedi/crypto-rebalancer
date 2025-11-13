'use client';

import { Asset } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AllocationChartProps {
  assets: Asset[];
  showTarget?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AllocationChart({ assets, showTarget = false }: AllocationChartProps) {
  const data = assets.map((asset) => ({
    name: asset.symbol,
    value: showTarget ? asset.targetPercentage : asset.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{showTarget ? 'Target Allocation' : 'Current Allocation'}</CardTitle>
        <CardDescription>
          {showTarget ? 'Desired portfolio distribution' : 'Current portfolio distribution'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


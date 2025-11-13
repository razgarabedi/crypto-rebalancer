'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  LineChart, 
  Line 
} from 'recharts';
import { cn } from '@/lib/utils';

interface ResponsivePieChartProps {
  title: string;
  description: string;
  data: Array<{ name: string; value: number }>;
  colors?: string[];
  className?: string;
}

export function ResponsivePieChart({ 
  title, 
  description, 
  data, 
  colors = ['#0969da', '#1a7f37', '#9333ea', '#d97706', '#dc2626', '#db2777'],
  className 
}: ResponsivePieChartProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  // Auto-detect mobile on mount and on resize
  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 640);
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Custom label with better styling
  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: { cx: number; cy: number; midAngle: number; outerRadius: number; percent: number; name: string }) => {
    if (isMobile && percent < 0.05) return null; // Hide labels < 5% on mobile
    
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + (isMobile ? 15 : 25);
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-medium"
        style={{ fontSize: isMobile ? '11px' : '13px' }}
      >
        {isMobile ? name : `${name} ${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // Custom tooltip with better styling
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">{payload[0].name}</p>
          <p className="text-xs text-muted-foreground">
            Allocation: <span className="font-bold text-foreground">{payload[0].value.toFixed(2)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardHeader>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base sm:text-lg md:text-xl truncate">{title}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 sm:h-80 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {colors.map((color, index) => (
                  <filter key={`shadow-${index}`} id={`shadow-${index}`} height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                  </filter>
                ))}
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={!isMobile}
                label={renderCustomLabel}
                outerRadius={isMobile ? 70 : 90}
                innerRadius={isMobile ? 35 : 45}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                    stroke={activeIndex === index ? colors[index % colors.length] : 'hsl(var(--background))'}
                    strokeWidth={activeIndex === index ? 3 : 2}
                    style={{
                      filter: activeIndex === index ? `url(#shadow-${index})` : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {!isMobile && (
                <Legend 
                  wrapperStyle={{ 
                    fontSize: '13px',
                    paddingTop: '20px'
                  }}
                  iconSize={12}
                  iconType="circle"
                  formatter={(value: string) => (
                    <span style={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>
                      {value}
                    </span>
                  )}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary stats below chart */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.value.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ResponsiveBarChartProps {
  title: string;
  description: string;
  data: Array<Record<string, unknown>>;
  dataKey: string;
  xAxisKey: string;
  className?: string;
}

export function ResponsiveBarChart({ 
  title, 
  description, 
  data, 
  dataKey, 
  xAxisKey,
  className 
}: ResponsiveBarChartProps) {
  // Check if data has both 'current' and 'target' keys for comparison
  const isComparison = data.length > 0 && 'current' in data[0] && 'target' in data[0];
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg md:text-xl">{title}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 sm:h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data}
              margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 10 }}
                interval={0}
                angle={data.length > 5 ? -45 : 0}
                textAnchor={data.length > 5 ? "end" : "middle"}
                height={data.length > 5 ? 60 : 30}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `${value}%`}
                width={40}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(2)}%`}
                contentStyle={{ fontSize: '12px' }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconSize={12}
              />
              {isComparison ? (
                <>
                  <Bar dataKey="current" fill="#0969da" name="Current %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" fill="#1a7f37" name="Target %" radius={[4, 4, 0, 0]} />
                </>
              ) : (
                <Bar dataKey={dataKey} fill="#0969da" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface ResponsiveLineChartProps {
  title: string;
  description: string;
  data: Array<Record<string, unknown>>;
  dataKey: string;
  xAxisKey: string;
  className?: string;
}

export function ResponsiveLineChart({ 
  title, 
  description, 
  data, 
  dataKey, 
  xAxisKey,
  className 
}: ResponsiveLineChartProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 640);
    }
  }, []);
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg md:text-xl">{title}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 sm:h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={data}
              margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey={xAxisKey}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                angle={data.length > 10 ? -45 : 0}
                textAnchor={data.length > 10 ? "end" : "middle"}
                height={data.length > 10 ? 50 : 30}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip 
                formatter={(value: number) => [`€${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']}
                labelStyle={{ fontSize: '11px' }}
                contentStyle={{ fontSize: '11px' }}
              />
              <Legend 
                wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                iconSize={12}
              />
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke="#0969da" 
                strokeWidth={isMobile ? 1.5 : 2}
                name="Portfolio Value"
                dot={{ fill: '#0969da', r: isMobile ? 2 : 3 }}
                activeDot={{ r: isMobile ? 4 : 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dashboard' | 'form' | 'card';
}

export function ResponsiveLayout({ 
  children, 
  className, 
  variant = 'default' 
}: ResponsiveLayoutProps) {
  const baseClasses = "min-h-screen bg-background";
  
  const variantClasses = {
    default: "container mx-auto max-w-7xl p-4 md:p-6",
    dashboard: "flex h-screen bg-background",
    form: "container mx-auto max-w-4xl p-4 md:p-6",
    card: "container mx-auto max-w-6xl p-4 md:p-6"
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </div>
  );
}

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
}

export function ResponsiveContainer({ 
  children, 
  className, 
  maxWidth = '7xl' 
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl'
  };

  return (
    <div className={cn(
      "container mx-auto px-4 md:px-6",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
}

export function ResponsiveGrid({ 
  children, 
  className, 
  cols = 4,
  gap = 'md'
}: ResponsiveGridProps) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div className={cn(
      "grid",
      colClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

interface ResponsiveFlexProps {
  children: ReactNode;
  className?: string;
  direction?: 'row' | 'col' | 'responsive';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'stretch' | 'baseline';
  wrap?: boolean;
  gap?: 'sm' | 'md' | 'lg';
}

export function ResponsiveFlex({ 
  children, 
  className,
  direction = 'responsive',
  justify = 'start',
  align = 'start',
  wrap = false,
  gap = 'md'
}: ResponsiveFlexProps) {
  const directionClasses = {
    row: 'flex-row',
    col: 'flex-col',
    responsive: 'flex-col sm:flex-row'
  };

  const justifyClasses = {
    start: 'justify-start',
    end: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const alignClasses = {
    start: 'items-start',
    end: 'items-end',
    center: 'items-center',
    stretch: 'items-stretch',
    baseline: 'items-baseline'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div className={cn(
      "flex",
      directionClasses[direction],
      justifyClasses[justify],
      alignClasses[align],
      wrap && "flex-wrap",
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

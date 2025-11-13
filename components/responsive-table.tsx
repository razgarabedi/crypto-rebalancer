'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

interface ResponsiveTableProps<T = Record<string, unknown>> {
  title: string;
  description: string;
  data: T[];
  columns: {
    key: keyof T;
    label: string;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
    className?: string;
    mobileHidden?: boolean;
  }[];
  className?: string;
}

export function ResponsiveTable<T = Record<string, unknown>>({ 
  title, 
  description, 
  data, 
  columns, 
  className 
}: ResponsiveTableProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);

  // For mobile, show only first few rows initially
  const mobileRowLimit = 5;
  const visibleData = isExpanded ? data : data.slice(0, mobileRowLimit);
  const hasMoreRows = data.length > mobileRowLimit;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg md:text-xl">{title}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={`${String(column.key)}-${index}`} className={column.className}>
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    {columns.map((column, colIndex) => (
                      <TableCell key={`${String(column.key)}-${colIndex}`} className={column.className}>
                        {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No data available
            </div>
          ) : (
            <>
              {visibleData.map((row, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-2.5 bg-card hover:bg-muted/50 transition-colors">
                  {columns
                    .filter(column => !column.mobileHidden)
                    .map((column, colIndex) => (
                      <div key={`${String(column.key)}-${colIndex}`} className="flex justify-between items-center gap-3 min-h-[24px]">
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground shrink-0">
                          {column.label}:
                        </span>
                        <div className="text-right text-xs sm:text-sm flex-1 min-w-0">
                          {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
              
              {hasMoreRows && (
                <Button
                  variant="outline"
                  className="w-full touch-target"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUpIcon className="mr-2 h-4 w-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="mr-2 h-4 w-4" />
                      Show {data.length - mobileRowLimit} More
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

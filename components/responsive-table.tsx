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
    mobileCompact?: boolean; // For compact display (e.g., inline with other data)
  }[];
  className?: string;
  compactMobile?: boolean; // Enable compact mobile layout
}

export function ResponsiveTable<T = Record<string, unknown>>({ 
  title, 
  description, 
  data, 
  columns, 
  className,
  compactMobile = false
}: ResponsiveTableProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);

  // For mobile, show only first few rows initially (more in compact mode)
  const mobileRowLimit = compactMobile ? 8 : 5;
  const visibleData = isExpanded ? data : data.slice(0, mobileRowLimit);
  const hasMoreRows = data.length > mobileRowLimit;

  // Separate columns for mobile display
  const mobileVisibleColumns = columns.filter(col => !col.mobileHidden);
  const mobileCompactColumns = columns.filter(col => col.mobileCompact);

  return (
    <Card className={className}>
      <CardHeader className={compactMobile ? "pb-3 md:pb-6" : ""}>
        <CardTitle className={`${compactMobile ? 'text-sm md:text-lg' : 'text-base sm:text-lg md:text-xl'}`}>{title}</CardTitle>
        <CardDescription className={`${compactMobile ? 'text-[10px] md:text-sm' : 'text-xs sm:text-sm'}`}>{description}</CardDescription>
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
        <div className="md:hidden">
          {data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No data available
            </div>
          ) : (
            <>
              <div className={compactMobile ? "space-y-2" : "space-y-3"}>
                {visibleData.map((row, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg bg-card hover:bg-muted/50 transition-colors ${
                      compactMobile ? 'p-2.5' : 'p-3 sm:p-4'
                    }`}
                  >
                    {compactMobile ? (
                      // Compact layout: Use grid for better space utilization
                      (() => {
                        const symbolCol = mobileVisibleColumns.find(col => String(col.key) === 'symbol');
                        // Find status column - it's the last column with key 'difference' in visible columns
                        const visibleDifferenceCols = mobileVisibleColumns.filter(col => String(col.key) === 'difference');
                        const statusCol = visibleDifferenceCols.length > 1 ? visibleDifferenceCols[visibleDifferenceCols.length - 1] : null;
                        const differenceNumericCol = visibleDifferenceCols.length > 1 ? visibleDifferenceCols[0] : (visibleDifferenceCols[0] && !statusCol ? visibleDifferenceCols[0] : null);
                        const mainCols = mobileVisibleColumns.filter(col => {
                          const key = String(col.key);
                          // Exclude symbol and status column (last difference column)
                          if (key === 'symbol') return false;
                          if (statusCol && col === statusCol) return false;
                          return true;
                        });
                        
                        return (
                          <div className="space-y-2">
                            {/* First row: Symbol and Status side by side */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-semibold text-sm">
                                {symbolCol ? (
                                  symbolCol.render 
                                    ? symbolCol.render(row[symbolCol.key], row)
                                    : String(row[symbolCol.key] ?? '')
                                ) : null}
                              </div>
                              {statusCol && (
                                <div className="shrink-0">
                                  {statusCol.render 
                                    ? statusCol.render(row[statusCol.key], row)
                                    : String(row[statusCol.key] ?? '')}
                                </div>
                              )}
                            </div>
                            
                            {/* Second row: Main data in a 2-column grid */}
                            {mainCols.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {mainCols.map((column, colIndex) => {
                                  // Skip the numeric difference column if we have a status column (we'll show it separately)
                                  if (statusCol && differenceNumericCol && column === differenceNumericCol) {
                                    return null;
                                  }
                                  return (
                                    <div key={`${String(column.key)}-${colIndex}`} className="flex flex-col">
                                      <span className="text-[10px] text-muted-foreground mb-0.5">
                                        {column.label}
                                      </span>
                                      <div className="text-xs font-medium">
                                        {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
                                      </div>
                                    </div>
                                  );
                                }).filter(Boolean)}
                                {/* Show numeric difference if we have status column */}
                                {statusCol && differenceNumericCol && (
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground mb-0.5">
                                      {differenceNumericCol.label}
                                    </span>
                                    <div className="text-xs font-medium">
                                      {differenceNumericCol.render ? differenceNumericCol.render(row[differenceNumericCol.key], row) : String(row[differenceNumericCol.key] ?? '')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Compact columns (if any) - shown inline at bottom */}
                            {mobileCompactColumns.length > 0 && (
                              <div className="pt-1 border-t border-border/50">
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                                  {mobileCompactColumns.map((column, colIndex) => (
                                    <div key={`${String(column.key)}-${colIndex}`} className="flex items-center gap-1">
                                      <span>{column.label}:</span>
                                      <span className="text-foreground font-medium">
                                        {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      // Regular mobile layout
                      <div className="space-y-2.5">
                        {mobileVisibleColumns.map((column, colIndex) => (
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
                    )}
                  </div>
                ))}
              </div>
              
              {hasMoreRows && (
                <Button
                  variant="outline"
                  className={`w-full touch-target ${compactMobile ? 'mt-2' : 'mt-3'}`}
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

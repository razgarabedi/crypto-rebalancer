'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileTextIcon,
  ArrowLeftIcon,
} from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';
import { ResponsiveSidebar } from '@/components/responsive-sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { usePortfolioStore } from '@/store';
import { toast } from 'sonner';
import { useI18n } from '@/lib/hooks/use-i18n';

interface RebalanceLog {
  id: string;
  portfolioId: string;
  portfolio: {
    id: string;
    name: string;
  };
  executedAt: string;
  success: boolean;
  dryRun: boolean;
  portfolioValue: number;
  ordersPlanned: number;
  ordersExecuted: number;
  ordersFailed: number;
  totalValueTraded: number;
  totalFees: number;
  orders: Array<{
    symbol: string;
    side: string;
    volume: number;
    executed: boolean;
    txid?: string[];
    fee?: number;
    error?: string;
  }> | {
    orders: Array<{
      symbol: string;
      side: string;
      volume: number;
      executed: boolean;
      txid?: string[];
      fee?: number;
      error?: string;
    }>;
    fundAllocation?: {
      strategy: 'full' | 'partial' | 'proportional';
      totalAvailableFunds: number;
      totalRequiredFunds: number;
      adjustments: Array<{
        orderIndex: number;
        originalAmount: number;
        adjustedAmount: number;
        reason: string;
      }>;
      validationWarnings: string[];
      netBalanceChange?: number;
    };
    skippedOrders?: Array<{
      symbol: string;
      difference: number;
      side: 'buy' | 'sell';
      reason: string;
    }>;
  };
  errors?: string[];
  triggeredBy: string;
  duration?: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function LogsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { dbPortfolios, fetchDBPortfolios } = usePortfolioStore();
  const [logs, setLogs] = useState<RebalanceLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Fetch portfolios on mount
  useEffect(() => {
    fetchDBPortfolios(false);
  }, [fetchDBPortfolios]);

  // Fetch logs
  const fetchLogs = useCallback(async (page: number = 1, portfolioId?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (portfolioId && portfolioId !== 'all') {
        params.append('portfolioId', portfolioId);
      }

      const response = await fetch(`/api/rebalance/logs?${params}`);
      if (!response.ok) {
        throw new Error(t.logs.failedToFetchLogs);
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error(t.logs.failedToFetchLogs);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit, t.logs.failedToFetchLogs]);

  useEffect(() => {
    fetchLogs(1, selectedPortfolio);
  }, [selectedPortfolio, fetchLogs]);

  // Export logs as CSV
  const exportToCSV = () => {
    if (logs.length === 0) {
      toast.error(t.logs.noLogsToExport);
      return;
    }

    // Prepare CSV headers
    const headers = [
      'Date',
      'Portfolio',
      'Status',
      'Mode',
      'Portfolio Value (EUR)',
      'Orders Planned',
      'Orders Executed',
      'Orders Failed',
      'Total Traded (EUR)',
      'Total Fees (EUR)',
      'Triggered By',
      'Duration (ms)',
      'Transaction IDs',
    ];

    // Prepare CSV rows
    const rows = logs.map((log) => {
      const ordersArray = Array.isArray(log.orders) 
        ? log.orders 
        : 'orders' in log.orders 
          ? log.orders.orders 
          : [];
      const txids = ordersArray
        .filter((order) => order.txid && order.txid.length > 0)
        .map((order) => order.txid?.join(';'))
        .join(' | ');

      return [
        new Date(log.executedAt).toLocaleString(),
        log.portfolio.name,
        log.success ? 'Success' : 'Failed',
        log.dryRun ? 'Dry Run' : 'Live',
        log.portfolioValue.toFixed(2),
        log.ordersPlanned,
        log.ordersExecuted,
        log.ordersFailed,
        log.totalValueTraded.toFixed(2),
        log.totalFees.toFixed(4),
        log.triggeredBy,
        log.duration || '',
        txids,
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => {
          // Escape quotes and wrap in quotes if contains comma
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rebalance-logs-${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(t.logs.logsExportedSuccessfully);
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <ResponsiveSidebar />

        {/* Mobile Navigation */}
        <MobileNav
          onRefresh={() => fetchLogs(pagination.page, selectedPortfolio)}
          isRefreshing={isLoading}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{t.logs.backToDashboard}</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{t.logs.title}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t.logs.subtitle}
                  </p>
                </div>
              </div>
              <Button onClick={exportToCSV} disabled={logs.length === 0} size="sm" className="w-full sm:w-auto">
                <DownloadIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t.logs.exportCSV}</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">{t.logs.filters}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex gap-4">
                  <div className="w-full sm:w-64">
                    <Select
                      value={selectedPortfolio}
                      onValueChange={setSelectedPortfolio}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.logs.selectPortfolio} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.logs.allPortfolios}</SelectItem>
                        {dbPortfolios.map((portfolio) => (
                          <SelectItem key={portfolio.id} value={portfolio.id}>
                            {portfolio.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">{t.logs.rebalanceHistory}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t.logs.showingLogs.replace('{count}', logs.length.toString()).replace('{total}', pagination.total.toString())}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {isLoading ? (
                  <div className="text-center py-8 text-sm sm:text-base">{t.logs.loadingLogs}</div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground p-4">
                    <FileTextIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">{t.logs.noLogsFound}</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm whitespace-nowrap">{t.logs.dateTime}</TableHead>
                            <TableHead className="text-xs sm:text-sm whitespace-nowrap">{t.logs.portfolio}</TableHead>
                            <TableHead className="text-xs sm:text-sm whitespace-nowrap">{t.logs.status}</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">{t.logs.value}</TableHead>
                            <TableHead className="text-center text-xs sm:text-sm whitespace-nowrap">{t.logs.orders}</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">{t.logs.traded}</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">{t.logs.fees}</TableHead>
                            <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">{t.logs.triggered}</TableHead>
                            <TableHead className="text-center text-xs sm:text-sm whitespace-nowrap">{t.logs.details}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.map((log) => (
                            <React.Fragment key={log.id}>
                              <TableRow>
                                <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                                  <span className="hidden sm:inline">{new Date(log.executedAt).toLocaleString()}</span>
                                  <span className="sm:hidden">{new Date(log.executedAt).toLocaleDateString()}</span>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">{log.portfolio.name}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1 sm:gap-2">
                                    <Badge
                                      variant={log.success ? 'default' : 'destructive'}
                                      className="text-xs"
                                    >
                                      {log.success ? t.logs.success : t.logs.failed}
                                    </Badge>
                                    {log.dryRun && (
                                      <Badge variant="outline" className="text-xs">{t.logs.dryRun}</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-xs sm:text-sm">
                                  €{log.portfolioValue.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="text-xs sm:text-sm">
                                    <span className="text-green-600 font-semibold">
                                      {log.ordersExecuted}
                                    </span>
                                    <span className="text-muted-foreground">
                                      /{log.ordersPlanned}
                                    </span>
                                    {log.ordersFailed > 0 && (
                                      <span className="text-red-600 ml-1">
                                        (-{log.ordersFailed})
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-xs sm:text-sm">
                                  €{log.totalValueTraded.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-xs sm:text-sm hidden sm:table-cell">
                                  €{log.totalFees.toFixed(4)}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <Badge variant="secondary" className="text-xs">{log.triggeredBy}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs sm:text-sm"
                                    onClick={() =>
                                      setExpandedLogId(
                                        expandedLogId === log.id ? null : log.id
                                      )
                                    }
                                  >
                                    {expandedLogId === log.id ? t.logs.hide : t.logs.show}
                                  </Button>
                                </TableCell>
                              </TableRow>
                              {expandedLogId === log.id && (() => {
                                // Handle both old format (array) and new format (object with orders and fundAllocation)
                                const ordersArray = Array.isArray(log.orders) 
                                  ? log.orders 
                                  : 'orders' in log.orders 
                                    ? log.orders.orders 
                                    : [];
                                const fundAllocation = Array.isArray(log.orders) 
                                  ? undefined 
                                  : 'fundAllocation' in log.orders 
                                    ? log.orders.fundAllocation 
                                    : undefined;
                                const skippedOrders = Array.isArray(log.orders) 
                                  ? undefined 
                                  : 'skippedOrders' in log.orders 
                                    ? log.orders.skippedOrders 
                                    : undefined;
                                
                                return (
                                  <TableRow>
                                    <TableCell colSpan={9} className="bg-muted/50 p-3 sm:p-4">
                                      <div className="space-y-3 sm:space-y-4">
                                        {/* Fund Allocation Information */}
                                        {fundAllocation && (
                                          <div className="space-y-3">
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                              <span>Fund Allocation Details</span>
                                              <Badge variant={fundAllocation.strategy === 'full' ? 'default' : fundAllocation.strategy === 'proportional' ? 'secondary' : 'outline'}>
                                                {fundAllocation.strategy}
                                              </Badge>
                                            </h4>
                                            <div className="bg-background rounded border p-3 space-y-2">
                                              <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                  <span className="text-muted-foreground">Available Funds:</span>
                                                  <span className="ml-2 font-semibold">€{fundAllocation.totalAvailableFunds.toFixed(2)}</span>
                                                </div>
                                                <div>
                                                  <span className="text-muted-foreground">Required Funds:</span>
                                                  <span className="ml-2 font-semibold">€{fundAllocation.totalRequiredFunds.toFixed(2)}</span>
                                                </div>
                                              </div>
                                              
                                              {/* Validation Warnings (Portfolio Balance Changes, etc.) */}
                                              {fundAllocation.validationWarnings && fundAllocation.validationWarnings.length > 0 && (
                                                <div className="mt-3 pt-3 border-t">
                                                  <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-500 mb-2">
                                                    Portfolio Balance Changes:
                                                  </div>
                                                  <div className="space-y-1">
                                                    {fundAllocation.validationWarnings.map((warning, idx) => (
                                                      <div
                                                        key={idx}
                                                        className="text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded"
                                                      >
                                                        ⚠️ {warning}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              
                                              {/* Order Adjustments */}
                                              {fundAllocation.adjustments && fundAllocation.adjustments.length > 0 && (
                                                <div className="mt-3 pt-3 border-t">
                                                  <div className="text-sm font-semibold mb-2">
                                                    Order Adjustments ({fundAllocation.adjustments.length}):
                                                  </div>
                                                  <div className="space-y-1">
                                                    {fundAllocation.adjustments.map((adjustment, idx) => {
                                                      const order = ordersArray[adjustment.orderIndex];
                                                      return (
                                                        <div
                                                          key={idx}
                                                          className="text-sm bg-background p-2 rounded border"
                                                        >
                                                          <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs text-muted-foreground">
                                                              Order {adjustment.orderIndex}:
                                                            </span>
                                                            <span className="font-semibold">
                                                              €{adjustment.originalAmount.toFixed(2)}
                                                            </span>
                                                            <span>→</span>
                                                            <span className={adjustment.adjustedAmount < adjustment.originalAmount ? 'text-yellow-600 dark:text-yellow-500' : ''}>
                                                              €{adjustment.adjustedAmount.toFixed(2)}
                                                            </span>
                                                            {order && (
                                                              <Badge variant="outline" className="ml-2">
                                                                {order.side.toUpperCase()} {order.symbol}
                                                              </Badge>
                                                            )}
                                                          </div>
                                                          <div className="text-xs text-muted-foreground mt-1">
                                                            {adjustment.reason}
                                                          </div>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Skipped Orders (Below Threshold) */}
                                        {skippedOrders && skippedOrders.length > 0 && (
                                          <div className="space-y-3">
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                              <span>Skipped Orders</span>
                                              <Badge variant="outline">
                                                {skippedOrders.length} below threshold
                                              </Badge>
                                            </h4>
                                            <div className="bg-background rounded border p-3 space-y-2">
                                              <div className="space-y-1">
                                                {skippedOrders.map((skipped, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="text-sm bg-background p-2 rounded border flex items-center justify-between"
                                                  >
                                                    <div className="flex items-center gap-3">
                                                      <Badge
                                                        variant={
                                                          skipped.side === 'buy'
                                                            ? 'default'
                                                            : 'secondary'
                                                        }
                                                      >
                                                        {skipped.side.toUpperCase()}
                                                      </Badge>
                                                      <span className="font-semibold">{skipped.symbol}:</span>
                                                      <span className="text-muted-foreground">
                                                        €{Math.abs(skipped.difference).toFixed(2)}
                                                      </span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                      {skipped.reason}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Order Details */}
                                        <div>
                                          <h4 className="font-semibold mb-2">
                                            {t.logs.orderDetails}
                                          </h4>
                                          <div className="space-y-2">
                                            {ordersArray.map((order, idx) => (
                                              <div
                                                key={idx}
                                                className="flex items-center justify-between p-2 bg-background rounded border"
                                              >
                                                <div className="flex items-center gap-4">
                                                  <Badge
                                                    variant={
                                                      order.side === 'buy'
                                                        ? 'default'
                                                        : 'secondary'
                                                    }
                                                  >
                                                    {order.side === 'buy' ? t.logs.buy : t.logs.sell}
                                                  </Badge>
                                                  <span className="font-mono">
                                                    {order.volume.toFixed(6)} {order.symbol}
                                                  </span>
                                                  {order.fee !== undefined && (
                                                    <span className="text-sm text-muted-foreground">
                                                      {t.logs.fee}: €{order.fee.toFixed(4)}
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                  {order.txid && order.txid.length > 0 && (
                                                    <div className="text-right">
                                                      <div className="text-xs text-muted-foreground">
                                                        {t.logs.txid}
                                                      </div>
                                                      <div className="font-mono text-sm">
                                                        {order.txid.join(', ')}
                                                      </div>
                                                    </div>
                                                  )}
                                                  {order.executed ? (
                                                    <Badge variant="default">
                                                      {t.logs.executed}
                                                    </Badge>
                                                  ) : order.error ? (
                                                    <Badge variant="destructive">
                                                      {t.logs.failed}
                                                    </Badge>
                                                  ) : (
                                                    <Badge variant="outline">
                                                      {t.logs.pending}
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                        {log.errors && log.errors.length > 0 && (
                                          <div>
                                            <h4 className="font-semibold mb-2 text-destructive">
                                              {t.logs.errors}
                                            </h4>
                                            <div className="space-y-1">
                                              {log.errors.map((error, idx) => (
                                                <div
                                                  key={idx}
                                                  className="text-sm text-destructive bg-destructive/10 p-2 rounded"
                                                >
                                                  {error}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {log.duration && (
                                          <div className="text-sm text-muted-foreground">
                                            {t.logs.executionTime}: {log.duration}ms
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })()}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mt-4 p-4 sm:p-0">
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {t.logs.page} {pagination.page} {t.logs.of} {pagination.totalPages}
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-initial"
                          onClick={() => fetchLogs(pagination.page - 1, selectedPortfolio)}
                          disabled={pagination.page === 1 || isLoading}
                        >
                          <ChevronLeftIcon className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">{t.logs.previous}</span>
                          <span className="sm:hidden">Prev</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-initial"
                          onClick={() => fetchLogs(pagination.page + 1, selectedPortfolio)}
                          disabled={
                            pagination.page === pagination.totalPages || isLoading
                          }
                        >
                          <span className="hidden sm:inline">{t.logs.next}</span>
                          <span className="sm:hidden">Next</span>
                          <ChevronRightIcon className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}


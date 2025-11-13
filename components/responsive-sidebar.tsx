'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePortfolioStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from '@/lib/hooks/use-sidebar';
import { 
  PlusIcon, 
  MenuIcon, 
  XIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  WalletIcon,
  TrendingUpIcon,
  LayoutDashboardIcon,
  FileTextIcon,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ResponsiveSidebarProps {
  className?: string;
}

export function ResponsiveSidebar({ className }: ResponsiveSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    dbPortfolios,
    currentDBPortfolio,
    setCurrentDBPortfolio,
  } = usePortfolioStore();

  const { isOpen, isCollapsed, isMobile, toggle, close } = useSidebar();

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen) {
        const sidebar = document.getElementById('mobile-sidebar');
        if (sidebar && !sidebar.contains(event.target as Node)) {
          close();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isOpen, close]);

  const handlePortfolioSelect = (portfolio: {
    id: string;
    name: string;
    rebalanceEnabled: boolean;
    rebalanceInterval: string;
    targetWeights: Record<string, number>;
    rebalanceThreshold: number;
    maxOrdersPerRebalance?: number | null;
    lastRebalancedAt?: Date | null;
    nextRebalanceAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) => {
    setCurrentDBPortfolio(portfolio);
    if (isMobile) {
      close();
    }
  };

  const sidebarContent = (
      <div className="flex h-full flex-col min-w-0">
      {/* Header */}
      <div className="border-b p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div 
            className={cn(
              "overflow-hidden transition-all duration-150",
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            <h2 className="text-lg font-semibold whitespace-nowrap">Portfolios</h2>
          </div>
          <div className={cn("flex items-center gap-2 flex-shrink-0", isCollapsed && "mx-auto")}>
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                className="h-8 w-8"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="h-4 w-4" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4" />
                )}
              </Button>
            )}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={close}
                className="h-8 w-8"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3 border-b flex-shrink-0">
        <div className="space-y-1">
          <Link href="/dashboard">
            <Button
              variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
              className={cn("w-full justify-start", isCollapsed && "justify-center px-2")}
              title={isCollapsed ? "Dashboard" : undefined}
            >
              <LayoutDashboardIcon className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
              {!isCollapsed && <span>Dashboard</span>}
            </Button>
          </Link>
          <Link href="/market">
            <Button
              variant={pathname === '/market' ? 'secondary' : 'ghost'}
              className={cn("w-full justify-start", isCollapsed && "justify-center px-2")}
              title={isCollapsed ? "Market" : undefined}
            >
              <TrendingUpIcon className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
              {!isCollapsed && <span>Market</span>}
            </Button>
          </Link>
          <Link href="/dashboard/analytics">
            <Button
              variant={pathname === '/dashboard/analytics' ? 'secondary' : 'ghost'}
              className={cn("w-full justify-start", isCollapsed && "justify-center px-2")}
              title={isCollapsed ? "Analytics" : undefined}
            >
              <BarChart3 className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
              {!isCollapsed && <span>Analytics</span>}
            </Button>
          </Link>
          <Link href="/dashboard/logs">
            <Button
              variant={pathname === '/dashboard/logs' ? 'secondary' : 'ghost'}
              className={cn("w-full justify-start", isCollapsed && "justify-center px-2")}
              title={isCollapsed ? "Rebalance Logs" : undefined}
            >
              <FileTextIcon className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
              {!isCollapsed && <span>Rebalance Logs</span>}
            </Button>
          </Link>
        </div>
      </div>

      {/* Portfolio List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 min-w-0">
        {dbPortfolios.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <WalletIcon className="h-6 w-6" />
                <span className="text-[10px] leading-tight">No<br/>portfolios</span>
              </div>
            ) : (
              <p>No portfolios yet</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {dbPortfolios.map((portfolio) => (
              <button
                key={portfolio.id}
                onClick={() => handlePortfolioSelect(portfolio)}
                className={cn(
                  "w-full rounded-lg border hover:bg-accent flex-shrink-0",
                  currentDBPortfolio?.id === portfolio.id ? 'border-primary bg-accent' : '',
                  isCollapsed ? 'p-2 flex flex-col items-center justify-center' : 'p-3 text-left'
                )}
                style={{
                  transition: 'background-color 100ms, border-color 100ms'
                }}
                title={isCollapsed ? portfolio.name : undefined}
              >
                {isCollapsed ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold">
                        {portfolio.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {portfolio.rebalanceEnabled && (
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="Auto-rebalance enabled" />
                    )}
                  </div>
                ) : (
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{portfolio.name}</span>
                      {portfolio.rebalanceEnabled && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          Auto
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">{portfolio.rebalanceInterval}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="border-t p-3 flex-shrink-0">
        <Button 
          className="w-full"
          variant="outline"
          onClick={() => {
            router.push('/dashboard/new');
            if (isMobile) close();
          }}
          title={isCollapsed ? "Add Portfolio" : undefined}
        >
          {isCollapsed ? (
            <PlusIcon className="h-5 w-5" />
          ) : (
            <div className="flex items-center justify-center">
              <PlusIcon className="mr-2 h-4 w-4" />
              <span className="whitespace-nowrap">Add Portfolio</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="fixed top-4 left-4 z-50 lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>

        {/* Mobile Sidebar Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
        )}

        {/* Mobile Sidebar */}
        <aside
          id="mobile-sidebar"
          className={cn(
            "fixed left-0 top-0 z-50 h-full w-64 border-r bg-card transition-transform lg:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside
      className={cn(
        "border-r bg-card overflow-hidden",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
      style={{
        transition: 'width 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {sidebarContent}
    </aside>
  );
}

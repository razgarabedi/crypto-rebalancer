'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  MenuIcon, 
  XIcon, 
  WalletIcon,
  BarChart3Icon,
  PlusIcon,
  RefreshCwIcon,
  ActivityIcon,
  PencilIcon,
  Trash2Icon,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  currentPortfolio?: {
    id: string;
    name: string;
    rebalanceEnabled: boolean;
    rebalanceInterval: string;
  } | null;
  onRefresh?: () => void;
  onRebalance?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function MobileNav({ 
  currentPortfolio, 
  onRefresh, 
  onRebalance, 
  onEdit, 
  onDelete,
  isRefreshing = false,
  className 
}: MobileNavProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className={cn("lg:hidden", className)}>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50"
      >
        <MenuIcon className="h-5 w-5" />
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-80 bg-card border-l transition-transform",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Menu</h2>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-2">
              {/* Portfolio Info */}
              {currentPortfolio && (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-1">Current Portfolio</h3>
                  <p className="font-medium">{currentPortfolio.name}</p>
                  {currentPortfolio.rebalanceEnabled && (
                    <Badge variant="outline" className="text-xs mt-1">
                      Auto Rebalance
                    </Badge>
                  )}
                </div>
              )}

              {/* Navigation Links */}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/dashboard')}
              >
                <BarChart3Icon className="mr-3 h-4 w-4" />
                Dashboard
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/dashboard/my-assets')}
              >
                <WalletIcon className="mr-3 h-4 w-4" />
                My Assets
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/dashboard/new')}
              >
                <PlusIcon className="mr-3 h-4 w-4" />
                New Portfolio
              </Button>

              {/* Portfolio Actions */}
              {currentPortfolio && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">Portfolio Actions</h3>
                    
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleAction(() => onRefresh?.())}
                      disabled={isRefreshing}
                    >
                      <RefreshCwIcon className={cn("mr-3 h-4 w-4", isRefreshing && "animate-spin")} />
                      Refresh
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleAction(() => onEdit?.())}
                    >
                      <PencilIcon className="mr-3 h-4 w-4" />
                      Edit Portfolio
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleAction(() => onRebalance?.())}
                    >
                      <ActivityIcon className="mr-3 h-4 w-4" />
                      Rebalance Now
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={() => handleAction(() => onDelete?.())}
                    >
                      <Trash2Icon className="mr-3 h-4 w-4" />
                      Delete Portfolio
                    </Button>
                  </div>
                </>
              )}

              {/* User Actions */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-sm text-muted-foreground mb-2">Account</h3>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/profile')}
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Profile Settings
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={async () => {
                    try {
                      await fetch('/api/auth/logout', { method: 'POST' });
                      router.push('/auth/login');
                      router.refresh();
                    } catch (error) {
                      console.error('Failed to logout:', error);
                    }
                    setIsOpen(false);
                  }}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

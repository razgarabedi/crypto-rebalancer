'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle2, Key } from 'lucide-react';

interface LicenseActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivated: () => void;
}

export function LicenseActivationModal({ isOpen, onClose, onActivated }: LicenseActivationModalProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverId, setServerId] = useState<string>('');

  useEffect(() => {
    // Fetch server ID on mount
    const fetchServerId = async () => {
      try {
        const response = await fetch('/api/license/server-id');
        const data = await response.json();
        setServerId(data.serverId);
      } catch (error) {
        console.error('Error fetching server ID:', error);
      }
    };

    if (isOpen) {
      fetchServerId();
    }
  }, [isOpen]);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      toast.error('Please enter a license key');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseKey.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate license');
      }

      toast.success('License activated successfully!', {
        description: data.license?.licenseType === 'lifetime' 
          ? 'Your lifetime license has been activated.' 
          : `Your license is valid for ${data.license?.daysRemaining} days.`,
      });

      onActivated();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to activate license');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setLicenseKey(text);
      toast.success('License key pasted from clipboard');
    } catch {
      toast.error('Failed to read from clipboard');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Key className="h-6 w-6" />
            Activate Crypto Rebalancer
          </DialogTitle>
          <DialogDescription className="text-base">
            Enter your license key to activate this software installation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Server ID Display - IMPORTANT */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-blue-100">
              <Key className="h-5 w-5" />
              Your Server ID
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 p-3 rounded bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800">
                <code className="font-mono text-sm font-semibold flex-1 break-all">
                  {serverId || 'Loading...'}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(serverId);
                      toast.success('Server ID copied to clipboard');
                    } catch {
                      toast.error('Failed to copy Server ID');
                    }
                  }}
                >
                  Copy
                </Button>
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-semibold">⚠️ IMPORTANT: Provide this Server ID to obtain your license key</p>
                <p>• Each license is cryptographically bound to this specific Server ID</p>
                <p>• Your license key will ONLY work on this installation</p>
                <p>• Copy this ID and send it to your software provider</p>
              </div>
            </div>
          </div>

          {/* License Key Input */}
          <div className="space-y-2">
            <Label htmlFor="licenseKey">License Key</Label>
            <div className="flex gap-2">
              <Input
                id="licenseKey"
                type="text"
                placeholder="CRYPTO-REBALANCER-..."
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                disabled={loading}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handlePaste}
                disabled={loading}
              >
                Paste
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the license key provided to you. Each key can only be used on one server.
            </p>
          </div>

          {/* Features Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="font-medium text-sm">What you get:</div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Full access to all features
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Portfolio management & rebalancing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                TradingView charts & analytics
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Automated scheduler
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Kraken API integration
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleActivate}
            disabled={loading || !licenseKey.trim()}
            className="w-full"
          >
            {loading ? 'Activating...' : 'Activate License'}
          </Button>
        </DialogFooter>

        <div className="text-xs text-center text-muted-foreground">
          Need a license key? Contact us for a trial or purchase a license.
        </div>
      </DialogContent>
    </Dialog>
  );
}


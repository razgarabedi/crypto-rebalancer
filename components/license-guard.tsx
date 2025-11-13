'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { LicenseActivationModal } from './license-activation-modal';
import { toast } from 'sonner';

interface LicenseInfo {
  isValid: boolean;
  isActivated: boolean;
  licenseType?: string;
  expiresAt?: string;
  daysRemaining?: number;
}

export function LicenseGuard({ children }: { children: React.ReactNode }) {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const checkCountRef = useRef(0);

  const checkLicense = useCallback(async (silent = false) => {
    try {
      const response = await fetch('/api/license/check');
      const data = await response.json();
      
      setLicenseInfo(data);

      // Show activation modal if not activated
      if (!data.isActivated && !silent) {
        setShowActivationModal(true);
      }

      // Show expiration warning if license expires in 7 days or less
      if (data.isActivated && data.daysRemaining !== undefined && data.daysRemaining <= 7 && data.daysRemaining > 0) {
        if (checkCountRef.current % 3 === 0) { // Show warning every 3rd check to avoid spam
          toast.warning(`License expires in ${data.daysRemaining} days`, {
            description: 'Please renew your license to continue using the software.',
            duration: 10000,
          });
        }
      }

      // Show expiration error if license has expired
      if (data.isActivated && data.daysRemaining !== undefined && data.daysRemaining <= 0) {
        toast.error('License has expired', {
          description: 'Please enter a new license key to continue using the software.',
          duration: Infinity,
        });
        setShowActivationModal(true);
      }

      checkCountRef.current += 1;
    } catch (error) {
      console.error('Failed to check license:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkLicense();
  }, [checkLicense]);

  useEffect(() => {
    // Periodic license check every 5 minutes
    const interval = setInterval(() => {
      checkLicense(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkLicense]);

  const handleLicenseActivated = () => {
    checkLicense();
    setShowActivationModal(false);
  };

  const handleModalClose = () => {
    // Don't allow closing modal if not activated
    if (!licenseInfo?.isActivated) {
      toast.error('License activation required', {
        description: 'You must activate a license to use this software.',
      });
      return;
    }
    setShowActivationModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking license...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      
      <LicenseActivationModal
        isOpen={showActivationModal}
        onClose={handleModalClose}
        onActivated={handleLicenseActivated}
      />
    </>
  );
}


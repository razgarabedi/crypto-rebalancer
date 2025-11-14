'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';

interface LegalPageLayoutProps {
  children: React.ReactNode;
}

export function LegalPageLayout({ children }: LegalPageLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo/logo.png"
                alt="Rexerium Logo"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                priority
              />
              <h1 className="text-lg sm:text-2xl font-bold truncate font-poppins text-rexerium-blue">REXERIUM</h1>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rexerium-blue"></div>
            ) : isAuthenticated ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <ThemeToggle />
                <UserNav />
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="bg-rexerium-blue hover:bg-rexerium-blue/90 text-white">
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 mb-2">
              <Image
                src="/logo/logo.png"
                alt="Rexerium Logo"
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
              />
              <span className="font-bold text-rexerium-blue font-poppins">REXERIUM</span>
            </div>
            <p className="text-center text-sm font-inter text-muted-foreground mb-4">
              Intelligence. Engineered. Where systems evolve.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
              <Link href="/legal/terms" className="text-muted-foreground hover:text-rexerium-cyan transition-colors font-inter">
                Terms of Service
              </Link>
              <Link href="/legal/privacy" className="text-muted-foreground hover:text-rexerium-cyan transition-colors font-inter">
                Privacy Policy
              </Link>
              <Link href="/legal/cookies" className="text-muted-foreground hover:text-rexerium-cyan transition-colors font-inter">
                Cookie Policy
              </Link>
              <Link href="/legal/risk-disclosure" className="text-muted-foreground hover:text-rexerium-cyan transition-colors font-inter">
                Risk Disclosure
              </Link>
              <Link href="/legal/disclaimer" className="text-muted-foreground hover:text-rexerium-cyan transition-colors font-inter">
                Disclaimer
              </Link>
              <Link href="/legal/compliance" className="text-muted-foreground hover:text-rexerium-cyan transition-colors font-inter">
                Compliance
              </Link>
              <Link href="/legal/security" className="text-muted-foreground hover:text-rexerium-cyan transition-colors font-inter">
                Security
              </Link>
              <Link href="/legal/contact" className="text-muted-foreground hover:text-rexerium-cyan transition-colors font-inter">
                Contact
              </Link>
            </div>
            <p className="text-center text-xs text-muted-foreground font-inter">
              © {new Date().getFullYear()} Rexerium Crypto. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}


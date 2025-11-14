'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  Legal
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/legal/terms">Terms of Service</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/legal/privacy">Privacy Policy</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/legal/cookies">Cookie Policy</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/legal/risk-disclosure">Risk Disclosure</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/legal/disclaimer">Disclaimer</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/legal/compliance">Compliance</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/legal/security">Security</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild variant="ghost" size="sm">
              <Link href="/legal/contact">Contact</Link>
            </Button>
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
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col gap-3">
            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
              {/* Left: Logo, Brand, Tagline */}
              <div className="flex flex-col items-center sm:items-start gap-1.5">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo/logo.png"
                    alt="Rexerium Logo"
                    width={20}
                    height={20}
                    className="w-5 h-5 object-contain"
                  />
                  <span className="font-bold text-rexerium-blue font-poppins text-sm">REXERIUM</span>
                </div>
                <p className="text-center sm:text-left text-xs font-inter text-muted-foreground">
                  Intelligence. Engineered. Where systems evolve.
                </p>
              </div>
              
              {/* Middle: Copyright - Absolutely centered */}
              <div className="absolute left-1/2 top-0 -translate-x-1/2 hidden sm:block">
                <p className="text-center text-xs text-muted-foreground font-inter whitespace-nowrap">
                  © {new Date().getFullYear()} Rexerium Crypto. All rights reserved. | <a href="https://rexerium.com" target="_blank" rel="noopener noreferrer" className="hover:text-rexerium-cyan transition-colors">rexerium.com</a>
                </p>
              </div>
              
              {/* Spacer for mobile - shows copyright below */}
              <div className="w-full sm:hidden order-3">
                <p className="text-center text-xs text-muted-foreground font-inter">
                  © {new Date().getFullYear()} Rexerium Crypto. All rights reserved. | <a href="https://rexerium.com" target="_blank" rel="noopener noreferrer" className="hover:text-rexerium-cyan transition-colors">rexerium.com</a>
                </p>
              </div>
            </div>
            
            {/* Bottom: Links */}
            <div className="flex flex-wrap justify-center sm:justify-end gap-3 sm:gap-4 text-xs">
              <Link href="/legal/terms" className="text-muted-foreground hover:text-rexerium-cyan transition-colors font-inter">
                Terms of Service
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/legal/privacy" className="text-muted-foreground hover:text-rexerium-cyan transition-colors font-inter">
                Privacy Policy
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/legal/contact" className="text-muted-foreground hover:text-rexerium-cyan transition-colors font-inter">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


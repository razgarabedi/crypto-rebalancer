'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRightIcon, BarChart3Icon, RefreshCwIcon, TrendingUpIcon, Brain, Sparkles, AlertTriangle, ChevronDown } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Dynamic Rebalancing Flow Visualization
function CryptoPortfolioVisual() {
  return (
    <div className="relative flex items-center justify-center mb-5 sm:mb-7 mt-4 sm:mt-6">
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
        {/* Glow effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-rexerium-cyan/20 blur-3xl animate-pulse" />
        </div>
        
        {/* Rotating Hexagon Pattern SVG */}
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer rotating hexagon */}
          <g transform="translate(100, 100)">
            <polygon
              points="-60,-35 60,-35 60,35 -60,35"
              stroke="currentColor"
              strokeWidth="2"
              className="text-rexerium-blue/40"
              fill="none"
              transformOrigin="0 0"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0;360"
                dur="20s"
                repeatCount="indefinite"
              />
            </polygon>
          </g>
          
          {/* Middle rotating hexagon */}
          <g transform="translate(100, 100)">
            <polygon
              points="-40,-23 40,-23 40,23 -40,23"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-rexerium-cyan/60"
              fill="none"
              transformOrigin="0 0"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="360;0"
                dur="15s"
                repeatCount="indefinite"
              />
            </polygon>
          </g>
          
          {/* Inner rotating hexagon */}
          <g transform="translate(100, 100)">
            <polygon
              points="-25,-15 25,-15 25,15 -25,15"
              stroke="currentColor"
              strokeWidth="3"
              className="text-rexerium-cyan"
              fill="none"
              transformOrigin="0 0"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0;360"
                dur="10s"
                repeatCount="indefinite"
              />
            </polygon>
          </g>
          
          {/* Flowing lines - representing rebalancing flow */}
          <g>
            {/* Top to center */}
            <path
              d="M 100 20 Q 100 60 100 100"
              stroke="currentColor"
              strokeWidth="2"
              className="text-rexerium-cyan/50"
              fill="none"
              strokeDasharray="3 3"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;6"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </path>
            
            {/* Right to center */}
            <path
              d="M 180 100 Q 140 100 100 100"
              stroke="currentColor"
              strokeWidth="2"
              className="text-rexerium-blue/50"
              fill="none"
              strokeDasharray="3 3"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;6"
                dur="1.8s"
                begin="0.3s"
                repeatCount="indefinite"
              />
            </path>
            
            {/* Bottom to center */}
            <path
              d="M 100 180 Q 100 140 100 100"
              stroke="currentColor"
              strokeWidth="2"
              className="text-rexerium-cyan/50"
              fill="none"
              strokeDasharray="3 3"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;6"
                dur="1.6s"
                begin="0.6s"
                repeatCount="indefinite"
              />
            </path>
            
            {/* Left to center */}
            <path
              d="M 20 100 Q 60 100 100 100"
              stroke="currentColor"
              strokeWidth="2"
              className="text-rexerium-blue/50"
              fill="none"
              strokeDasharray="3 3"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;6"
                dur="1.7s"
                begin="0.9s"
                repeatCount="indefinite"
              />
            </path>
          </g>
          
          {/* Corner nodes - representing assets */}
          <circle cx="100" cy="20" r="6" fill="currentColor" className="text-rexerium-cyan">
            <animate
              attributeName="r"
              values="6;8;6"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="180" cy="100" r="6" fill="currentColor" className="text-rexerium-blue">
            <animate
              attributeName="r"
              values="6;8;6"
              dur="2.2s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="100" cy="180" r="6" fill="currentColor" className="text-rexerium-cyan">
            <animate
              attributeName="r"
              values="6;8;6"
              dur="2.1s"
              begin="1s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="20" cy="100" r="6" fill="currentColor" className="text-rexerium-blue">
            <animate
              attributeName="r"
              values="6;8;6"
              dur="2.3s"
              begin="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Center core - pulsing */}
          <circle
            cx="100"
            cy="100"
            r="12"
            fill="currentColor"
            className="text-rexerium-cyan"
            style={{ filter: 'drop-shadow(0 0 10px hsl(188 94% 43%))' }}
          >
            <animate
              attributeName="r"
              values="12;16;12"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.9;1;0.9"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Center inner dot */}
          <circle cx="100" cy="100" r="4" fill="white" opacity="0.9" />
        </svg>
      </div>
    </div>
  );
}

export default function Home() {
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
            {/* Logo */}
            <Image
              src="/logo/logo.png"
              alt="Rexerium Logo"
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              priority
            />
            <h1 className="text-lg sm:text-2xl font-bold truncate font-poppins text-rexerium-blue">REXERIUM</h1>
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
        <section className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-10 md:pt-12 pb-12 sm:pb-16 md:pb-24 lg:pb-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Crypto Portfolio Visualization */}
            <CryptoPortfolioVisual />
            
            {/* Main Tagline */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight font-poppins text-foreground">
              Balance Your Future.
            </h2>
            
            {/* Positioning Statement */}
            <p className="mt-6 sm:mt-8 text-xl sm:text-2xl md:text-3xl font-medium text-rexerium-blue font-inter">
              Intelligent asset management for digital finance.
            </p>
            
            {/* Core Value Proposition */}
            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl leading-relaxed text-muted-foreground px-2 max-w-2xl mx-auto font-inter">
              Intelligence + empowerment in crypto decisions. Where systems evolve.
            </p>
            
            {/* CTA */}
            <div className="mt-8 sm:mt-10 flex items-center justify-center gap-3 sm:gap-4 px-4">
              <Button 
                asChild 
                size="lg" 
                className="touch-target bg-rexerium-blue hover:bg-rexerium-blue/90 text-white shadow-lg shadow-rexerium-cyan/20 hover:shadow-rexerium-cyan/30 transition-all"
              >
                <Link href="/dashboard">
                  Get Started
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium">
                    Please note: This tool is under active development and not recommended for production use. We are not affiliated with any cryptocurrency exchange, and we are not responsible for any loss of data or funds.
                  </p>
                  <p>
                    <strong>Important:</strong> If you choose to use this tool, please ensure your API keys have <strong>trading permissions only</strong> (no send or withdraw permissions).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
            <div className="mx-auto max-w-5xl">
              <h3 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold mb-2 font-poppins text-foreground">
                Precision. Intelligence. Empowerment.
              </h3>
              <p className="text-center text-muted-foreground text-sm sm:text-base md:text-lg mb-8 sm:mb-12 px-4 font-inter">
                Engineered for crypto investors, fintech enthusiasts, and portfolio managers
              </p>
              <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                <Card className="hover:shadow-lg transition-shadow border-rexerium-blue/20 hover:border-rexerium-cyan/40">
                  <CardHeader className="space-y-3 sm:space-y-4">
                    <BarChart3Icon className="h-8 w-8 sm:h-10 sm:w-10 text-rexerium-cyan" />
                    <CardTitle className="text-lg sm:text-xl font-poppins">Analytical Precision</CardTitle>
                    <CardDescription className="text-sm leading-relaxed font-inter">
                      View your portfolio allocation with interactive charts and graphs. Data-driven insights for informed decisions.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="hover:shadow-lg transition-shadow border-rexerium-blue/20 hover:border-rexerium-cyan/40">
                  <CardHeader className="space-y-3 sm:space-y-4">
                    <RefreshCwIcon className="h-8 w-8 sm:h-10 sm:w-10 text-rexerium-cyan" />
                    <CardTitle className="text-lg sm:text-xl font-poppins">Intelligent Rebalancing</CardTitle>
                    <CardDescription className="text-sm leading-relaxed font-inter">
                      Automated recommendations to maintain optimal allocation. Precision-engineered algorithms for balanced portfolios.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="hover:shadow-lg transition-shadow sm:col-span-2 md:col-span-1 border-rexerium-blue/20 hover:border-rexerium-cyan/40">
                  <CardHeader className="space-y-3 sm:space-y-4">
                    <TrendingUpIcon className="h-8 w-8 sm:h-10 sm:w-10 text-rexerium-cyan" />
                    <CardTitle className="text-lg sm:text-xl font-poppins">Real-time Intelligence</CardTitle>
                    <CardDescription className="text-sm leading-relaxed font-inter">
                      Live cryptocurrency prices with accurate calculations. Stay ahead with real-time market data.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="hover:shadow-lg transition-shadow sm:col-span-2 md:col-span-3 border-rexerium-cyan/30 bg-gradient-to-br from-rexerium-cyan/10 to-rexerium-blue/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-rexerium-cyan/5 to-transparent" />
                  <CardHeader className="space-y-3 sm:space-y-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-rexerium-cyan" style={{ filter: 'drop-shadow(0 0 8px hsl(188 94% 43% / 0.5))' }} />
                      <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-rexerium-cyan" style={{ filter: 'drop-shadow(0 0 8px hsl(188 94% 43% / 0.5))' }} />
                    </div>
                    <CardTitle className="text-lg sm:text-xl md:text-2xl font-poppins">Intelligence. Engineered.</CardTitle>
                    <CardDescription className="text-sm sm:text-base leading-relaxed font-inter">
                      Where systems evolve. A crypto strategist + data scientist in one. It doesn&apos;t just show numbers — it interprets them, warns you when you&apos;re off balance, and empowers you toward smarter moves.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>
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

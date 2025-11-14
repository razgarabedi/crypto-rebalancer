import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRightIcon, BarChart3Icon, RefreshCwIcon, TrendingUpIcon, Brain, Sparkles, AlertTriangle } from 'lucide-react';

// Import startup module to ensure scheduler starts
if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@/lib/startup');
}

// Balance Scales Visual Component
function BalanceScales() {
  return (
    <div className="relative flex items-center justify-center my-8 sm:my-12">
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
        {/* Glow effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-rexerium-cyan/20 blur-3xl animate-pulse" />
        </div>
        
        {/* Balance Scales SVG */}
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base */}
          <rect x="90" y="160" width="20" height="30" fill="currentColor" className="text-rexerium-blue" />
          
          {/* Central pillar */}
          <rect x="95" y="60" width="10" height="100" fill="currentColor" className="text-rexerium-blue" />
          
          {/* Crossbar */}
          <rect x="20" y="60" width="160" height="6" fill="currentColor" className="text-rexerium-blue" />
          
          {/* Left scale */}
          <path
            d="M 30 66 L 30 100 L 80 100 L 80 66 Z"
            fill="currentColor"
            className="text-rexerium-cyan"
            style={{ filter: 'drop-shadow(0 0 8px hsl(188 94% 43% / 0.6))' }}
          />
          
          {/* Right scale */}
          <path
            d="M 120 66 L 120 100 L 170 100 L 170 66 Z"
            fill="currentColor"
            className="text-rexerium-cyan"
            style={{ filter: 'drop-shadow(0 0 8px hsl(188 94% 43% / 0.6))' }}
          />
          
          {/* Connecting lines */}
          <line x1="55" y1="66" x2="55" y2="60" stroke="currentColor" strokeWidth="2" className="text-rexerium-blue" />
          <line x1="145" y1="66" x2="145" y2="60" stroke="currentColor" strokeWidth="2" className="text-rexerium-blue" />
          
          {/* Glow dots on scales */}
          <circle cx="55" cy="83" r="4" fill="currentColor" className="text-rexerium-cyan animate-pulse" style={{ filter: 'drop-shadow(0 0 6px hsl(188 94% 43%))' }} />
          <circle cx="145" cy="83" r="4" fill="currentColor" className="text-rexerium-cyan animate-pulse" style={{ filter: 'drop-shadow(0 0 6px hsl(188 94% 43%))' }} />
        </svg>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Logo placeholder - circular R */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-rexerium-blue flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl font-poppins">R</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold truncate font-poppins text-rexerium-blue">REXERIUM</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild size="sm" className="bg-rexerium-blue hover:bg-rexerium-blue/90 text-white">
              <Link href="/auth/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Balance Scales Visual */}
            <BalanceScales />
            
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
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-rexerium-blue flex items-center justify-center">
                <span className="text-white font-bold text-sm font-poppins">R</span>
              </div>
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

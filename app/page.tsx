import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRightIcon, BarChart3Icon, RefreshCwIcon, TrendingUpIcon, Brain, Sparkles, AlertTriangle } from 'lucide-react';

// Import startup module to ensure scheduler starts
if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@/lib/startup');
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
          <h1 className="text-lg sm:text-2xl font-bold truncate">Crypto Portfolio Rebalancer</h1>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Crypto Portfolio Rebalancing Made Simple
            </h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground px-2">
              Automatically monitor and rebalance your cryptocurrency portfolio using crypto asset APIs.
              Keep your investments aligned with your target allocation.
            </p>
            <div className="mt-8 sm:mt-10 flex items-center justify-center gap-3 sm:gap-4 px-4">
              <Button asChild size="lg" className="touch-target">
                <Link href="/dashboard">
                  Go to Dashboard
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

        <section className="border-t bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
            <div className="mx-auto max-w-5xl">
              <h3 className="text-center text-2xl sm:text-3xl font-bold mb-2">Features</h3>
              <p className="text-center text-muted-foreground text-sm sm:text-base mb-8 sm:mb-12 px-4">
                Everything you need to manage your crypto portfolio
              </p>
              <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="space-y-3 sm:space-y-4">
                    <BarChart3Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                    <CardTitle className="text-lg sm:text-xl">Portfolio Visualization</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      View your portfolio allocation with interactive charts and graphs
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="space-y-3 sm:space-y-4">
                    <RefreshCwIcon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                    <CardTitle className="text-lg sm:text-xl">Auto Rebalancing</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      Get recommendations on buying and selling to match your target allocation
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="hover:shadow-lg transition-shadow sm:col-span-2 md:col-span-1">
                  <CardHeader className="space-y-3 sm:space-y-4">
                    <TrendingUpIcon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                    <CardTitle className="text-lg sm:text-xl">Real-time Prices</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      Live cryptocurrency prices from crypto asset APIs for accurate calculations
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="hover:shadow-lg transition-shadow sm:col-span-2 md:col-span-3 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2">
                      <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                      <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">Smart Analytics & AI Insights</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      A crypto strategist + data scientist in one. It doesn&apos;t just show numbers — it interprets them, warns you when you&apos;re off balance, and nudges you toward smarter moves.
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
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
              <Link href="/legal/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/legal/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
                Cookie Policy
              </Link>
              <Link href="/legal/risk-disclosure" className="text-muted-foreground hover:text-foreground transition-colors">
                Risk Disclosure
              </Link>
              <Link href="/legal/disclaimer" className="text-muted-foreground hover:text-foreground transition-colors">
                Disclaimer
              </Link>
              <Link href="/legal/compliance" className="text-muted-foreground hover:text-foreground transition-colors">
                Compliance
              </Link>
              <Link href="/legal/security" className="text-muted-foreground hover:text-foreground transition-colors">
                Security
              </Link>
              <Link href="/legal/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Crypto Portfolio Rebalancer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

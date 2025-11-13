import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Risk Disclosure Statement - Crypto Portfolio Rebalancer',
  description: 'Risk Disclosure Statement for Crypto Portfolio Rebalancer',
};

export default function RiskDisclosurePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <Card className="border-destructive/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <CardTitle className="text-3xl">Risk Disclosure Statement</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-lg mb-6">
              <p className="font-semibold text-destructive text-lg">
                ⚠️ IMPORTANT: Please read this Risk Disclosure Statement carefully before using Crypto Portfolio Rebalancer.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. General Risk Warning</h2>
              <p>
                Trading and investing in cryptocurrencies involves substantial risk of loss and is not suitable for every investor. 
                You should carefully consider whether trading cryptocurrencies is suitable for you in light of your circumstances, 
                knowledge, and financial resources.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Volatility Risk</h2>
              <p>
                Cryptocurrency markets are highly volatile. Prices can fluctuate dramatically in short periods, and you may lose 
                all or a substantial portion of your investment. Past performance does not guarantee future results.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>Prices can drop significantly without warning</li>
                <li>Market conditions can change rapidly</li>
                <li>Liquidity may be limited, affecting your ability to buy or sell</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Rebalancing Strategy Risks</h2>
              <p>Automated rebalancing strategies carry specific risks:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Market Timing Risk:</strong> Rebalancing may occur at unfavorable times</li>
                <li><strong>Transaction Costs:</strong> Frequent rebalancing may incur significant fees</li>
                <li><strong>Tax Implications:</strong> Rebalancing may trigger taxable events</li>
                <li><strong>Execution Risk:</strong> Orders may not execute at expected prices</li>
                <li><strong>Slippage:</strong> Actual execution prices may differ from expected prices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Technology and Platform Risks</h2>
              <p>
                Crypto Portfolio Rebalancer is under active development and may contain bugs, errors, or incomplete features:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Software Errors:</strong> Bugs may cause incorrect calculations or failed transactions</li>
                <li><strong>Service Interruptions:</strong> The Service may be unavailable due to maintenance or technical issues</li>
                <li><strong>API Failures:</strong> Exchange API failures may prevent rebalancing operations</li>
                <li><strong>Data Loss:</strong> Technical issues may result in loss of data or settings</li>
                <li><strong>Security Vulnerabilities:</strong> Despite security measures, breaches may occur</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Exchange and Counterparty Risks</h2>
              <p>Risks associated with cryptocurrency exchanges:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Exchange Failures:</strong> Exchanges may suspend trading, freeze accounts, or cease operations</li>
                <li><strong>Hacking:</strong> Exchanges may be subject to security breaches</li>
                <li><strong>Regulatory Changes:</strong> Changes in regulations may affect exchange operations</li>
                <li><strong>Liquidity Risk:</strong> Exchanges may have insufficient liquidity for large orders</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Regulatory and Legal Risks</h2>
              <p>
                Cryptocurrency regulations vary by jurisdiction and may change:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Regulatory changes may affect the legality or tax treatment of cryptocurrencies</li>
                <li>Government actions may restrict or ban cryptocurrency trading</li>
                <li>Tax obligations may arise from trading activities</li>
                <li>Compliance with local laws is your responsibility</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. No Guarantee of Profits</h2>
              <p>
                <strong>WE DO NOT GUARANTEE PROFITS OR PREVENT LOSSES.</strong> The Service provides tools and information 
                for portfolio management, but:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>There is no guarantee that rebalancing will improve portfolio performance</li>
                <li>Past performance does not guarantee future results</li>
                <li>You may lose all or part of your investment</li>
                <li>We are not responsible for any losses you may incur</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. API Key Security Risks</h2>
              <p>
                Using API keys to connect to exchanges carries inherent risks:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Compromised API keys may allow unauthorized trading</li>
                <li>Even with trading-only permissions, losses may occur from unauthorized trades</li>
                <li>API keys should be kept secure and never shared</li>
                <li>We recommend using trading permissions only (no send or withdraw permissions)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. No Financial Advice</h2>
              <p>
                The Service does not provide financial, investment, legal, or tax advice. All information and tools are 
                provided for informational purposes only. You should consult with qualified professionals before making 
                investment decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Your Responsibility</h2>
              <p>You are solely responsible for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All trading decisions and their consequences</li>
                <li>Understanding the risks involved</li>
                <li>Compliance with applicable laws and regulations</li>
                <li>Tax obligations related to your trading activities</li>
                <li>Securing your account and API keys</li>
                <li>Monitoring your portfolio and positions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY LOSSES, DAMAGES, OR COSTS ARISING 
                FROM YOUR USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Loss of funds or assets</li>
                <li>Trading losses</li>
                <li>Errors in calculations or recommendations</li>
                <li>Service interruptions or failures</li>
                <li>Security breaches or unauthorized access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Acknowledgment</h2>
              <p>
                By using Crypto Portfolio Rebalancer, you acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You have read and understood this Risk Disclosure Statement</li>
                <li>You understand the risks involved in cryptocurrency trading</li>
                <li>You are capable of bearing the financial risks</li>
                <li>You accept full responsibility for your trading decisions</li>
                <li>You will not hold us liable for any losses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
              <p>
                For questions about this Risk Disclosure Statement, please contact us through our{' '}
                <Link href="/legal/contact" className="text-primary hover:underline">Contact page</Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


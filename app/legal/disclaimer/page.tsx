import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Disclaimer - Crypto Portfolio Rebalancer',
  description: 'Disclaimer for Crypto Portfolio Rebalancer',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Disclaimer</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 p-4 rounded-lg mb-6">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                Please read this Disclaimer carefully before using Crypto Portfolio Rebalancer.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Not Financial Advice</h2>
              <p>
                <strong>Crypto Portfolio Rebalancer is not a financial advisory service, investment advisor, or broker-dealer.</strong> 
                The Service provides tools and information for portfolio management and rebalancing, but:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We do not provide personalized investment advice</li>
                <li>We do not recommend specific investments or trading strategies</li>
                <li>We are not registered as financial advisors or investment professionals</li>
                <li>All information is provided for informational and educational purposes only</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. No Investment Recommendations</h2>
              <p>
                The Service does not make investment recommendations. Any portfolio allocations, rebalancing suggestions, 
                or calculations are based on your input and are not recommendations. You are solely responsible for all 
                investment decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. No Affiliation with Exchanges</h2>
              <p>
                <strong>We are not affiliated with, endorsed by, or sponsored by any cryptocurrency exchange or market.</strong> 
                References to exchanges or trading platforms are for informational purposes only. We do not have any 
                partnership, affiliate, or business relationship with any exchange.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Service Under Development</h2>
              <p>
                Crypto Portfolio Rebalancer is currently under active development:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The Service may contain bugs, errors, or incomplete features</li>
                <li>Features may change or be removed without notice</li>
                <li>The Service may be unavailable due to maintenance or updates</li>
                <li>We do not recommend using the Service for production or critical trading activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. No Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
                INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Warranties of merchantability or fitness for a particular purpose</li>
                <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
                <li>Warranties regarding the accuracy, completeness, or reliability of information</li>
                <li>Warranties that the Service will meet your requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Any loss of funds, assets, or money</li>
                <li>Any trading losses or investment losses</li>
                <li>Any errors, bugs, or malfunctions in the Service</li>
                <li>Any loss of data or information</li>
                <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Any decisions made based on information provided by the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. User Responsibility</h2>
              <p>
                You acknowledge and agree that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You use the Service at your own risk</li>
                <li>You are solely responsible for all trading and investment decisions</li>
                <li>You are responsible for securing your account and API keys</li>
                <li>You should consult with qualified professionals before making investment decisions</li>
                <li>You should not rely solely on the Service for investment decisions</li>
                <li>You are responsible for compliance with applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Information Accuracy</h2>
              <p>
                While we strive to provide accurate information, we do not guarantee:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The accuracy, completeness, or timeliness of information</li>
                <li>That prices, calculations, or recommendations are correct</li>
                <li>That the Service will identify all risks or opportunities</li>
                <li>That data from exchanges is accurate or up-to-date</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Third-Party Services</h2>
              <p>
                The Service may integrate with third-party services, including cryptocurrency exchanges. We are not responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>The availability, accuracy, or reliability of third-party services</li>
                <li>Any actions or inactions of third-party service providers</li>
                <li>Any losses resulting from third-party service failures</li>
                <li>The terms, conditions, or policies of third-party services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Regulatory Compliance</h2>
              <p>
                We are not responsible for ensuring your compliance with applicable laws and regulations. You are solely 
                responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Understanding and complying with laws in your jurisdiction</li>
                <li>Obtaining necessary licenses or registrations</li>
                <li>Paying applicable taxes</li>
                <li>Complying with anti-money laundering (AML) and know-your-customer (KYC) requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Changes to Service</h2>
              <p>
                We reserve the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Modify, suspend, or discontinue the Service at any time</li>
                <li>Change features, functionality, or pricing without notice</li>
                <li>Update or remove content or information</li>
                <li>Impose limits on usage or access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
              <p>
                For questions about this Disclaimer, please contact us through our{' '}
                <Link href="/legal/contact" className="text-primary hover:underline">Contact page</Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


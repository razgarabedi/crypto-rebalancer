'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LegalPageLayout } from '@/components/legal-page-layout';

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout>
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Crypto Portfolio Rebalancer (&quot;the Service&quot;, &quot;the Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), 
                you accept and agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, 
                you must not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p>
                Crypto Portfolio Rebalancer is a software tool currently under active development that provides portfolio 
                management and rebalancing functionality for cryptocurrency assets. The Service:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Is provided for informational and educational purposes only</li>
                <li>Is not a financial advisory service, investment advisor, or broker-dealer</li>
                <li>Does not provide custody of user funds or assets</li>
                <li>Is not affiliated with any cryptocurrency exchange or market</li>
                <li>May contain bugs, errors, or incomplete features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. No Financial Advice</h2>
              <p>
                The Service does not constitute financial, investment, legal, or tax advice. All information provided by 
                the Service is for informational purposes only. You should consult with qualified financial advisors, 
                legal counsel, and tax professionals before making any investment decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the Service at your own risk</li>
                <li>Ensure your API keys have trading permissions only (no send or withdraw permissions)</li>
                <li>Comply with all applicable laws and regulations in your jurisdiction</li>
                <li>Not use the Service for any illegal or unauthorized purpose</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Be solely responsible for all trading decisions and their consequences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR 
                INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your use or inability to use the Service</li>
                <li>Any loss of funds, data, or assets</li>
                <li>Any errors, bugs, or malfunctions in the Service</li>
                <li>Any unauthorized access to or use of your account or API keys</li>
                <li>Any decisions made based on information provided by the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. No Warranties</h2>
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR 
                IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
                PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Crypto Portfolio Rebalancer, its operators, employees, 
                and affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising 
                from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your access to the Service at any time, with or without cause 
                or notice, for any reason, including violation of these Terms. You may discontinue use of the Service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of material changes by 
                updating the &quot;Last Updated&quot; date. Your continued use of the Service after such changes constitutes 
                acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Governing Law and Dispute Resolution</h2>
              <p>
                These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising 
                from or relating to these Terms or the Service shall be resolved through binding arbitration, except 
                where prohibited by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
              <p>
                For questions about these Terms, please contact us through our{' '}
                <Link href="/legal/contact" className="text-primary hover:underline">
                  Contact page
                </Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </LegalPageLayout>
  );
}


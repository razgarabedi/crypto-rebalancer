'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { LegalPageLayout } from '@/components/legal-page-layout';

export default function CompliancePage() {
  return (
    <LegalPageLayout>
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">Licensing & Compliance</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Regulatory Status</h2>
              <p>
                Crypto Portfolio Rebalancer is a software tool for portfolio management and rebalancing. Our regulatory 
                status and compliance obligations depend on various factors:
              </p>
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="font-medium mb-2">Current Status:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>We are not a registered financial advisor, broker-dealer, or investment advisor</li>
                  <li>We do not provide custody of user funds</li>
                  <li>We are not a money services business (MSB) or money transmitter</li>
                  <li>We do not hold or process user funds directly</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Regulatory Registrations</h2>
              <p>
                Currently, Crypto Portfolio Rebalancer does not hold specific regulatory registrations such as:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>FINTRAC registration (Canada)</li>
                <li>FCA authorization (United Kingdom)</li>
                <li>SEC registration (United States)</li>
                <li>State money transmitter licenses</li>
                <li>Investment advisor registrations</li>
              </ul>
              <p className="mt-4">
                <strong>Note:</strong> This status may change as regulations evolve or if our services expand. We will 
                update this page accordingly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Anti-Money Laundering (AML) & Know Your Customer (KYC)</h2>
              <h3 className="text-xl font-semibold mb-3 mt-4">3.1 Current Approach</h3>
              <p>
                As a non-custodial portfolio management tool, we currently do not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Hold or process user funds</li>
                <li>Require KYC verification for basic account registration</li>
                <li>Conduct AML screening on transactions</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">3.2 User Responsibility</h3>
              <p>
                Users are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Complying with AML/KYC requirements of the exchanges they use</li>
                <li>Ensuring their trading activities comply with applicable laws</li>
                <li>Reporting suspicious activities to relevant authorities</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">3.3 Future Compliance</h3>
              <p>
                If regulatory requirements change or if we expand our services, we may implement AML/KYC procedures 
                and will update users accordingly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Protection & Privacy Compliance</h2>
              <p>
                We are committed to compliance with data protection laws:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>GDPR (EU):</strong> We comply with the General Data Protection Regulation for EU users</li>
                <li><strong>CCPA (California):</strong> We respect California Consumer Privacy Act rights</li>
                <li><strong>Other Jurisdictions:</strong> We aim to comply with applicable privacy laws globally</li>
              </ul>
              <p className="mt-4">
                For details, see our <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Securities Regulations</h2>
              <p>
                Crypto Portfolio Rebalancer does not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Issue, sell, or trade securities</li>
                <li>Operate as a securities exchange or trading platform</li>
                <li>Provide investment advice or recommendations</li>
                <li>Manage investment portfolios on behalf of users</li>
              </ul>
              <p className="mt-4">
                Users are responsible for determining whether their activities constitute regulated activities in their jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Tax Compliance</h2>
              <p>
                We do not provide tax advice. Users are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Understanding tax obligations related to cryptocurrency trading</li>
                <li>Reporting trading activities to tax authorities as required</li>
                <li>Consulting with tax professionals for advice</li>
                <li>Maintaining records of transactions for tax purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. International Compliance</h2>
              <p>
                Cryptocurrency regulations vary by jurisdiction. Users are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Understanding and complying with laws in their jurisdiction</li>
                <li>Ensuring their use of the Service is legal in their location</li>
                <li>Obtaining necessary licenses or registrations if required</li>
                <li>Complying with sanctions and embargo restrictions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Regulatory Disclosures</h2>
              <p>
                Important disclosures:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We are not affiliated with any cryptocurrency exchange or market</li>
                <li>We do not guarantee compliance with all applicable regulations</li>
                <li>Regulations may change, affecting the Service or user obligations</li>
                <li>Users should consult with legal professionals for compliance advice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Reporting & Transparency</h2>
              <p>
                We are committed to transparency and will:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Update this page when our regulatory status changes</li>
                <li>Disclose any regulatory registrations or licenses we obtain</li>
                <li>Notify users of material changes to compliance requirements</li>
                <li>Respond to legitimate regulatory inquiries</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contact for Regulatory Inquiries</h2>
              <p>
                For regulatory inquiries or compliance questions, please contact us through our{' '}
                <Link href="/legal/contact" className="text-primary hover:underline">Contact page</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Related Documents</h2>
              <p>For more information, please review:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link></li>
                <li><Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link></li>
                <li><Link href="/legal/risk-disclosure" className="text-primary hover:underline">Risk Disclosure Statement</Link></li>
                <li><Link href="/legal/disclaimer" className="text-primary hover:underline">Disclaimer</Link></li>
                <li><Link href="/legal/security" className="text-primary hover:underline">Security Page</Link></li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </LegalPageLayout>
  );
}


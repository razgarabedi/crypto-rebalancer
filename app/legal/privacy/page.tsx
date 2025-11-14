'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LegalPageLayout } from '@/components/legal-page-layout';

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout>
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>
                Crypto Portfolio Rebalancer (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, store, and protect your personal information when you use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Personal Information</h3>
              <p>We may collect the following personal information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Information:</strong> Email address, username, password (hashed)</li>
                <li><strong>API Credentials:</strong> Encrypted API keys and secrets for cryptocurrency exchange integration</li>
                <li><strong>Profile Information:</strong> Name, preferences, and settings</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Technical Information</h3>
              <p>We automatically collect certain technical information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>IP Address:</strong> For security and analytics purposes</li>
                <li><strong>Browser Information:</strong> Browser type, version, and device information</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, and interaction patterns</li>
                <li><strong>Cookies and Tracking:</strong> See our <Link href="/legal/cookies" className="text-primary hover:underline">Cookie Policy</Link></li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Financial Data</h3>
              <p>
                We do not directly collect or store your cryptocurrency balances or transaction history. This information 
                is accessed via your API keys in real-time and is not permanently stored on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p>We use your information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>To provide and maintain the Service</li>
                <li>To authenticate your account and secure access</li>
                <li>To connect to cryptocurrency exchanges via API</li>
                <li>To calculate portfolio values and rebalancing recommendations</li>
                <li>To improve the Service and develop new features</li>
                <li>To communicate with you about the Service</li>
                <li>To comply with legal obligations</li>
                <li>To detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. How We Store and Protect Your Information</h2>
              <h3 className="text-xl font-semibold mb-3 mt-4">4.1 Data Storage</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Data is stored on secure servers with encryption at rest</li>
                <li>API credentials are encrypted using industry-standard encryption methods</li>
                <li>Passwords are hashed using bcrypt and never stored in plain text</li>
                <li>We retain your data only as long as necessary to provide the Service</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">4.2 Security Measures</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>SSL/TLS encryption for data in transit</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure API key management</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Information Sharing</h2>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operating the Service (e.g., hosting, analytics)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Protection of Rights:</strong> To protect our rights, property, or safety, or that of our users</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights (GDPR/CCPA Compliance)</h2>
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Objection:</strong> Object to processing of your data for certain purposes</li>
                <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us through our{' '}
                <Link href="/legal/contact" className="text-primary hover:underline">Contact page</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies. For detailed information, please see our{' '}
                <Link href="/legal/cookies" className="text-primary hover:underline">Cookie Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Children&apos;s Privacy</h2>
              <p>
                Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal 
                information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. 
                We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes by updating 
                the &quot;Last Updated&quot; date. Your continued use of the Service after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
              <p>
                For questions about this Privacy Policy or to exercise your rights, please contact us through our{' '}
                <Link href="/legal/contact" className="text-primary hover:underline">Contact page</Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </LegalPageLayout>
  );
}


'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LegalPageLayout } from '@/components/legal-page-layout';

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout>
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Cookie Policy</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
              <p>
                Cookies are small text files that are placed on your device when you visit a website. They are widely used 
                to make websites work more efficiently and provide information to website owners.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
              <p>We use cookies for the following purposes:</p>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Essential Cookies</h3>
              <p>These cookies are necessary for the Service to function properly:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Authentication:</strong> To keep you logged in and maintain your session</li>
                <li><strong>Security:</strong> To protect against fraud and unauthorized access</li>
                <li><strong>Preferences:</strong> To remember your settings and preferences</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Analytics Cookies</h3>
              <p>These cookies help us understand how visitors use our Service:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Page views and navigation patterns</li>
                <li>Feature usage and interaction data</li>
                <li>Error tracking and performance monitoring</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.3 Functional Cookies</h3>
              <p>These cookies enable enhanced functionality:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Theme preferences (light/dark mode)</li>
                <li>Language settings</li>
                <li>UI customization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
              <table className="w-full border-collapse border border-border mt-4">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left">Cookie Type</th>
                    <th className="border border-border p-3 text-left">Purpose</th>
                    <th className="border border-border p-3 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-3">Session Cookie</td>
                    <td className="border border-border p-3">Maintains user session</td>
                    <td className="border border-border p-3">Session (deleted when browser closes)</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">Authentication Token</td>
                    <td className="border border-border p-3">User authentication</td>
                    <td className="border border-border p-3">7 days</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">Theme Preference</td>
                    <td className="border border-border p-3">Stores UI theme setting</td>
                    <td className="border border-border p-3">1 year</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">Analytics</td>
                    <td className="border border-border p-3">Usage analytics (if enabled)</td>
                    <td className="border border-border p-3">2 years</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Third-Party Cookies</h2>
              <p>
                We may use third-party services that set their own cookies. These services may include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Analytics Services:</strong> To understand how users interact with our Service</li>
                <li><strong>Error Tracking:</strong> To identify and fix technical issues</li>
              </ul>
              <p className="mt-4">
                These third parties have their own privacy policies and cookie practices. We do not control these cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Managing Cookies</h2>
              <h3 className="text-xl font-semibold mb-3 mt-4">5.1 Browser Settings</h3>
              <p>You can control cookies through your browser settings:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Block all cookies</li>
                <li>Block third-party cookies</li>
                <li>Delete cookies when you close your browser</li>
                <li>Delete existing cookies</li>
              </ul>
              <p className="mt-4">
                <strong>Note:</strong> Blocking essential cookies may prevent the Service from functioning properly.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-4">5.2 Cookie Consent</h3>
              <p>
                When you first visit our Service, you will be asked to consent to non-essential cookies. You can change 
                your preferences at any time through the cookie consent banner or your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Do Not Track Signals</h2>
              <p>
                Some browsers include a &quot;Do Not Track&quot; (DNT) feature. Currently, there is no standard for how to respond 
                to DNT signals. We do not currently respond to DNT signals, but we respect your cookie preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Updates to This Cookie Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. We will notify you of material changes by updating 
                the &quot;Last Updated&quot; date. Your continued use of the Service after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
              <p>
                For questions about our use of cookies, please contact us through our{' '}
                <Link href="/legal/contact" className="text-primary hover:underline">Contact page</Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </LegalPageLayout>
  );
}


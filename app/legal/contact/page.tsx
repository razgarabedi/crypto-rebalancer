'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, AlertCircle } from 'lucide-react';
import { LegalPageLayout } from '@/components/legal-page-layout';

export default function ContactPage() {
  return (
    <LegalPageLayout>
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Contact & Support</CardTitle>
              <CardDescription>
                Get in touch with us for questions, support, or legal inquiries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">General Inquiries</h2>
                <p className="mb-4">
                  For general questions, technical support, or feedback about Crypto Portfolio Rebalancer, please contact us:
                </p>
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Mail className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      abedihassan78@gmail.com
                    </p>
                  
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Legal & Compliance</h2>
                <p className="mb-4">
                  For legal inquiries, privacy requests, or compliance matters:
                </p>
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <Mail className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">Legal Email</p>
                    <p className="text-sm text-muted-foreground">
                      legal@cryptoportfoliorebalancer.com
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Please note: This is a placeholder. Update with your actual legal contact email.)
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Business Address</h2>
                <p className="mb-4">
                  For formal correspondence or regulatory inquiries:
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">Crypto Portfolio Rebalancer</p>
                  <p className="text-sm text-muted-foreground">
                    [Your Business Address]
                  </p>
                  <p className="text-sm text-muted-foreground">
                    [City, State/Province, Postal Code]
                  </p>
                  <p className="text-sm text-muted-foreground">
                    [Country]
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    (Please note: Update with your actual business address or registered office address.)
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Response Times</h2>
                <p className="mb-4">
                  We aim to respond to inquiries within:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>General Support:</strong> 2-5 business days</li>
                  <li><strong>Legal/Privacy Requests:</strong> 5-10 business days (as required by law)</li>
                  <li><strong>Urgent Security Issues:</strong> Within 24 hours</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Privacy & Data Requests</h2>
                <p className="mb-4">
                  To exercise your privacy rights (access, deletion, portability, etc.) under GDPR, CCPA, or other applicable laws:
                </p>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <p className="text-sm">
                    Please send your request to the Legal Email above with the subject line &quot;Privacy Request&quot; and include:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-sm">
                    <li>Your full name and email address associated with your account</li>
                    <li>The type of request (access, deletion, correction, etc.)</li>
                    <li>Any additional information needed to verify your identity</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Security Issues</h2>
                <p className="mb-4">
                  If you discover a security vulnerability or have a security concern:
                </p>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 mt-0.5 text-yellow-600 dark:text-yellow-500" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Responsible Disclosure
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Please report security issues responsibly. Do not publicly disclose vulnerabilities until they have been addressed.
                        Send details to: security@cryptoportfoliorebalancer.com
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
                <p className="mb-4">
                  Before contacting us, you may find answers in our documentation:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link></li>
                  <li><Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link></li>
                  <li><Link href="/legal/risk-disclosure" className="text-primary hover:underline">Risk Disclosure</Link></li>
                  <li><Link href="/legal/disclaimer" className="text-primary hover:underline">Disclaimer</Link></li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Important Notes</h2>
                <div className="space-y-3">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">⚠️ No Financial Advice</p>
                    <p className="text-sm text-muted-foreground">
                      We do not provide financial, investment, or trading advice. Please consult with qualified professionals 
                      for investment decisions.
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">🔒 Account Security</p>
                    <p className="text-sm text-muted-foreground">
                      For account security, we will only respond to requests from the email address associated with your account. 
                      We may require additional verification for sensitive requests.
                    </p>
                  </div>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </LegalPageLayout>
  );
}


'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Key, AlertTriangle } from 'lucide-react';
import { LegalPageLayout } from '@/components/legal-page-layout';

export default function SecurityPage() {
  return (
    <LegalPageLayout>
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">Security</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Our Commitment to Security</h2>
              <p>
                At Crypto Portfolio Rebalancer, we take security seriously. We implement industry-standard security measures 
                to protect your data and API credentials. However, no system is 100% secure, and users should take their 
                own security precautions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Data Encryption</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">2.1 Encryption in Transit</h3>
                    <p>
                      All data transmitted between your browser and our servers is encrypted using SSL/TLS (HTTPS). 
                      This protects your information from interception during transmission.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">2.2 Encryption at Rest</h3>
                    <p>
                      Sensitive data stored on our servers is encrypted at rest using industry-standard encryption methods. 
                      This includes:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                      <li>API keys and secrets (encrypted before storage)</li>
                      <li>User passwords (hashed using bcrypt)</li>
                      <li>Personal information</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. API Key Management</h2>
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="mb-4">
                    Your API credentials are handled with extreme care:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Encryption:</strong> API keys are encrypted before being stored in our database</li>
                    <li><strong>Access Control:</strong> Only authorized systems can decrypt and use API keys</li>
                    <li><strong>No Plain Text Storage:</strong> API keys are never stored in plain text</li>
                    <li><strong>Secure Transmission:</strong> API keys are only transmitted over encrypted connections</li>
                    <li><strong>User Control:</strong> You can delete your API keys at any time through your profile</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 p-4 rounded-lg mt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-600 dark:text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Important: API Key Security
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Always use trading permissions only (no send or withdraw permissions) when creating API keys. 
                      This limits potential damage if your API keys are compromised.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Authentication & Access Control</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Password Security:</strong> Passwords are hashed using bcrypt with salt</li>
                <li><strong>Session Management:</strong> Secure session tokens with expiration</li>
                <li><strong>Account Protection:</strong> Rate limiting on login attempts</li>
                <li><strong>Multi-Factor Authentication:</strong> (Future feature - not currently implemented)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Infrastructure Security</h2>
              <h3 className="text-xl font-semibold mb-3 mt-4">5.1 Server Security</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Servers are regularly updated with security patches</li>
                <li>Firewall rules restrict unnecessary access</li>
                <li>Intrusion detection and monitoring systems</li>
                <li>Regular security audits and assessments</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">5.2 Database Security</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Database access is restricted and monitored</li>
                <li>Regular backups with encryption</li>
                <li>Database credentials are securely managed</li>
                <li>Principle of least privilege for database access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Non-Custodial Architecture</h2>
              <p>
                Crypto Portfolio Rebalancer is a non-custodial service:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We do not hold or store your cryptocurrency funds</li>
                <li>We do not have access to withdraw or transfer your funds</li>
                <li>Your funds remain on the exchanges you connect via API</li>
                <li>This reduces the risk of loss due to security breaches</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Security Monitoring</h2>
              <p>
                We monitor our systems for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Unauthorized access attempts</li>
                <li>Suspicious activity patterns</li>
                <li>System vulnerabilities</li>
                <li>Performance anomalies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Incident Response</h2>
              <p>
                In the event of a security incident:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We will investigate and contain the incident</li>
                <li>We will notify affected users as required by law</li>
                <li>We will take steps to prevent future incidents</li>
                <li>We will provide updates on our response</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Security Best Practices for Users</h2>
              <p>To enhance your security, we recommend:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Strong Passwords:</strong> Use unique, complex passwords</li>
                <li><strong>API Key Permissions:</strong> Only grant trading permissions (no send/withdraw)</li>
                <li><strong>Regular Updates:</strong> Keep your browser and devices updated</li>
                <li><strong>Secure Networks:</strong> Avoid using public Wi-Fi for sensitive operations</li>
                <li><strong>Monitor Activity:</strong> Regularly review your account activity</li>
                <li><strong>Logout:</strong> Log out when finished, especially on shared devices</li>
                <li><strong>Two-Factor Authentication:</strong> Enable 2FA on your exchange accounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Vulnerability Disclosure</h2>
              <p>
                If you discover a security vulnerability, please report it responsibly:
              </p>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4 rounded-lg mt-4">
                <p className="font-medium mb-2">Responsible Disclosure Process:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-sm">
                  <li>Email security details to: security@cryptoportfoliorebalancer.com</li>
                  <li>Do not publicly disclose the vulnerability until it is fixed</li>
                  <li>Provide sufficient detail for us to reproduce and fix the issue</li>
                  <li>Allow reasonable time for us to address the vulnerability</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-3">
                  We appreciate responsible disclosure and will work with security researchers to address issues.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Limitations & Disclaimers</h2>
              <p>
                While we implement security best practices:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>No system is 100% secure</li>
                <li>We cannot guarantee absolute security</li>
                <li>Users are responsible for securing their accounts and API keys</li>
                <li>We are not liable for losses due to security breaches</li>
              </ul>
              <p className="mt-4">
                See our <Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
                <Link href="/legal/risk-disclosure" className="text-primary hover:underline">Risk Disclosure</Link> for more information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Security Updates</h2>
              <p>
                We regularly update our security practices and will update this page to reflect significant changes. 
                We recommend reviewing this page periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Contact</h2>
              <p>
                For security-related questions or to report vulnerabilities, please contact us through our{' '}
                <Link href="/legal/contact" className="text-primary hover:underline">Contact page</Link>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </LegalPageLayout>
  );
}


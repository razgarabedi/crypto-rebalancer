import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/hooks/use-i18n";
import { CookieConsent } from "@/components/cookie-consent";
import { LicenseGuard } from "@/components/license-guard";

// Force dynamic rendering - don't cache or pre-render
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Force scheduler startup on server side
if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@/lib/force-scheduler-startup');
}

// Rexerium Brand Fonts
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Rexerium Crypto - Intelligent Asset Management for Digital Finance",
  description: "Balance Your Future. Intelligent asset management for digital finance. Empower your crypto decisions with precision and intelligence.",
  icons: {
    icon: '/logo/logo.png',
    shortcut: '/logo/logo.png',
    apple: '/logo/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1E3A8A' }, // Rexerium Blue
    { media: '(prefers-color-scheme: dark)', color: '#06B6D4' }, // Electric Cyan
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${inter.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <LicenseGuard>
              {children}
            </LicenseGuard>
            <CookieConsent />
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthGuard } from '@/components/auth-guard';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { ResponsiveSidebar } from '@/components/responsive-sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { ArrowLeft, User, Lock, Mail, Calendar, Briefcase, Shield, Key, Eye, EyeOff, CheckCircle, AlertCircle, Globe, Award } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useI18n } from '@/lib/hooks/use-i18n';
import { Language } from '@/lib/i18n';

interface LicenseInfo {
  isValid: boolean;
  isActivated: boolean;
  licenseType?: string;
  expiresAt?: string;
  daysRemaining?: number;
  serverId?: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  language: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    portfolios: number;
    sessions: number;
  };
}

export default function ProfilePage() {
  const { t, language, setLanguage } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Kraken credentials
  const [hasKrakenCredentials, setHasKrakenCredentials] = useState(false);
  const [krakenAddedAt, setKrakenAddedAt] = useState<string | null>(null);
  const [krakenApiKey, setKrakenApiKey] = useState('');
  const [krakenApiSecret, setKrakenApiSecret] = useState('');
  const [showKrakenSecret, setShowKrakenSecret] = useState(false);
  const [isSavingKraken, setIsSavingKraken] = useState(false);
  const [isTestingKraken, setIsTestingKraken] = useState(false);
  const [isDeletingKraken, setIsDeletingKraken] = useState(false);

  // License info
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [loadingLicense, setLoadingLicense] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchKrakenCredentials();
    fetchLicenseInfo();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      setProfile(data.user);
      setName(data.user.name || '');
      setEmail(data.user.email);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
      await fetchProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/auth/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const fetchKrakenCredentials = async () => {
    try {
      const response = await fetch('/api/auth/kraken-credentials');
      const data = await response.json();

      if (response.ok) {
        setHasKrakenCredentials(data.hasCredentials);
        setKrakenAddedAt(data.addedAt);
      }
    } catch (error) {
      console.error('Failed to fetch Kraken credentials status:', error);
    }
  };

  const handleSaveKrakenCredentials = async (e: React.FormEvent, testFirst = false) => {
    e.preventDefault();

    if (!krakenApiKey.trim() || !krakenApiSecret.trim()) {
      toast.error('Please enter both API key and secret');
      return;
    }

    setIsSavingKraken(true);

    try {
      const response = await fetch('/api/auth/kraken-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: krakenApiKey,
          apiSecret: krakenApiSecret,
          testConnection: testFirst,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save credentials');
      }

      toast.success(testFirst ? 'Credentials verified and saved!' : 'Credentials saved successfully');
      setKrakenApiKey('');
      setKrakenApiSecret('');
      setShowKrakenSecret(false);
      await fetchKrakenCredentials();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save credentials');
    } finally {
      setIsSavingKraken(false);
    }
  };

  const handleTestKrakenCredentials = async () => {
    setIsTestingKraken(true);

    try {
      const response = await fetch('/api/auth/kraken-credentials', {
        method: 'PUT',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test credentials');
      }

      toast.success('✓ Credentials are valid and working!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Credentials test failed');
    } finally {
      setIsTestingKraken(false);
    }
  };

  const handleDeleteKrakenCredentials = async () => {
    if (!confirm('Are you sure you want to remove your crypto asset API credentials? This will prevent automatic portfolio rebalancing.')) {
      return;
    }

    setIsDeletingKraken(true);

    try {
      const response = await fetch('/api/auth/kraken-credentials', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete credentials');
      }

      toast.success('Credentials removed successfully');
      await fetchKrakenCredentials();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete credentials');
    } finally {
      setIsDeletingKraken(false);
    }
  };

  const fetchLicenseInfo = async () => {
    try {
      setLoadingLicense(true);
      const response = await fetch('/api/license/check');
      const data = await response.json();
      setLicenseInfo(data);
    } catch (error) {
      console.error('Failed to fetch license info:', error);
    } finally {
      setLoadingLicense(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <ResponsiveSidebar />
        <MobileNav />

        <div className="flex-1 overflow-auto">
          {/* Header */}
          <header className="border-b sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t.profile.backToDashboard}
                  </Link>
                </Button>
                <h1 className="text-2xl font-bold hidden sm:block">{t.profile.title}</h1>
              </div>
              <div className="flex items-center gap-4">
                <UserNav />
                <ThemeToggle />
              </div>
            </div>
          </header>

          <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
            {/* Profile Overview */}
            {profile && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{profile.name || 'User'}</CardTitle>
                      <CardDescription>{profile.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t.profile.portfolios}</p>
                        <p className="text-lg font-semibold">{profile._count.portfolios}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t.profile.activeSessions}</p>
                        <p className="text-lg font-semibold">{profile._count.sessions}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t.profile.memberSince}</p>
                        <p className="text-lg font-semibold">
                          {format(new Date(profile.createdAt), 'MMM yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Update Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {t.profile.profileInformation}
                </CardTitle>
                <CardDescription>
                  {t.profile.updateNameAndEmail}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.profile.name}</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder={t.profile.yourName}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isUpdatingProfile || loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.profile.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t.profile.yourEmail}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isUpdatingProfile || loading}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isUpdatingProfile || loading}>
                    {isUpdatingProfile ? t.profile.updating : t.profile.updateProfile}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Change Password Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  {t.profile.changePassword}
                </CardTitle>
                <CardDescription>
                  {t.profile.updatePasswordSecure}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t.profile.currentPassword}</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder={t.profile.enterCurrentPassword}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isChangingPassword}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t.profile.newPassword}</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder={t.profile.enterNewPassword}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isChangingPassword}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t.profile.confirmNewPassword}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t.profile.confirmNewPasswordPlaceholder}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isChangingPassword}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? t.profile.changingPassword : t.profile.changePasswordButton}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Kraken API Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  {t.profile.krakenCredentials}
                </CardTitle>
                <CardDescription>
                  {t.profile.configureKrakenCredentials}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasKrakenCredentials ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900 dark:text-green-100">
                          {t.profile.credentialsConfigured}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {t.profile.credentialsConfiguredDescription}{' '}
                          {krakenAddedAt && format(new Date(krakenAddedAt), 'PPP')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleTestKrakenCredentials}
                        disabled={isTestingKraken}
                      >
                        {isTestingKraken ? t.profile.testing : t.profile.testConnection}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDeleteKrakenCredentials}
                        disabled={isDeletingKraken}
                      >
                        {isDeletingKraken ? t.profile.removing : t.profile.removeCredentials}
                      </Button>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Note:</strong> {t.profile.updateCredentialsNote}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => handleSaveKrakenCredentials(e, true)} className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-900 dark:text-yellow-100">
                          {t.profile.noCredentialsConfigured}
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          {t.profile.noCredentialsDescription}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="krakenApiKey">{t.profile.krakenApiKey}</Label>
                      <Input
                        id="krakenApiKey"
                        type="text"
                        placeholder={t.profile.enterKrakenApiKey}
                        value={krakenApiKey}
                        onChange={(e) => setKrakenApiKey(e.target.value)}
                        disabled={isSavingKraken}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="krakenApiSecret">{t.profile.krakenApiSecret}</Label>
                      <div className="relative">
                        <Input
                          id="krakenApiSecret"
                          type={showKrakenSecret ? 'text' : 'password'}
                          placeholder={t.profile.enterKrakenApiSecret}
                          value={krakenApiSecret}
                          onChange={(e) => setKrakenApiSecret(e.target.value)}
                          disabled={isSavingKraken}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKrakenSecret(!showKrakenSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showKrakenSecret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted text-sm space-y-2">
                      <p className="font-medium">{t.profile.howToGetCredentials}</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        {t.profile.howToGetCredentialsSteps?.map((step, index) => (
                          <li key={index}>{step}</li>
                        )) || (
                          <>
                            <li>Log in to your Kraken account</li>
                            <li>Go to Settings → API</li>
                            <li>Click &quot;Generate New Key&quot;</li>
                            <li>Enable permissions: Query Funds, Query Open Orders & Trades, Create & Modify Orders</li>
                            <li>Copy your API Key and Private Key</li>
                          </>
                        )}
                      </ol>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={isSavingKraken}>
                        {isSavingKraken ? t.profile.saving : t.profile.saveAndTestCredentials}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => handleSaveKrakenCredentials(e, false)}
                        disabled={isSavingKraken}
                      >
                        {t.profile.saveWithoutTesting}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Language Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t.profile.selectLanguage}
                </CardTitle>
                <CardDescription>
                  {t.profile.selectLanguage}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="language">{t.profile.selectLanguage}</Label>
                  <Select
                    value={language}
                    onValueChange={(value: Language) => setLanguage(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? t.profile.selectLanguageDescription
                      : t.profile.selectLanguageDescriptionDe
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Details */}
            {profile && (
              <Card>
                <CardHeader>
                  <CardTitle>{t.profile.accountDetails}</CardTitle>
                  <CardDescription>
                    {t.profile.accountInformationAndStats}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{t.profile.userID}</span>
                      <span className="font-mono">{profile.id}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{t.profile.accountCreated}</span>
                      <span>{format(new Date(profile.createdAt), 'PPP')}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{t.profile.lastUpdated}</span>
                      <span>{format(new Date(profile.updatedAt), 'PPP')}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">{t.profile.status}</span>
                      <span className="text-green-600 font-medium">{t.profile.active}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* License Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Software License
                </CardTitle>
                <CardDescription>
                  Your license activation status and details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLicense ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading license information...
                  </div>
                ) : licenseInfo?.isActivated ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900 dark:text-green-100">
                          License Activated
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Your software is properly licensed and activated.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">License Type</span>
                        <span className="font-medium uppercase">
                          {licenseInfo.licenseType || 'Unknown'}
                        </span>
                      </div>
                      
                      {licenseInfo.licenseType === 'lifetime' ? (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Expiration</span>
                          <span className="font-medium text-green-600">
                            Never (Lifetime)
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Expires On</span>
                            <span className="font-medium">
                              {licenseInfo.expiresAt 
                                ? format(new Date(licenseInfo.expiresAt), 'PPP')
                                : 'N/A'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Days Remaining</span>
                            <span className={`font-medium ${
                              licenseInfo.daysRemaining && licenseInfo.daysRemaining < 30 
                                ? 'text-orange-600' 
                                : 'text-green-600'
                            }`}>
                              {licenseInfo.daysRemaining !== undefined 
                                ? `${licenseInfo.daysRemaining} days`
                                : 'N/A'
                              }
                            </span>
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Server ID</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                          {licenseInfo.serverId || 'N/A'}
                        </code>
                      </div>
                    </div>

                    {licenseInfo.daysRemaining !== undefined && licenseInfo.daysRemaining < 30 && (
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-orange-900 dark:text-orange-100">
                            License Expiring Soon
                          </p>
                          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                            Your license will expire in {licenseInfo.daysRemaining} days. Please renew to continue using the software.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900 dark:text-red-100">
                          No Active License
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          This software requires a valid license key to operate. Please activate your license.
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Contact us to obtain a license key, or if you already have one, you should be prompted to activate it on your next login.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}


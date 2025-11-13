'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePortfolioStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftIcon, PlusIcon, XIcon, CheckIcon } from 'lucide-react';
import { useI18n } from '@/lib/hooks/use-i18n';

interface AssetWeight {
  symbol: string;
  weight: number;
}

const COMMON_ASSETS = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'MATIC', 'LINK', 'AVAX', 'ATOM', 'UNI', 'CPOOL', 'RLC', 'RPL', 'EWT'];
const REBALANCE_INTERVALS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-Weekly', value: 'biweekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
];
const ORDER_TYPES = [
  { 
    label: 'Market Orders (Taker)', 
    value: 'market',
    description: 'Immediate execution, higher fees (~0.26%)'
  },
  { 
    label: 'Limit Orders (Maker)', 
    value: 'limit',
    description: 'Lower fees (~0.16%), but slower execution'
  },
];

export default function EditPortfolioPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const { updateDBPortfolio, fetchDBPortfolio, currentDBPortfolio, isLoading, error: storeError } = usePortfolioStore();

  const portfolioId = params.id as string;

  // Form state
  const [portfolioName, setPortfolioName] = useState('');
  const [assets, setAssets] = useState<AssetWeight[]>([]);
  const [rebalanceInterval, setRebalanceInterval] = useState('weekly');
  const [rebalanceEnabled, setRebalanceEnabled] = useState(true);
  const [rebalanceThreshold, setRebalanceThreshold] = useState(10);
  const [maxOrders, setMaxOrders] = useState(10);
  const [thresholdRebalanceEnabled, setThresholdRebalanceEnabled] = useState(false);
  const [thresholdRebalancePercentage, setThresholdRebalancePercentage] = useState(3);
  const [orderType, setOrderType] = useState('market');
  const [smartRoutingEnabled, setSmartRoutingEnabled] = useState(true);
  const [schedulerEnabled, setSchedulerEnabled] = useState(true);
  const [checkFrequency, setCheckFrequency] = useState('every_30_minutes');

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load portfolio data
  useEffect(() => {
    if (portfolioId) {
      fetchDBPortfolio(portfolioId);
    }
  }, [portfolioId, fetchDBPortfolio]);

  // Populate form when portfolio data is loaded
  useEffect(() => {
    if (currentDBPortfolio) {
      setPortfolioName(currentDBPortfolio.name);
      setRebalanceInterval(currentDBPortfolio.rebalanceInterval);
      setRebalanceEnabled(currentDBPortfolio.rebalanceEnabled);
      setRebalanceThreshold(currentDBPortfolio.rebalanceThreshold);
      setMaxOrders(currentDBPortfolio.maxOrdersPerRebalance || 10);
      setThresholdRebalanceEnabled(currentDBPortfolio.thresholdRebalanceEnabled || false);
      setThresholdRebalancePercentage(currentDBPortfolio.thresholdRebalancePercentage || 3);
      setOrderType(currentDBPortfolio.orderType || 'market');
      setSmartRoutingEnabled(currentDBPortfolio.smartRoutingEnabled !== false);
      setSchedulerEnabled(currentDBPortfolio.schedulerEnabled !== false);
      setCheckFrequency(currentDBPortfolio.checkFrequency || 'every_30_minutes'); // Default to 30 minutes if not set
      
      // Debug logging
      console.log('Portfolio loaded:', {
        schedulerEnabled: currentDBPortfolio.schedulerEnabled,
        checkFrequency: currentDBPortfolio.checkFrequency,
        hasSchedulerSettings: 'schedulerEnabled' in currentDBPortfolio
      });

      // Convert target weights to assets array
      const targetWeights = currentDBPortfolio.targetWeights as Record<string, number>;
      const assetsArray = Object.entries(targetWeights).map(([symbol, weight]) => ({
        symbol,
        weight
      }));
      setAssets(assetsArray);
    }
  }, [currentDBPortfolio]);

  // Calculate total weight
  const totalWeight = assets.reduce((sum, asset) => sum + asset.weight, 0);
  const isValidWeight = totalWeight === 100;

  // Add new asset
  const addAsset = () => {
    setAssets([...assets, { symbol: '', weight: 0 }]);
  };

  // Remove asset and redistribute weights proportionally
  const removeAsset = (index: number) => {
    const assetToRemove = assets[index];
    const remainingAssets = assets.filter((_, i) => i !== index);
    
    if (remainingAssets.length === 0) {
      setAssets([]);
      return;
    }
    
    // If the removed asset had weight > 0, redistribute it proportionally among remaining assets
    if (assetToRemove.weight > 0) {
      const totalRemainingWeight = remainingAssets.reduce((sum, asset) => sum + asset.weight, 0);
      
      if (totalRemainingWeight > 0) {
        // Redistribute the removed weight proportionally
        const redistributionFactor = (totalRemainingWeight + assetToRemove.weight) / totalRemainingWeight;
        
        const redistributedAssets = remainingAssets.map(asset => ({
          ...asset,
          weight: parseFloat((asset.weight * redistributionFactor).toFixed(2))
        }));
        
        setAssets(redistributedAssets);
      } else {
        // If no remaining weight, distribute evenly
        const evenWeight = 100 / remainingAssets.length;
        const redistributedAssets = remainingAssets.map(asset => ({
          ...asset,
          weight: parseFloat(evenWeight.toFixed(2))
        }));
        
        setAssets(redistributedAssets);
      }
    } else {
      // If removed asset had no weight, just remove it
      setAssets(remainingAssets);
    }
  };

  // Update asset symbol
  const updateAssetSymbol = (index: number, symbol: string) => {
    const newAssets = [...assets];
    newAssets[index].symbol = symbol.toUpperCase();
    setAssets(newAssets);
  };

  // Update asset weight
  const updateAssetWeight = (index: number, weight: string) => {
    const newAssets = [...assets];
    newAssets[index].weight = parseFloat(weight) || 0;
    setAssets(newAssets);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate portfolio name
    if (!portfolioName.trim()) {
      newErrors.portfolioName = t.portfolioForm.portfolioNameRequired;
    }

    // Validate assets
    if (assets.length === 0) {
      newErrors.assets = t.portfolioForm.atLeastOneAsset;
    }

    // Validate asset symbols
    const symbols = assets.map(a => a.symbol.trim().toUpperCase());
    if (symbols.some(s => !s)) {
      newErrors.assetSymbols = t.portfolioForm.allAssetsMustHaveSymbol;
    }

    // Check for duplicate symbols
    const uniqueSymbols = new Set(symbols);
    if (uniqueSymbols.size !== symbols.length) {
      newErrors.duplicateSymbols = t.portfolioForm.duplicateAssetSymbols;
    }

    // Validate weights
    if (assets.some(a => a.weight <= 0)) {
      newErrors.assetWeights = t.portfolioForm.allWeightsMustBeGreaterThan0;
    }

    // Validate total weight
    if (totalWeight !== 100) {
      newErrors.totalWeight = t.portfolioForm.totalWeightMustBe100.replace('{total}', totalWeight.toFixed(2));
    }

    // Validate rebalance threshold
    if (rebalanceThreshold <= 0) {
      newErrors.rebalanceThreshold = t.portfolioForm.rebalanceThresholdMustBeGreaterThan0;
    }

    // Validate max orders
    if (maxOrders <= 0) {
      newErrors.maxOrders = t.portfolioForm.maxOrdersMustBeGreaterThan0;
    }

    // Validate threshold rebalance percentage
    if (thresholdRebalanceEnabled && thresholdRebalancePercentage <= 0) {
      newErrors.thresholdRebalancePercentage = t.portfolioForm.thresholdPercentageMustBeGreaterThan0;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Prepare target weights
    const targetWeights: Record<string, number> = {};
    assets.forEach(asset => {
      if (asset.symbol.trim()) {
        targetWeights[asset.symbol.trim().toUpperCase()] = asset.weight;
      }
    });

    try {
      // Update portfolio
      await updateDBPortfolio(portfolioId, {
        name: portfolioName.trim(),
        targetWeights,
        rebalanceEnabled,
        rebalanceInterval,
        rebalanceThreshold,
        maxOrdersPerRebalance: maxOrders,
        thresholdRebalanceEnabled,
        thresholdRebalancePercentage,
        orderType,
        smartRoutingEnabled,
        schedulerEnabled,
        checkFrequency,
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to update portfolio:', err);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push('/dashboard');
  };

  // Auto-distribute weights evenly
  const distributeEvenly = () => {
    if (assets.length === 0) return;
    const evenWeight = 100 / assets.length;
    setAssets(assets.map(asset => ({ ...asset, weight: parseFloat(evenWeight.toFixed(2)) })));
  };

  // Normalize weights to 100%
  const normalizeWeights = () => {
    if (totalWeight === 0) return;
    const factor = 100 / totalWeight;
    setAssets(assets.map(asset => ({ ...asset, weight: parseFloat((asset.weight * factor).toFixed(2)) })));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t.portfolioForm.loadingPortfolio}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentDBPortfolio) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t.portfolioForm.portfolioNotFound}</h1>
          <p className="text-muted-foreground mb-4">{t.portfolioForm.portfolioNotFoundDescription}</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            {t.portfolioForm.backToDashboard}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          {t.portfolioForm.backToDashboard}
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{t.portfolioForm.editPortfolio}</h1>
          <p className="text-muted-foreground">{t.portfolioForm.editDescription}</p>
        </div>
      </div>

      {/* Error Alert */}
      {storeError && (
        <div className="mb-6 p-4 border border-destructive bg-destructive/10 rounded-lg">
          <p className="text-destructive font-medium">{t.portfolioForm.error}</p>
          <p className="text-sm text-destructive/80">{storeError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t.portfolioForm.basicInformation}</CardTitle>
            <CardDescription>{t.portfolioForm.basicInformationDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="portfolioName">{t.portfolioForm.portfolioName}</Label>
              <Input
                id="portfolioName"
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                placeholder={t.portfolioForm.portfolioNamePlaceholder}
                className={errors.portfolioName ? 'border-destructive' : ''}
              />
              {errors.portfolioName && (
                <p className="text-sm text-destructive mt-1">{errors.portfolioName}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Asset Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>{t.portfolioForm.assetAllocation}</CardTitle>
            <CardDescription>{t.portfolioForm.defineTargetWeights}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total Weight Indicator */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">{t.portfolioForm.totalAllocation}</span>
              <Badge variant={isValidWeight ? 'default' : 'destructive'}>
                {totalWeight.toFixed(2)}%
              </Badge>
            </div>

            {/* Assets List */}
            <div className="space-y-3">
              {assets.map((asset, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1 w-full">
                    <Label htmlFor={`symbol-${index}`}>{t.portfolioForm.symbol}</Label>
                    <Input
                      id={`symbol-${index}`}
                      value={asset.symbol}
                      onChange={(e) => updateAssetSymbol(index, e.target.value)}
                      placeholder={t.portfolioForm.assetSymbolPlaceholder}
                      list={`symbols-${index}`}
                      className={errors.assetSymbols ? 'border-destructive' : ''}
                    />
                    <datalist id={`symbols-${index}`}>
                      {COMMON_ASSETS.map(symbol => (
                        <option key={symbol} value={symbol} />
                      ))}
                    </datalist>
                  </div>
                  <div className="w-full sm:w-24">
                    <Label htmlFor={`weight-${index}`}>{t.portfolioForm.weight}</Label>
                    <Input
                      id={`weight-${index}`}
                      type="number"
                      value={asset.weight}
                      onChange={(e) => updateAssetWeight(index, e.target.value)}
                      min="0"
                      max="100"
                      step="0.01"
                      className={errors.assetWeights ? 'border-destructive' : ''}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeAsset(index)}
                    className="text-destructive hover:text-destructive self-start"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Asset Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={addAsset}>
                <PlusIcon className="mr-2 h-4 w-4" />
                {t.portfolioForm.addAsset}
              </Button>
              <Button type="button" variant="outline" onClick={distributeEvenly}>
                {t.portfolioForm.distributeEvenly}
              </Button>
              <Button type="button" variant="outline" onClick={normalizeWeights}>
                {t.portfolioForm.normalizeTo100}
              </Button>
            </div>

            {/* Validation Errors */}
            {errors.assets && (
              <p className="text-sm text-destructive">{errors.assets}</p>
            )}
            {errors.assetSymbols && (
              <p className="text-sm text-destructive">{errors.assetSymbols}</p>
            )}
            {errors.duplicateSymbols && (
              <p className="text-sm text-destructive">{errors.duplicateSymbols}</p>
            )}
            {errors.assetWeights && (
              <p className="text-sm text-destructive">{errors.assetWeights}</p>
            )}
            {errors.totalWeight && (
              <p className="text-sm text-destructive">{errors.totalWeight}</p>
            )}
          </CardContent>
        </Card>

        {/* Rebalancing Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Rebalancing Settings</CardTitle>
            <CardDescription>Configure automatic rebalancing behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Time-based Rebalancing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Time-Based Rebalancing</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically rebalance portfolio at specified intervals
                  </p>
                </div>
                <Button
                  type="button"
                  variant={rebalanceEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRebalanceEnabled(!rebalanceEnabled)}
                >
                  {rebalanceEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {rebalanceEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rebalanceInterval">Rebalance Interval</Label>
                    <Select value={rebalanceInterval} onValueChange={setRebalanceInterval}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REBALANCE_INTERVALS.map(interval => (
                          <SelectItem key={interval.value} value={interval.value}>
                            {interval.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="maxOrders">Max Orders Per Rebalance</Label>
                    <Input
                      id="maxOrders"
                      type="number"
                      value={maxOrders}
                      onChange={(e) => setMaxOrders(parseInt(e.target.value) || 0)}
                      min="1"
                      className={errors.maxOrders ? 'border-destructive' : ''}
                    />
                    {errors.maxOrders && (
                      <p className="text-sm text-destructive mt-1">{errors.maxOrders}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Common Settings (applies to both strategies) */}
            {(rebalanceEnabled || thresholdRebalanceEnabled) && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="text-sm font-semibold mb-4">Trade Settings (Both Strategies)</h4>
                <div className="space-y-2">
                  <Label htmlFor="rebalanceThreshold">Minimum Trade Amount (EUR)</Label>
                  <Input
                    id="rebalanceThreshold"
                    type="number"
                    value={rebalanceThreshold}
                    onChange={(e) => setRebalanceThreshold(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className={errors.rebalanceThreshold ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only execute trades larger than this amount. For a typical portfolio, recommended: €5-10 for larger portfolios, €1-2 for smaller ones
                  </p>
                  {errors.rebalanceThreshold && (
                    <p className="text-sm text-destructive">{errors.rebalanceThreshold}</p>
                  )}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Threshold-based Rebalancing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Threshold-Based Rebalancing</Label>
                  <p className="text-sm text-muted-foreground">
                    Trigger rebalancing when any asset deviates by specified percentage
                  </p>
                </div>
                <Button
                  type="button"
                  variant={thresholdRebalanceEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setThresholdRebalanceEnabled(!thresholdRebalanceEnabled);
                    // Automatically disable monitoring when threshold-based rebalancing is turned off
                    if (thresholdRebalanceEnabled) {
                      setSchedulerEnabled(false);
                    }
                  }}
                >
                  {thresholdRebalanceEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              {thresholdRebalanceEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="thresholdPercentage">
                      Deviation Threshold (%)
                    </Label>
                    <Input
                      id="thresholdPercentage"
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.1"
                      value={thresholdRebalancePercentage}
                      onChange={(e) => setThresholdRebalancePercentage(parseFloat(e.target.value) || 0)}
                      className={errors.thresholdRebalancePercentage ? 'border-destructive' : ''}
                    />
                    <p className="text-xs text-muted-foreground">
                      Rebalance automatically when any asset deviates from target by this percentage
                    </p>
                    {errors.thresholdRebalancePercentage && (
                      <p className="text-sm text-destructive">{errors.thresholdRebalancePercentage}</p>
                    )}
                  </div>

                  {/* Automatic Monitoring Settings - Only for Threshold-based */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Automatic Monitoring</Label>
                      <p className="text-sm text-muted-foreground">
                        Configure how often the system checks for threshold deviations
                      </p>
                    </div>

                    {/* Scheduler Enabled */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Enable Automatic Monitoring</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically check for threshold deviations
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant={schedulerEnabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSchedulerEnabled(!schedulerEnabled)}
                      >
                        {schedulerEnabled ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>

                    {/* Check Frequency */}
                    {schedulerEnabled && (
                      <div className="space-y-2">
                        <Label htmlFor="checkFrequency">Check Frequency</Label>
                        <Select
                          value={checkFrequency}
                          onValueChange={setCheckFrequency}
                        >
                          <SelectTrigger id="checkFrequency">
                            <SelectValue placeholder="Select check frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="every_30_minutes">Every 30 Minutes</SelectItem>
                            <SelectItem value="hourly">Every Hour</SelectItem>
                            <SelectItem value="every_2_hours">Every 2 Hours</SelectItem>
                            <SelectItem value="every_4_hours">Every 4 Hours</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          💡 More frequent checks provide faster response to market changes but use more resources. 30-minute checks provide a good balance between responsiveness and resource usage.
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Current: {checkFrequency} | Scheduler: {schedulerEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    )}

                    {schedulerEnabled && (
                      <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/20">
                        <div className="flex items-start gap-2">
                          <div className="text-green-600 dark:text-green-400 mt-0.5">✅</div>
                          <div className="text-sm text-green-900 dark:text-green-100">
                            <strong>Automatic Monitoring:</strong> The system will automatically check your portfolio {checkFrequency.replace('_', ' ')} and trigger rebalancing when deviation exceeds {thresholdRebalancePercentage}%.
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  <div className="rounded-lg border p-4 bg-blue-50 dark:bg-blue-950/20">
                    <div className="flex items-start gap-2">
                      <div className="text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</div>
                      <div className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Note:</strong> Threshold-based rebalancing triggers immediately when deviation exceeds {thresholdRebalancePercentage}%, regardless of time interval.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fee Optimization Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Optimization</CardTitle>
            <CardDescription>Choose between speed and cost efficiency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="orderType">Order Type</Label>
              <Select
                value={orderType}
                onValueChange={setOrderType}
              >
                <SelectTrigger id="orderType">
                  <SelectValue placeholder="Select order type" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {orderType === 'market' 
                  ? '💡 Market orders execute immediately but have higher fees (Taker fees)' 
                  : '💡 Limit orders have lower fees (Maker fees) but may take longer to execute'}
              </p>
            </div>

            {/* Fee Information */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="text-sm font-semibold mb-2">Fee Structure</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Maker Fees (Limit Orders):</span>
                  <span className="font-medium text-green-600">~0.16%</span>
                </div>
                <div className="flex justify-between">
                  <span>Taker Fees (Market Orders):</span>
                  <span className="font-medium">~0.26%</span>
                </div>
                <p className="mt-2 text-xs">
                  Total trading fees: €{(currentDBPortfolio.totalFeesPaid || 0).toFixed(2)} paid so far
                </p>
              </div>
            </div>

            {/* Smart Routing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Smart Route Selection</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically find the cheapest trading path between assets
                  </p>
                </div>
                <Button
                  type="button"
                  variant={smartRoutingEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSmartRoutingEnabled(!smartRoutingEnabled)}
                >
                  {smartRoutingEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              {smartRoutingEnabled && (
                <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-start gap-2">
                    <div className="text-green-600 dark:text-green-400 mt-0.5">✓</div>
                    <div className="text-sm text-green-900 dark:text-green-100">
                      <strong>Smart Routing Active:</strong> System will evaluate multiple trading paths (e.g., BTC → EUR → ADA vs BTC → ETH → ADA) and choose the one with lowest total cost including fees and spreads.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t.portfolioForm.cancel}
          </Button>
          <Button type="submit" disabled={isLoading || !isValidWeight}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t.portfolioForm.updating}
              </>
            ) : (
              <>
                <CheckIcon className="mr-2 h-4 w-4" />
                {t.portfolioForm.updatePortfolio}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

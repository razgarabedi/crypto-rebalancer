export type Language = 'en' | 'de';

export interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    confirm: string;
    yes: string;
    no: string;
  };
  
  // Navigation
  navigation: {
    dashboard: string;
    portfolios: string;
    market: string;
    profile: string;
    logs: string;
    settings: string;
  };
  
  // Auth
  auth: {
    login: string;
    register: string;
    logout: string;
    email: string;
    password: string;
    name: string;
    confirmPassword: string;
    welcomeBack: string;
    createAccount: string;
    signIn: string;
    signUp: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
  };
  
  // Dashboard
  dashboard: {
    title: string;
    subtitle: string;
    totalValue: string;
    performance: string;
    allocation: string;
    refresh: string;
    createPortfolio: string;
    editPortfolio: string;
    myAssets: string;
    edit: string;
    delete: string;
    rebalanceNow: string;
    noPortfolioSelected: string;
    createPortfolioDescription: string;
    portfolioBalance: string;
    assets: string;
    cryptocurrencies: string;
    rebalanceStatus: string;
    needed: string;
    balanced: string;
    actionRequired: string;
    withinTarget: string;
    tradingFeesPaid: string;
    usingMakerOrders: string;
    usingTakerOrders: string;
    lastRebalanced: string;
    never: string;
    next: string;
    thresholdBased: string;
    manualOnly: string;
    rebalancingStrategy: string;
    both: string;
    timeBased: string;
    threshold: string;
    manual: string;
    deviation: string;
    orderType: string;
    limitMaker: string;
    marketTaker: string;
    lowerFees: string;
    higherFees: string;
    currentAllocation: string;
    currentAllocationDescription: string;
    targetAllocation: string;
    targetAllocationDescription: string;
    currentVsTarget: string;
    currentVsTargetDescription: string;
    portfolioPerformance: string;
    portfolioPerformanceDescription: string;
    holdingsAndTarget: string;
    holdingsAndTargetDescription: string;
    asset: string;
    balance: string;
    price: string;
    value: string;
    currentPercent: string;
    targetPercent: string;
    difference: string;
    status: string;
    rebalance: string;
    watch: string;
    ok: string;
    confirmRebalancing: string;
    confirmRebalancingDescription: string;
    portfolio: string;
    currentValue: string;
    ordersNeeded: string;
    cancel: string;
    continueRebalancing: string;
    deletePortfolio: string;
    deletePortfolioDescription: string;
    deletingPortfolio: string;
    portfolioDeleted: string;
    failedToDeletePortfolio: string;
  };
  
  // My Assets
  myAssets: {
    title: string;
    subtitle: string;
    backToDashboard: string;
    refresh: string;
    portfolioSummary: string;
    portfolioSummaryDescription: string;
    totalPortfolioValue: string;
    assets: string;
    krakenCredentialsRequired: string;
    credentialsDescription: string;
    addApiCredentials: string;
    howToGetApiKeys: string;
    assetHoldings: string;
    assetHoldingsDescription: string;
    apiCredentialsRequired: string;
    addCredentialsDescription: string;
    goToProfile: string;
    noAssetsFound: string;
    noAssetsDescription: string;
    baseCurrency: string;
    priceNotAvailable: string;
    priceNotAvailableKraken: string;
    perAsset: string;
  };
  
  // Portfolio Forms (Add/Edit)
  portfolioForm: {
    createNewPortfolio: string;
    editPortfolio: string;
    createDescription: string;
    editDescription: string;
    backToDashboard: string;
    basicInformation: string;
    basicInformationDescription: string;
    portfolioName: string;
    portfolioNamePlaceholder: string;
    assetAllocation: string;
    assetAllocationDescription: string;
    defineTargetWeights: string;
    distributeEvenly: string;
    normalizeTo100: string;
    noAssetsAdded: string;
    addFirstAsset: string;
    assetSymbol: string;
    assetSymbolPlaceholder: string;
    weightPercent: string;
    addAsset: string;
    totalWeight: string;
    valid: string;
    mustBe100: string;
    rebalancingSettings: string;
    rebalancingSettingsDescription: string;
    timeBasedRebalancing: string;
    timeBasedDescription: string;
    enabled: string;
    disabled: string;
    rebalanceInterval: string;
    selectInterval: string;
    maxOrdersPerRebalance: string;
    maxOrdersDescription: string;
    tradeSettings: string;
    minimumTradeAmount: string;
    minimumTradeDescription: string;
    or: string;
    thresholdBasedRebalancing: string;
    thresholdBasedDescription: string;
    deviationThreshold: string;
    thresholdDescription: string;
    thresholdNote: string;
    feeOptimization: string;
    feeOptimizationDescription: string;
    orderType: string;
    selectOrderType: string;
    marketOrders: string;
    marketOrdersDescription: string;
    limitOrders: string;
    limitOrdersDescription: string;
    marketOrdersTip: string;
    limitOrdersTip: string;
    feeStructure: string;
    makerFees: string;
    takerFees: string;
    totalTradingFees: string;
    smartRouteSelection: string;
    smartRouteDescription: string;
    smartRouteActive: string;
    smartRouteNote: string;
    cancel: string;
    createPortfolio: string;
    updatePortfolio: string;
    creating: string;
    updating: string;
    loadingPortfolio: string;
    portfolioNotFound: string;
    portfolioNotFoundDescription: string;
    validationErrors: string;
    portfolioNameRequired: string;
    atLeastOneAsset: string;
    allAssetsMustHaveSymbol: string;
    duplicateAssetSymbols: string;
    allWeightsMustBeGreaterThan0: string;
    totalWeightMustBe100: string;
    rebalanceThresholdMustBeGreaterThan0: string;
    maxOrdersMustBeGreaterThan0: string;
    thresholdPercentageMustBeGreaterThan0: string;
    totalAllocation: string;
    symbol: string;
    weight: string;
    removeAsset: string;
    error: string;
  };
  
  // Profile
  profile: {
    title: string;
    backToDashboard: string;
    profileInformation: string;
    updateNameAndEmail: string;
    name: string;
    email: string;
    yourName: string;
    yourEmail: string;
    updateProfile: string;
    updating: string;
    changePassword: string;
    updatePasswordSecure: string;
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
    enterCurrentPassword: string;
    enterNewPassword: string;
    confirmNewPasswordPlaceholder: string;
    changePasswordButton: string;
    changingPassword: string;
    krakenCredentials: string;
    configureKrakenCredentials: string;
    credentialsConfigured: string;
    credentialsConfiguredDescription: string;
    addedOn: string;
    testConnection: string;
    testing: string;
    removeCredentials: string;
    removing: string;
    updateCredentialsNote: string;
    noCredentialsConfigured: string;
    noCredentialsDescription: string;
    krakenApiKey: string;
    krakenApiSecret: string;
    enterKrakenApiKey: string;
    enterKrakenApiSecret: string;
    howToGetCredentials: string;
    howToGetCredentialsSteps: string[];
    saveAndTestCredentials: string;
    saving: string;
    saveWithoutTesting: string;
    accountDetails: string;
    accountInformationAndStats: string;
    userID: string;
    accountCreated: string;
    lastUpdated: string;
    status: string;
    active: string;
    portfolios: string;
    activeSessions: string;
    memberSince: string;
    selectLanguage: string;
    selectLanguageDescription: string;
    selectLanguageDescriptionDe: string;
  };
  
  // Rebalance Logs
  logs: {
    title: string;
    subtitle: string;
    backToDashboard: string;
    exportCSV: string;
    filters: string;
    selectPortfolio: string;
    allPortfolios: string;
    rebalanceHistory: string;
    showingLogs: string;
    loadingLogs: string;
    noLogsFound: string;
    dateTime: string;
    portfolio: string;
    status: string;
    value: string;
    orders: string;
    traded: string;
    fees: string;
    triggered: string;
    details: string;
    success: string;
    failed: string;
    dryRun: string;
    live: string;
    show: string;
    hide: string;
    orderDetails: string;
    buy: string;
    sell: string;
    fee: string;
    txid: string;
    executed: string;
    pending: string;
    errors: string;
    executionTime: string;
    page: string;
    of: string;
    previous: string;
    next: string;
    noLogsToExport: string;
    logsExportedSuccessfully: string;
    failedToFetchLogs: string;
  };
  analytics: {
    title: string;
    subtitle: string;
    backToDashboard: string;
    refresh: string;
    update: string;
    portfolio: string;
    processing: string;
    fetchingData: string;
    tabs: {
      dashboard: string;
      innovationInsights: string;
      performanceAnalytics: string;
      aiInsights: string;
    };
    dashboard: {
      allocationCurrentVsTarget: string;
      allocationCurrentVsTargetDesc: string;
      portfolioValuePL: string;
      portfolioValuePLDesc: string;
      biggestDrift: string;
      biggestDriftDesc: string;
      portfolioValue: string;
      portfolioValueDesc: string;
      topHolding: string;
      diversification: string;
      diversificationDesc: string;
      healthy: string;
      okay: string;
      low: string;
      higherIsBetter: string;
      allocationDrift: string;
      allocationDriftDesc: string;
      actionableNudges: string;
      actionableNudgesDesc: string;
      allocationSnapshot: string;
      allocationSnapshotDesc: string;
      severity: {
        critical: string;
        warn: string;
        info: string;
      };
    };
    innovationInsights: {
      loadingTitle: string;
      loadingDesc: string;
      initializing: string;
      loadingNote: string;
      promptTitle: string;
      promptDesc: string;
      loadButton: string;
      loadNote: string;
      errorTitle: string;
      tryAgain: string;
      panelTitle: string;
      panelDesc: string;
      forwardLookingTitle: string;
      trendSignalsTitle: string;
      bullish: string;
      bearish: string;
      neutral: string;
    };
    performanceAnalytics: {
      loadingTitle: string;
      loadingDesc: string;
      initializing: string;
      loadingNote: string;
      promptTitle: string;
      promptDesc: string;
      loadButton: string;
      loadNote: string;
      errorTitle: string;
      tryAgain: string;
      topMoversTitle: string;
      topMoversDesc: string;
      days7: string;
      days30: string;
      days90: string;
      bestPerformers: string;
      worstPerformers: string;
      volatilityAnalysisTitle: string;
      volatilityAnalysisDesc: string;
      portfolioVolatility: string;
      highRisk: string;
      moderateRisk: string;
      lowRisk: string;
      portfolio: string;
      individualAssets: string;
      correlationHeatmapTitle: string;
      correlationHeatmapDesc: string;
      positive: string;
      negative: string;
      noCorrelation: string;
    };
    aiInsights: {
      title: string;
      description: string;
      noInsightsAvailable: string;
      suggestedAction: string;
      priority: {
        high: string;
        medium: string;
        low: string;
      };
    };
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
    },
    navigation: {
      dashboard: 'Dashboard',
      portfolios: 'Portfolios',
      market: 'Market',
      profile: 'Profile',
      logs: 'Logs',
      settings: 'Settings',
    },
    auth: {
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      confirmPassword: 'Confirm Password',
      welcomeBack: 'Welcome Back',
      createAccount: 'Create an Account',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
    },
    dashboard: {
      title: 'Portfolio Dashboard',
      subtitle: 'Crypto Portfolio Rebalancing & Monitoring',
      totalValue: 'Total Value',
      performance: 'Performance',
      allocation: 'Allocation',
      rebalance: 'Rebalance',
      refresh: 'Refresh',
      createPortfolio: 'Create Portfolio',
      editPortfolio: 'Edit Portfolio',
      deletePortfolio: 'Delete Portfolio',
      myAssets: 'My Assets',
      edit: 'Edit',
      delete: 'Delete',
      rebalanceNow: 'Rebalance Now',
      noPortfolioSelected: 'No Portfolio Selected',
      createPortfolioDescription: 'Create a portfolio to start tracking your crypto holdings',
      portfolioBalance: 'Portfolio balance',
      assets: 'Assets',
      cryptocurrencies: 'Cryptocurrencies',
      rebalanceStatus: 'Rebalance Status',
      needed: 'Needed',
      balanced: 'Balanced',
      actionRequired: 'Action required',
      withinTarget: 'Within target',
      tradingFeesPaid: 'Trading Fees Paid',
      usingMakerOrders: 'Using Maker orders',
      usingTakerOrders: 'Using Taker orders',
      lastRebalanced: 'Last Rebalanced',
      never: 'Never',
      next: 'Next',
      thresholdBased: 'Threshold-based',
      manualOnly: 'Manual only',
      rebalancingStrategy: 'Rebalancing Strategy',
      both: 'Both',
      timeBased: 'Time-Based',
      threshold: 'Threshold',
      manual: 'Manual',
      deviation: 'deviation',
      orderType: 'Order Type',
      limitMaker: 'Limit (Maker)',
      marketTaker: 'Market (Taker)',
      lowerFees: 'Lower fees (~0.16%), slower execution',
      higherFees: 'Higher fees (~0.26%), instant execution',
      currentAllocation: 'Current Allocation',
      currentAllocationDescription: 'Current portfolio distribution',
      targetAllocation: 'Target Allocation',
      targetAllocationDescription: 'Desired portfolio distribution',
      currentVsTarget: 'Current vs Target Comparison',
      currentVsTargetDescription: 'Side-by-side allocation comparison',
      portfolioPerformance: 'Portfolio Performance (30 Days)',
      portfolioPerformanceDescription: 'Historical value trend',
      holdingsAndTarget: 'Holdings & Target Comparison',
      holdingsAndTargetDescription: 'Detailed breakdown of current holdings vs target allocation',
      asset: 'Asset',
      balance: 'Balance',
      price: 'Price (EUR)',
      value: 'Value (EUR)',
      currentPercent: 'Current %',
      targetPercent: 'Target %',
      difference: 'Difference',
      status: 'Status',
      watch: 'Watch',
      ok: 'OK',
      confirmRebalancing: 'Confirm Rebalancing',
      confirmRebalancingDescription: 'Are you sure you want to rebalance this portfolio? This will execute trades on Kraken to adjust your holdings to match the target allocation.',
      portfolio: 'Portfolio',
      currentValue: 'Current Value',
      ordersNeeded: 'Orders Needed',
      cancel: 'Cancel',
      continueRebalancing: 'Continue Rebalancing',
      deletePortfolioDescription: 'This action cannot be undone. This will permanently delete the portfolio and remove its data from the database.',
      deletingPortfolio: 'Deleting portfolio...',
      portfolioDeleted: 'Portfolio deleted',
      failedToDeletePortfolio: 'Failed to delete portfolio',
    },
    myAssets: {
      title: 'My Assets',
      subtitle: 'Your current wallet holdings',
      backToDashboard: 'Back to Dashboard',
      refresh: 'Refresh',
      portfolioSummary: 'Portfolio Summary',
      portfolioSummaryDescription: 'Total value of your holdings',
      totalPortfolioValue: 'Total Portfolio Value',
      assets: 'Assets',
      krakenCredentialsRequired: 'Crypto Asset API Credentials Required',
      credentialsDescription: 'To view your assets, you need to add your crypto asset API credentials. This allows the app to securely fetch your account balance and holdings.',
      addApiCredentials: 'Add API Credentials',
      howToGetApiKeys: 'How to Get API Keys',
      assetHoldings: 'Asset Holdings',
      assetHoldingsDescription: 'Your current asset allocations',
      apiCredentialsRequired: 'API Credentials Required',
      addCredentialsDescription: 'Add your Kraken API credentials to view your assets',
      goToProfile: 'Go to Profile',
      noAssetsFound: 'No Assets Found',
      noAssetsDescription: 'No assets found in your wallet. Your balance may be empty.',
      baseCurrency: 'Base currency (€1.00)',
      priceNotAvailable: 'Price not available',
      priceNotAvailableKraken: 'Price not available on Kraken',
      perAsset: 'per',
    },
    portfolioForm: {
      createNewPortfolio: 'Create New Portfolio',
      editPortfolio: 'Edit Portfolio',
      createDescription: 'Define your portfolio strategy and target asset allocation',
      editDescription: 'Modify your portfolio strategy and target allocation',
      backToDashboard: 'Back to Dashboard',
      basicInformation: 'Basic Information',
      basicInformationDescription: 'General portfolio settings',
      portfolioName: 'Portfolio Name',
      portfolioNamePlaceholder: 'e.g., Conservative Portfolio, Aggressive Strategy',
      assetAllocation: 'Asset Allocation',
      assetAllocationDescription: 'Define your target weights for each cryptocurrency',
      defineTargetWeights: 'Define your target allocation across different assets',
      distributeEvenly: 'Distribute Evenly',
      normalizeTo100: 'Normalize to 100%',
      noAssetsAdded: 'No assets added yet. Click "Add Your First Asset" to get started.',
      addFirstAsset: 'Add Your First Asset',
      assetSymbol: 'Asset Symbol',
      assetSymbolPlaceholder: 'BTC, ETH, SOL...',
      weightPercent: 'Weight %',
      addAsset: 'Add Asset',
      totalWeight: 'Total Weight:',
      valid: '✓ Valid',
      mustBe100: '✗ Must be 100%',
      rebalancingSettings: 'Rebalancing Settings',
      rebalancingSettingsDescription: 'Configure automatic rebalancing behavior',
      timeBasedRebalancing: 'Time-Based Rebalancing',
      timeBasedDescription: 'Automatically rebalance portfolio at specified intervals',
      enabled: 'Enabled',
      disabled: 'Disabled',
      rebalanceInterval: 'Rebalance Interval',
      selectInterval: 'Select interval',
      maxOrdersPerRebalance: 'Max Orders Per Rebalance',
      maxOrdersDescription: 'Maximum number of trades to execute in a single rebalancing session',
      tradeSettings: 'Trade Settings (Both Strategies)',
      minimumTradeAmount: 'Minimum Trade Amount (EUR)',
      minimumTradeDescription: 'Only execute trades larger than this amount. Recommended: €1-2 for small portfolios, €5-10 for larger ones.',
      or: 'or',
      thresholdBasedRebalancing: 'Threshold-Based Rebalancing',
      thresholdBasedDescription: 'Trigger rebalancing when any asset deviates by specified percentage',
      deviationThreshold: 'Deviation Threshold (%)',
      thresholdDescription: 'Rebalance automatically when any asset deviates from target by this percentage (e.g., 5% means rebalance when BTC is at 35% instead of target 40%)',
      thresholdNote: 'Note: Threshold-based rebalancing is checked continuously and will trigger immediately when deviation exceeds {percentage}%, regardless of time interval.',
      feeOptimization: 'Fee Optimization',
      feeOptimizationDescription: 'Choose between speed and cost efficiency',
      orderType: 'Order Type',
      selectOrderType: 'Select order type',
      marketOrders: 'Market Orders (Taker)',
      marketOrdersDescription: 'Immediate execution, higher fees (~0.26%)',
      limitOrders: 'Limit Orders (Maker)',
      limitOrdersDescription: 'Lower fees (~0.16%), but slower execution',
      marketOrdersTip: '💡 Market orders execute immediately but have higher fees (Taker fees)',
      limitOrdersTip: '💡 Limit orders have lower fees (Maker fees) but may take longer to execute',
      feeStructure: 'Fee Structure',
      makerFees: 'Maker Fees (Limit Orders):',
      takerFees: 'Taker Fees (Market Orders):',
      totalTradingFees: 'Total trading fees paid for this portfolio will be tracked and displayed on the dashboard.',
      smartRouteSelection: 'Smart Route Selection',
      smartRouteDescription: 'Automatically find the cheapest trading path between assets',
      smartRouteActive: 'Smart Routing Active:',
      smartRouteNote: 'System will evaluate multiple trading paths (e.g., BTC → EUR → ADA vs BTC → ETH → ADA) and choose the one with lowest total cost including fees and spreads.',
      cancel: 'Cancel',
      createPortfolio: 'Create Portfolio',
      updatePortfolio: 'Update Portfolio',
      creating: 'Creating...',
      updating: 'Updating...',
      loadingPortfolio: 'Loading portfolio...',
      portfolioNotFound: 'Portfolio Not Found',
      portfolioNotFoundDescription: "The portfolio you're looking for doesn't exist.",
      validationErrors: 'Validation Errors',
      portfolioNameRequired: 'Portfolio name is required',
      atLeastOneAsset: 'At least one asset is required',
      allAssetsMustHaveSymbol: 'All assets must have a symbol',
      duplicateAssetSymbols: 'Duplicate asset symbols found',
      allWeightsMustBeGreaterThan0: 'All weights must be greater than 0',
      totalWeightMustBe100: 'Total weight must be 100% (currently {total}%)',
      rebalanceThresholdMustBeGreaterThan0: 'Rebalance threshold must be greater than 0',
      maxOrdersMustBeGreaterThan0: 'Max orders must be greater than 0',
      thresholdPercentageMustBeGreaterThan0: 'Threshold percentage must be greater than 0',
      totalAllocation: 'Total Allocation',
      symbol: 'Symbol',
      weight: 'Weight (%)',
      removeAsset: 'Remove Asset',
      error: 'Error',
    },
    profile: {
      title: 'My Profile',
      backToDashboard: 'Back to Dashboard',
      profileInformation: 'Profile Information',
      updateNameAndEmail: 'Update your name and email address',
      name: 'Name',
      email: 'Email',
      yourName: 'Your name',
      yourEmail: 'your@email.com',
      updateProfile: 'Update Profile',
      updating: 'Updating...',
      changePassword: 'Change Password',
      updatePasswordSecure: 'Update your password to keep your account secure',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',
      enterCurrentPassword: 'Enter current password',
      enterNewPassword: 'Enter new password (min 6 characters)',
      confirmNewPasswordPlaceholder: 'Confirm new password',
      changePasswordButton: 'Change Password',
      changingPassword: 'Changing Password...',
      krakenCredentials: 'Crypto Asset API Credentials',
      configureKrakenCredentials: 'Configure your crypto asset API credentials to enable portfolio tracking and automated rebalancing',
      credentialsConfigured: 'Credentials Configured',
      credentialsConfiguredDescription: 'Your crypto asset API credentials are saved and encrypted. Added on',
      addedOn: 'Added on',
      testConnection: 'Test Connection',
      testing: 'Testing...',
      removeCredentials: 'Remove Credentials',
      removing: 'Removing...',
      updateCredentialsNote: 'Note: To update your credentials, remove the existing ones and add new credentials below.',
      noCredentialsConfigured: 'No Credentials Configured',
      noCredentialsDescription: 'Add your crypto asset API credentials to enable portfolio tracking and automated rebalancing. Your credentials will be encrypted and stored securely.',
      krakenApiKey: 'Crypto Asset API Key',
      krakenApiSecret: 'Crypto Asset API Secret',
      enterKrakenApiKey: 'Enter your crypto asset API key',
      enterKrakenApiSecret: 'Enter your crypto asset API secret',
      howToGetCredentials: 'How to get your crypto asset API credentials:',
      howToGetCredentialsSteps: [
        'Log in to your crypto exchange account',
        'Go to Settings → API',
        'Click "Generate New Key"',
        'Enable permissions: Query Funds, Query Open Orders & Trades, Create & Modify Orders',
        'Copy your API Key and Private Key'
      ],
      saveAndTestCredentials: 'Save & Test Credentials',
      saving: 'Saving...',
      saveWithoutTesting: 'Save Without Testing',
      accountDetails: 'Account Details',
      accountInformationAndStats: 'Your account information and statistics',
      userID: 'User ID',
      accountCreated: 'Account Created',
      lastUpdated: 'Last Updated',
      status: 'Status',
      active: 'Active',
      portfolios: 'Portfolios',
      activeSessions: 'Active Sessions',
      memberSince: 'Member Since',
      selectLanguage: 'Language',
      selectLanguageDescription: 'Select your preferred language for the interface',
      selectLanguageDescriptionDe: 'Wählen Sie Ihre bevorzugte Sprache für die Benutzeroberfläche',
    },
    logs: {
      title: 'Rebalance Logs',
      subtitle: 'View all rebalancing history and transaction details',
      backToDashboard: 'Back',
      exportCSV: 'Export CSV',
      filters: 'Filters',
      selectPortfolio: 'Select portfolio',
      allPortfolios: 'All Portfolios',
      rebalanceHistory: 'Rebalance History',
      showingLogs: 'Showing {count} of {total} total logs',
      loadingLogs: 'Loading logs...',
      noLogsFound: 'No rebalance logs found',
      dateTime: 'Date & Time',
      portfolio: 'Portfolio',
      status: 'Status',
      value: 'Value',
      orders: 'Orders',
      traded: 'Traded',
      fees: 'Fees',
      triggered: 'Triggered',
      details: 'Details',
      success: 'Success',
      failed: 'Failed',
      dryRun: 'Dry Run',
      live: 'Live',
      show: 'Show',
      hide: 'Hide',
      orderDetails: 'Order Details',
      buy: 'BUY',
      sell: 'SELL',
      fee: 'Fee',
      txid: 'TXID',
      executed: 'Executed',
      pending: 'Pending',
      errors: 'Errors',
      executionTime: 'Execution time',
      page: 'Page',
      of: 'of',
      previous: 'Previous',
      next: 'Next',
      noLogsToExport: 'No logs to export',
      logsExportedSuccessfully: 'Logs exported successfully',
      failedToFetchLogs: 'Failed to fetch rebalance logs',
    },
    analytics: {
      title: 'Smart Analytics',
      subtitle: 'Not just numbers — a narrative and nudges.',
      backToDashboard: 'Back to Dashboard',
      refresh: 'Refresh',
      update: 'Update',
      portfolio: 'Portfolio',
      processing: 'Processing...',
      fetchingData: 'Fetching portfolio data, balances, and prices...',
      tabs: {
        dashboard: 'Dashboard',
        innovationInsights: 'Innovation',
        performanceAnalytics: 'Performance',
        aiInsights: 'AI Insights',
      },
      dashboard: {
        allocationCurrentVsTarget: 'Allocation: Current vs Target',
        allocationCurrentVsTargetDesc: 'Visual drift from targets',
        portfolioValuePL: 'Portfolio Value & P/L',
        portfolioValuePLDesc: 'Change over time',
        biggestDrift: 'Biggest Drift',
        biggestDriftDesc: 'Assets farthest from target',
        portfolioValue: 'Portfolio Value',
        portfolioValueDesc: 'Total current value (EUR)',
        topHolding: 'Top holding',
        diversification: 'Diversification',
        diversificationDesc: 'Mix of assets across the portfolio',
        healthy: 'Healthy',
        okay: 'Okay',
        low: 'Low',
        higherIsBetter: 'Higher is better (0–100)',
        allocationDrift: 'Allocation Drift',
        allocationDriftDesc: 'Deviation from targets',
        actionableNudges: 'Actionable Nudges',
        actionableNudgesDesc: 'Suggestions to improve risk/return',
        allocationSnapshot: 'Allocation Snapshot',
        allocationSnapshotDesc: 'Current vs target (top assets)',
        severity: {
          critical: 'critical',
          warn: 'warn',
          info: 'info',
        },
      },
      innovationInsights: {
        loadingTitle: 'Loading Innovation Insights',
        loadingDesc: 'Fetching trend signals and developer activity data from CoinGecko API (rate-limited to prevent overload)',
        initializing: 'Initializing...',
        loadingNote: 'This process may take a minute due to CoinGecko rate limits. Data is fetched sequentially to ensure reliability.',
        promptTitle: 'Innovation Insights',
        promptDesc: 'Click below to load innovation insights data from CoinGecko',
        loadButton: 'Load Innovation Insights',
        loadNote: 'This will fetch trend signals, developer activity, and social metrics for your portfolio assets',
        errorTitle: 'Error loading innovation insights',
        tryAgain: 'Try Again',
        panelTitle: 'Innovation Insights Panel',
        panelDesc: 'Trend signals, developer activity, and social metrics for your portfolio assets',
        forwardLookingTitle: 'Forward-Looking Insights',
        trendSignalsTitle: 'Trend Signals',
        bullish: 'bullish',
        bearish: 'bearish',
        neutral: 'neutral',
      },
      performanceAnalytics: {
        loadingTitle: 'Loading Performance Analytics',
        loadingDesc: 'Fetching data from CoinGecko API (rate-limited to prevent overload)',
        initializing: 'Initializing...',
        loadingNote: 'This process may take a minute due to CoinGecko rate limits. Data is fetched sequentially to ensure reliability.',
        promptTitle: 'Performance Analytics',
        promptDesc: 'Click below to load performance analytics data from CoinGecko',
        loadButton: 'Load Performance Analytics',
        loadNote: 'This will fetch historical data for your portfolio assets',
        errorTitle: 'Error loading performance analytics',
        tryAgain: 'Try Again',
        topMoversTitle: 'Top Movers',
        topMoversDesc: 'Best and worst performers over 7/30/90 days',
        days7: '7 Days',
        days30: '30 Days',
        days90: '90 Days',
        bestPerformers: 'Best Performers',
        worstPerformers: 'Worst Performers',
        volatilityAnalysisTitle: 'Volatility Analysis',
        volatilityAnalysisDesc: 'Risk assessment by coin and overall portfolio',
        portfolioVolatility: 'Portfolio Volatility',
        highRisk: 'High Risk',
        moderateRisk: 'Moderate Risk',
        lowRisk: 'Low Risk',
        portfolio: 'Portfolio',
        individualAssets: 'Individual Assets',
        correlationHeatmapTitle: 'Correlation Heatmap',
        correlationHeatmapDesc: 'How assets move together (helps spot overexposure)',
        positive: 'Positive',
        negative: 'Negative',
        noCorrelation: 'No Correlation (1.00)',
      },
      aiInsights: {
        title: 'AI-Powered Insights',
        description: 'Natural-language recommendations based on your portfolio performance and allocation targets',
        noInsightsAvailable: 'No AI insights available yet. Insights will appear here once your portfolio data is loaded.',
        suggestedAction: '💡 Suggested Action:',
        priority: {
          high: 'HIGH',
          medium: 'MEDIUM',
          low: 'LOW',
        },
      },
    },
  },
  de: {
    common: {
      loading: 'Lädt...',
      error: 'Fehler',
      success: 'Erfolg',
      cancel: 'Abbrechen',
      save: 'Speichern',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      back: 'Zurück',
      next: 'Weiter',
      previous: 'Zurück',
      close: 'Schließen',
      confirm: 'Bestätigen',
      yes: 'Ja',
      no: 'Nein',
    },
    navigation: {
      dashboard: 'Dashboard',
      portfolios: 'Portfolios',
      market: 'Markt',
      profile: 'Profil',
      logs: 'Protokolle',
      settings: 'Einstellungen',
    },
    auth: {
      login: 'Anmelden',
      register: 'Registrieren',
      logout: 'Abmelden',
      email: 'E-Mail',
      password: 'Passwort',
      name: 'Name',
      confirmPassword: 'Passwort bestätigen',
      welcomeBack: 'Willkommen zurück',
      createAccount: 'Konto erstellen',
      signIn: 'Anmelden',
      signUp: 'Registrieren',
      alreadyHaveAccount: 'Haben Sie bereits ein Konto?',
      dontHaveAccount: 'Haben Sie noch kein Konto?',
    },
    dashboard: {
      title: 'Portfolio Dashboard',
      subtitle: 'Krypto-Portfolio Rebalancing & Überwachung',
      totalValue: 'Gesamtwert',
      performance: 'Leistung',
      allocation: 'Allokation',
      rebalance: 'Rebalancing',
      refresh: 'Aktualisieren',
      createPortfolio: 'Portfolio erstellen',
      editPortfolio: 'Portfolio bearbeiten',
      deletePortfolio: 'Portfolio löschen',
      myAssets: 'Meine Assets',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      rebalanceNow: 'Jetzt rebalancieren',
      noPortfolioSelected: 'Kein Portfolio ausgewählt',
      createPortfolioDescription: 'Erstellen Sie ein Portfolio, um Ihre Krypto-Holdings zu verfolgen',
      portfolioBalance: 'Portfolio-Guthaben',
      assets: 'Assets',
      cryptocurrencies: 'Kryptowährungen',
      rebalanceStatus: 'Rebalancing-Status',
      needed: 'Erforderlich',
      balanced: 'Ausbalanciert',
      actionRequired: 'Aktion erforderlich',
      withinTarget: 'Im Zielbereich',
      tradingFeesPaid: 'Gezahlte Handelsgebühren',
      usingMakerOrders: 'Maker-Orders verwenden',
      usingTakerOrders: 'Taker-Orders verwenden',
      lastRebalanced: 'Zuletzt rebalanciert',
      never: 'Nie',
      next: 'Nächste',
      thresholdBased: 'Schwellenwert-basiert',
      manualOnly: 'Nur manuell',
      rebalancingStrategy: 'Rebalancing-Strategie',
      both: 'Beide',
      timeBased: 'Zeitbasiert',
      threshold: 'Schwellenwert',
      manual: 'Manuell',
      deviation: 'Abweichung',
      orderType: 'Order-Typ',
      limitMaker: 'Limit (Maker)',
      marketTaker: 'Market (Taker)',
      lowerFees: 'Niedrigere Gebühren (~0,16%), langsamere Ausführung',
      higherFees: 'Höhere Gebühren (~0,26%), sofortige Ausführung',
      currentAllocation: 'Aktuelle Allokation',
      currentAllocationDescription: 'Aktuelle Portfolio-Verteilung',
      targetAllocation: 'Ziel-Allokation',
      targetAllocationDescription: 'Gewünschte Portfolio-Verteilung',
      currentVsTarget: 'Aktuell vs Ziel Vergleich',
      currentVsTargetDescription: 'Gegenüberstellung der Allokation',
      portfolioPerformance: 'Portfolio-Performance (30 Tage)',
      portfolioPerformanceDescription: 'Historischer Wertverlauf',
      holdingsAndTarget: 'Holdings & Ziel-Vergleich',
      holdingsAndTargetDescription: 'Detaillierte Aufschlüsselung der aktuellen Holdings vs Ziel-Allokation',
      asset: 'Asset',
      balance: 'Guthaben',
      price: 'Preis (EUR)',
      value: 'Wert (EUR)',
      currentPercent: 'Aktuell %',
      targetPercent: 'Ziel %',
      difference: 'Differenz',
      status: 'Status',
      watch: 'Beobachten',
      ok: 'OK',
      confirmRebalancing: 'Rebalancing bestätigen',
      confirmRebalancingDescription: 'Sind Sie sicher, dass Sie dieses Portfolio rebalancieren möchten? Dies wird Trades auf Kraken ausführen, um Ihre Holdings an die Ziel-Allokation anzupassen.',
      portfolio: 'Portfolio',
      currentValue: 'Aktueller Wert',
      ordersNeeded: 'Benötigte Orders',
      cancel: 'Abbrechen',
      continueRebalancing: 'Rebalancing fortsetzen',
      deletePortfolioDescription: 'Diese Aktion kann nicht rückgängig gemacht werden. Dies wird das Portfolio dauerhaft löschen und seine Daten aus der Datenbank entfernen.',
      deletingPortfolio: 'Portfolio wird gelöscht...',
      portfolioDeleted: 'Portfolio gelöscht',
      failedToDeletePortfolio: 'Portfolio konnte nicht gelöscht werden',
    },
    myAssets: {
      title: 'Meine Assets',
      subtitle: 'Ihre aktuellen Wallet-Holdings',
      backToDashboard: 'Zurück zum Dashboard',
      refresh: 'Aktualisieren',
      portfolioSummary: 'Portfolio-Zusammenfassung',
      portfolioSummaryDescription: 'Gesamtwert Ihrer Holdings',
      totalPortfolioValue: 'Gesamter Portfolio-Wert',
      assets: 'Assets',
      krakenCredentialsRequired: 'Kraken API-Anmeldedaten erforderlich',
      credentialsDescription: 'Um Ihre Assets anzuzeigen, müssen Sie Ihre Kraken API-Anmeldedaten hinzufügen. Dies ermöglicht es der App, Ihr Kontoguthaben und Ihre Holdings sicher abzurufen.',
      addApiCredentials: 'API-Anmeldedaten hinzufügen',
      howToGetApiKeys: 'API-Schlüssel erhalten',
      assetHoldings: 'Asset-Holdings',
      assetHoldingsDescription: 'Ihre aktuellen Asset-Allokationen',
      apiCredentialsRequired: 'API-Anmeldedaten erforderlich',
      addCredentialsDescription: 'Fügen Sie Ihre Kraken API-Anmeldedaten hinzu, um Ihre Assets anzuzeigen',
      goToProfile: 'Zum Profil',
      noAssetsFound: 'Keine Assets gefunden',
      noAssetsDescription: 'Keine Assets in Ihrem Wallet gefunden. Ihr Guthaben könnte leer sein.',
      baseCurrency: 'Basiswährung (€1,00)',
      priceNotAvailable: 'Preis nicht verfügbar',
      priceNotAvailableKraken: 'Preis auf Kraken nicht verfügbar',
      perAsset: 'pro',
    },
    portfolioForm: {
      createNewPortfolio: 'Neues Portfolio erstellen',
      editPortfolio: 'Portfolio bearbeiten',
      createDescription: 'Definieren Sie Ihre Portfolio-Strategie und Ziel-Asset-Allokation',
      editDescription: 'Modifizieren Sie Ihre Portfolio-Strategie und Ziel-Allokation',
      backToDashboard: 'Zurück zum Dashboard',
      basicInformation: 'Grundinformationen',
      basicInformationDescription: 'Allgemeine Portfolio-Einstellungen',
      portfolioName: 'Portfolio-Name',
      portfolioNamePlaceholder: 'z.B. Konservatives Portfolio, Aggressive Strategie',
      assetAllocation: 'Asset-Allokation',
      assetAllocationDescription: 'Definieren Sie Ihre Zielgewichte für jede Kryptowährung',
      defineTargetWeights: 'Definieren Sie Ihre Ziel-Allokation über verschiedene Assets',
      distributeEvenly: 'Gleichmäßig verteilen',
      normalizeTo100: 'Auf 100% normalisieren',
      noAssetsAdded: 'Noch keine Assets hinzugefügt. Klicken Sie auf "Ihr erstes Asset hinzufügen", um zu beginnen.',
      addFirstAsset: 'Ihr erstes Asset hinzufügen',
      assetSymbol: 'Asset-Symbol',
      assetSymbolPlaceholder: 'BTC, ETH, SOL...',
      weightPercent: 'Gewicht %',
      addAsset: 'Asset hinzufügen',
      totalWeight: 'Gesamtgewicht:',
      valid: '✓ Gültig',
      mustBe100: '✗ Muss 100% sein',
      rebalancingSettings: 'Rebalancing-Einstellungen',
      rebalancingSettingsDescription: 'Automatisches Rebalancing-Verhalten konfigurieren',
      timeBasedRebalancing: 'Zeitbasiertes Rebalancing',
      timeBasedDescription: 'Portfolio automatisch in festgelegten Intervallen rebalancieren',
      enabled: 'Aktiviert',
      disabled: 'Deaktiviert',
      rebalanceInterval: 'Rebalancing-Intervall',
      selectInterval: 'Intervall auswählen',
      maxOrdersPerRebalance: 'Max. Orders pro Rebalancing',
      maxOrdersDescription: 'Maximale Anzahl von Trades, die in einer einzigen Rebalancing-Sitzung ausgeführt werden',
      tradeSettings: 'Trade-Einstellungen (Beide Strategien)',
      minimumTradeAmount: 'Mindest-Trade-Betrag (EUR)',
      minimumTradeDescription: 'Nur Trades größer als dieser Betrag ausführen. Empfohlen: €1-2 für kleine Portfolios, €5-10 für größere.',
      or: 'oder',
      thresholdBasedRebalancing: 'Schwellenwert-basiertes Rebalancing',
      thresholdBasedDescription: 'Rebalancing auslösen, wenn ein Asset um den angegebenen Prozentsatz abweicht',
      deviationThreshold: 'Abweichungsschwelle (%)',
      thresholdDescription: 'Automatisch rebalancieren, wenn ein Asset um diesen Prozentsatz vom Ziel abweicht (z.B. 5% bedeutet Rebalancing, wenn BTC bei 35% statt Ziel 40% steht)',
      thresholdNote: 'Hinweis: Schwellenwert-basiertes Rebalancing wird kontinuierlich überprüft und löst sofort aus, wenn die Abweichung {percentage}% überschreitet, unabhängig vom Zeitintervall.',
      feeOptimization: 'Gebühren-Optimierung',
      feeOptimizationDescription: 'Wählen Sie zwischen Geschwindigkeit und Kosteneffizienz',
      orderType: 'Order-Typ',
      selectOrderType: 'Order-Typ auswählen',
      marketOrders: 'Market-Orders (Taker)',
      marketOrdersDescription: 'Sofortige Ausführung, höhere Gebühren (~0,26%)',
      limitOrders: 'Limit-Orders (Maker)',
      limitOrdersDescription: 'Niedrigere Gebühren (~0,16%), aber langsamere Ausführung',
      marketOrdersTip: '💡 Market-Orders werden sofort ausgeführt, haben aber höhere Gebühren (Taker-Gebühren)',
      limitOrdersTip: '💡 Limit-Orders haben niedrigere Gebühren (Maker-Gebühren), können aber länger dauern',
      feeStructure: 'Gebührenstruktur',
      makerFees: 'Maker-Gebühren (Limit-Orders):',
      takerFees: 'Taker-Gebühren (Market-Orders):',
      totalTradingFees: 'Gesamte Handelsgebühren für dieses Portfolio werden verfolgt und im Dashboard angezeigt.',
      smartRouteSelection: 'Intelligente Routenauswahl',
      smartRouteDescription: 'Automatisch den günstigsten Handelsweg zwischen Assets finden',
      smartRouteActive: 'Intelligentes Routing aktiv:',
      smartRouteNote: 'Das System bewertet mehrere Handelswege (z.B. BTC → EUR → ADA vs BTC → ETH → ADA) und wählt den mit den niedrigsten Gesamtkosten inklusive Gebühren und Spreads.',
      cancel: 'Abbrechen',
      createPortfolio: 'Portfolio erstellen',
      updatePortfolio: 'Portfolio aktualisieren',
      creating: 'Erstelle...',
      updating: 'Aktualisiere...',
      loadingPortfolio: 'Portfolio wird geladen...',
      portfolioNotFound: 'Portfolio nicht gefunden',
      portfolioNotFoundDescription: 'Das gesuchte Portfolio existiert nicht.',
      validationErrors: 'Validierungsfehler',
      portfolioNameRequired: 'Portfolio-Name ist erforderlich',
      atLeastOneAsset: 'Mindestens ein Asset ist erforderlich',
      allAssetsMustHaveSymbol: 'Alle Assets müssen ein Symbol haben',
      duplicateAssetSymbols: 'Doppelte Asset-Symbole gefunden',
      allWeightsMustBeGreaterThan0: 'Alle Gewichte müssen größer als 0 sein',
      totalWeightMustBe100: 'Gesamtgewicht muss 100% betragen (aktuell {total}%)',
      rebalanceThresholdMustBeGreaterThan0: 'Rebalancing-Schwelle muss größer als 0 sein',
      maxOrdersMustBeGreaterThan0: 'Max. Orders muss größer als 0 sein',
      thresholdPercentageMustBeGreaterThan0: 'Schwellenwert-Prozentsatz muss größer als 0 sein',
      totalAllocation: 'Gesamt-Allokation',
      symbol: 'Symbol',
      weight: 'Gewicht (%)',
      removeAsset: 'Asset entfernen',
      error: 'Fehler',
    },
    profile: {
      title: 'Mein Profil',
      backToDashboard: 'Zurück zum Dashboard',
      profileInformation: 'Profilinformationen',
      updateNameAndEmail: 'Aktualisieren Sie Ihren Namen und Ihre E-Mail-Adresse',
      name: 'Name',
      email: 'E-Mail',
      yourName: 'Ihr Name',
      yourEmail: 'ihre@email.com',
      updateProfile: 'Profil aktualisieren',
      updating: 'Aktualisiere...',
      changePassword: 'Passwort ändern',
      updatePasswordSecure: 'Aktualisieren Sie Ihr Passwort, um Ihr Konto sicher zu halten',
      currentPassword: 'Aktuelles Passwort',
      newPassword: 'Neues Passwort',
      confirmNewPassword: 'Neues Passwort bestätigen',
      enterCurrentPassword: 'Aktuelles Passwort eingeben',
      enterNewPassword: 'Neues Passwort eingeben (min. 6 Zeichen)',
      confirmNewPasswordPlaceholder: 'Neues Passwort bestätigen',
      changePasswordButton: 'Passwort ändern',
      changingPassword: 'Passwort wird geändert...',
      krakenCredentials: 'Kraken API-Anmeldedaten',
      configureKrakenCredentials: 'Konfigurieren Sie Ihre Kraken API-Anmeldedaten, um Portfolio-Tracking und automatisches Rebalancing zu ermöglichen',
      credentialsConfigured: 'Anmeldedaten konfiguriert',
      credentialsConfiguredDescription: 'Ihre Kraken API-Anmeldedaten sind gespeichert und verschlüsselt. Hinzugefügt am',
      addedOn: 'Hinzugefügt am',
      testConnection: 'Verbindung testen',
      testing: 'Teste...',
      removeCredentials: 'Anmeldedaten entfernen',
      removing: 'Entferne...',
      updateCredentialsNote: 'Hinweis: Um Ihre Anmeldedaten zu aktualisieren, entfernen Sie die bestehenden und fügen Sie neue Anmeldedaten unten hinzu.',
      noCredentialsConfigured: 'Keine Anmeldedaten konfiguriert',
      noCredentialsDescription: 'Fügen Sie Ihre Kraken API-Anmeldedaten hinzu, um Portfolio-Tracking und automatisches Rebalancing zu ermöglichen. Ihre Anmeldedaten werden verschlüsselt und sicher gespeichert.',
      krakenApiKey: 'Kraken API-Schlüssel',
      krakenApiSecret: 'Kraken API-Geheimnis',
      enterKrakenApiKey: 'Ihren Kraken API-Schlüssel eingeben',
      enterKrakenApiSecret: 'Ihr Kraken API-Geheimnis eingeben',
      howToGetCredentials: 'So erhalten Sie Ihre Kraken API-Anmeldedaten:',
      howToGetCredentialsSteps: [
        'Melden Sie sich in Ihrem Kraken-Konto an',
        'Gehen Sie zu Einstellungen → API',
        'Klicken Sie auf "Neuen Schlüssel generieren"',
        'Aktivieren Sie Berechtigungen: Abfrage von Mitteln, Abfrage offener Orders & Trades, Erstellen & Ändern von Orders',
        'Kopieren Sie Ihren API-Schlüssel und privaten Schlüssel'
      ],
      saveAndTestCredentials: 'Speichern & Anmeldedaten testen',
      saving: 'Speichere...',
      saveWithoutTesting: 'Ohne Test speichern',
      accountDetails: 'Kontodetails',
      accountInformationAndStats: 'Ihre Kontoinformationen und Statistiken',
      userID: 'Benutzer-ID',
      accountCreated: 'Konto erstellt',
      lastUpdated: 'Zuletzt aktualisiert',
      status: 'Status',
      active: 'Aktiv',
      portfolios: 'Portfolios',
      activeSessions: 'Aktive Sitzungen',
      memberSince: 'Mitglied seit',
      selectLanguage: 'Sprache',
      selectLanguageDescription: 'Wählen Sie Ihre bevorzugte Sprache für die Benutzeroberfläche',
      selectLanguageDescriptionDe: 'Wählen Sie Ihre bevorzugte Sprache für die Benutzeroberfläche',
    },
    logs: {
      title: 'Rebalancing-Protokolle',
      subtitle: 'Alle Rebalancing-Verläufe und Transaktionsdetails anzeigen',
      backToDashboard: 'Zurück',
      exportCSV: 'CSV exportieren',
      filters: 'Filter',
      selectPortfolio: 'Portfolio auswählen',
      allPortfolios: 'Alle Portfolios',
      rebalanceHistory: 'Rebalancing-Verlauf',
      showingLogs: '{count} von {total} Protokollen angezeigt',
      loadingLogs: 'Protokolle werden geladen...',
      noLogsFound: 'Keine Rebalancing-Protokolle gefunden',
      dateTime: 'Datum & Zeit',
      portfolio: 'Portfolio',
      status: 'Status',
      value: 'Wert',
      orders: 'Orders',
      traded: 'Gehandelt',
      fees: 'Gebühren',
      triggered: 'Ausgelöst',
      details: 'Details',
      success: 'Erfolgreich',
      failed: 'Fehlgeschlagen',
      dryRun: 'Testlauf',
      live: 'Live',
      show: 'Anzeigen',
      hide: 'Ausblenden',
      orderDetails: 'Order-Details',
      buy: 'KAUFEN',
      sell: 'VERKAUFEN',
      fee: 'Gebühr',
      txid: 'TXID',
      executed: 'Ausgeführt',
      pending: 'Ausstehend',
      errors: 'Fehler',
      executionTime: 'Ausführungszeit',
      page: 'Seite',
      of: 'von',
      previous: 'Vorherige',
      next: 'Nächste',
      noLogsToExport: 'Keine Protokolle zum Exportieren',
      logsExportedSuccessfully: 'Protokolle erfolgreich exportiert',
      failedToFetchLogs: 'Fehler beim Laden der Rebalancing-Protokolle',
    },
    analytics: {
      title: 'Smart Analytics',
      subtitle: 'Nicht nur Zahlen — eine Erzählung und Anstöße.',
      backToDashboard: 'Zurück zum Dashboard',
      refresh: 'Aktualisieren',
      update: 'Aktualisieren',
      portfolio: 'Portfolio',
      processing: 'Verarbeitung...',
      fetchingData: 'Portfolio-Daten, Salden und Preise werden abgerufen...',
      tabs: {
        dashboard: 'Dashboard',
        innovationInsights: 'Innovation',
        performanceAnalytics: 'Performance',
        aiInsights: 'KI-Insights',
      },
      dashboard: {
        allocationCurrentVsTarget: 'Allokation: Aktuell vs Ziel',
        allocationCurrentVsTargetDesc: 'Visuelle Abweichung von Zielen',
        portfolioValuePL: 'Portfoliowert & Gewinn/Verlust',
        portfolioValuePLDesc: 'Änderung über Zeit',
        biggestDrift: 'Größte Abweichung',
        biggestDriftDesc: 'Assets am weitesten vom Ziel entfernt',
        portfolioValue: 'Portfoliowert',
        portfolioValueDesc: 'Gesamter aktueller Wert (EUR)',
        topHolding: 'Top-Holding',
        diversification: 'Diversifikation',
        diversificationDesc: 'Mischung von Assets im Portfolio',
        healthy: 'Gesund',
        okay: 'Okay',
        low: 'Niedrig',
        higherIsBetter: 'Höher ist besser (0–100)',
        allocationDrift: 'Allokationsabweichung',
        allocationDriftDesc: 'Abweichung von Zielen',
        actionableNudges: 'Umsetzbare Anstöße',
        actionableNudgesDesc: 'Vorschläge zur Verbesserung von Risiko/Rendite',
        allocationSnapshot: 'Allokations-Snapshot',
        allocationSnapshotDesc: 'Aktuell vs Ziel (Top-Assets)',
        severity: {
          critical: 'kritisch',
          warn: 'Warnung',
          info: 'Info',
        },
      },
      innovationInsights: {
        loadingTitle: 'Innovation Insights werden geladen',
        loadingDesc: 'Trendsignale und Entwickleraktivitätsdaten werden von der CoinGecko API abgerufen (ratenbeschränkt, um Überlastung zu vermeiden)',
        initializing: 'Initialisierung...',
        loadingNote: 'Dieser Vorgang kann aufgrund der CoinGecko-Ratenlimits eine Minute dauern. Die Daten werden sequenziell abgerufen, um Zuverlässigkeit zu gewährleisten.',
        promptTitle: 'Innovation Insights',
        promptDesc: 'Klicken Sie unten, um Innovation Insights-Daten von CoinGecko zu laden',
        loadButton: 'Innovation Insights laden',
        loadNote: 'Dies ruft Trendsignale, Entwickleraktivität und soziale Metriken für Ihre Portfolio-Assets ab',
        errorTitle: 'Fehler beim Laden der Innovation Insights',
        tryAgain: 'Erneut versuchen',
        panelTitle: 'Innovation Insights Panel',
        panelDesc: 'Trendsignale, Entwickleraktivität und soziale Metriken für Ihre Portfolio-Assets',
        forwardLookingTitle: 'Zukunftsorientierte Erkenntnisse',
        trendSignalsTitle: 'Trendsignale',
        bullish: 'bullish',
        bearish: 'bearish',
        neutral: 'neutral',
      },
      performanceAnalytics: {
        loadingTitle: 'Performance-Analysen werden geladen',
        loadingDesc: 'Daten werden von der CoinGecko API abgerufen (ratenbeschränkt, um Überlastung zu vermeiden)',
        initializing: 'Initialisierung...',
        loadingNote: 'Dieser Vorgang kann aufgrund der CoinGecko-Ratenlimits eine Minute dauern. Die Daten werden sequenziell abgerufen, um Zuverlässigkeit zu gewährleisten.',
        promptTitle: 'Performance-Analysen',
        promptDesc: 'Klicken Sie unten, um Performance-Analysedaten von CoinGecko zu laden',
        loadButton: 'Performance-Analysen laden',
        loadNote: 'Dies ruft historische Daten für Ihre Portfolio-Assets ab',
        errorTitle: 'Fehler beim Laden der Performance-Analysen',
        tryAgain: 'Erneut versuchen',
        topMoversTitle: 'Top-Beweger',
        topMoversDesc: 'Beste und schlechteste Performer über 7/30/90 Tage',
        days7: '7 Tage',
        days30: '30 Tage',
        days90: '90 Tage',
        bestPerformers: 'Beste Performer',
        worstPerformers: 'Schlechteste Performer',
        volatilityAnalysisTitle: 'Volatilitätsanalyse',
        volatilityAnalysisDesc: 'Risikobewertung nach Coin und Gesamtportfolio',
        portfolioVolatility: 'Portfolio-Volatilität',
        highRisk: 'Hohes Risiko',
        moderateRisk: 'Moderates Risiko',
        lowRisk: 'Niedriges Risiko',
        portfolio: 'Portfolio',
        individualAssets: 'Einzelne Assets',
        correlationHeatmapTitle: 'Korrelations-Heatmap',
        correlationHeatmapDesc: 'Wie sich Assets gemeinsam bewegen (hilft bei der Erkennung von Überexposition)',
        positive: 'Positiv',
        negative: 'Negativ',
        noCorrelation: 'Keine Korrelation (1.00)',
      },
      aiInsights: {
        title: 'KI-gestützte Insights',
        description: 'Natürlichsprachige Empfehlungen basierend auf Ihrer Portfolio-Performance und Allokationszielen',
        noInsightsAvailable: 'Noch keine KI-Insights verfügbar. Insights werden hier angezeigt, sobald Ihre Portfolio-Daten geladen sind.',
        suggestedAction: '💡 Vorgeschlagene Aktion:',
        priority: {
          high: 'HOCH',
          medium: 'MITTEL',
          low: 'NIEDRIG',
        },
      },
    },
  },
};

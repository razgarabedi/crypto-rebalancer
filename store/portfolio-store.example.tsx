/**
 * Portfolio Store Usage Examples
 * Demonstrates how to use the Zustand store with database integration
 */

'use client';

import { usePortfolioStore } from './portfolio-store';
import { useEffect } from 'react';

/**
 * Example 1: Fetch and display database portfolios
 */
export function PortfolioList() {
  const { dbPortfolios, isLoading, error, fetchDBPortfolios } = usePortfolioStore();

  useEffect(() => {
    fetchDBPortfolios(false); // false = don't include history
  }, [fetchDBPortfolios]);

  if (isLoading) return <div>Loading portfolios...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>My Portfolios</h2>
      {dbPortfolios.map((portfolio) => (
        <div key={portfolio.id}>
          <h3>{portfolio.name}</h3>
          <p>Interval: {portfolio.rebalanceInterval}</p>
          <p>Enabled: {portfolio.rebalanceEnabled ? 'Yes' : 'No'}</p>
          <p>Last rebalanced: {portfolio.lastRebalancedAt?.toString() || 'Never'}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 2: Create a new portfolio
 */
export function CreatePortfolioForm() {
  const { createDBPortfolio, isLoading, error } = usePortfolioStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const portfolio = await createDBPortfolio({
      name: 'My Portfolio',
      targetWeights: {
        BTC: 40,
        ETH: 30,
        SOL: 20,
        ADA: 10,
      },
      rebalanceEnabled: true,
      rebalanceInterval: 'weekly',
      rebalanceThreshold: 10.0,
    });

    if (portfolio) {
      console.log('Portfolio created:', portfolio.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Portfolio</h2>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Portfolio'}
      </button>
    </form>
  );
}

/**
 * Example 3: Update portfolio settings
 */
export function UpdatePortfolioButton({ portfolioId }: { portfolioId: string }) {
  const { updateDBPortfolio, isLoading } = usePortfolioStore();

  const handleUpdate = async () => {
    await updateDBPortfolio(portfolioId, {
      rebalanceEnabled: true,
      rebalanceInterval: 'daily',
      rebalanceThreshold: 20.0,
    });
  };

  return (
    <button onClick={handleUpdate} disabled={isLoading}>
      {isLoading ? 'Updating...' : 'Enable Daily Rebalancing'}
    </button>
  );
}

/**
 * Example 4: Delete portfolio
 */
export function DeletePortfolioButton({ portfolioId }: { portfolioId: string }) {
  const { deleteDBPortfolio, isLoading } = usePortfolioStore();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this portfolio?')) {
      await deleteDBPortfolio(portfolioId);
    }
  };

  return (
    <button onClick={handleDelete} disabled={isLoading}>
      {isLoading ? 'Deleting...' : 'Delete Portfolio'}
    </button>
  );
}

/**
 * Example 5: Trigger manual rebalance
 */
export function RebalanceButton({ portfolioId }: { portfolioId: string }) {
  const { triggerRebalance, isLoading, error } = usePortfolioStore();

  const handleRebalance = async () => {
    await triggerRebalance(portfolioId);
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={handleRebalance} disabled={isLoading}>
        {isLoading ? 'Rebalancing...' : 'Rebalance Now'}
      </button>
    </div>
  );
}

/**
 * Example 6: Portfolio details with history
 */
export function PortfolioDetails({ portfolioId }: { portfolioId: string }) {
  const { currentDBPortfolio, fetchDBPortfolio, isLoading } = usePortfolioStore();

  useEffect(() => {
    fetchDBPortfolio(portfolioId);
  }, [portfolioId, fetchDBPortfolio]);

  if (isLoading) return <div>Loading...</div>;
  if (!currentDBPortfolio) return <div>Portfolio not found</div>;

  return (
    <div>
      <h2>{currentDBPortfolio.name}</h2>
      <div>
        <h3>Settings</h3>
        <p>Rebalance: {currentDBPortfolio.rebalanceEnabled ? 'Enabled' : 'Disabled'}</p>
        <p>Interval: {currentDBPortfolio.rebalanceInterval}</p>
        <p>Threshold: €{currentDBPortfolio.rebalanceThreshold}</p>
      </div>
      <div>
        <h3>Target Allocation</h3>
        {Object.entries(currentDBPortfolio.targetWeights).map(([symbol, weight]) => (
          <p key={symbol}>
            {symbol}: {weight}%
          </p>
        ))}
      </div>
      <div>
        <h3>Schedule</h3>
        <p>Last rebalanced: {currentDBPortfolio.lastRebalancedAt?.toString() || 'Never'}</p>
        <p>Next rebalance: {currentDBPortfolio.nextRebalanceAt?.toString() || 'Not scheduled'}</p>
      </div>
    </div>
  );
}

/**
 * Example 7: Complete portfolio management component
 */
export function PortfolioManagement() {
  const {
    dbPortfolios,
    currentDBPortfolio,
    isLoading,
    error,
    fetchDBPortfolios,
    setCurrentDBPortfolio,
    createDBPortfolio,
    updateDBPortfolio,
    deleteDBPortfolio,
    triggerRebalance,
  } = usePortfolioStore();

  useEffect(() => {
    fetchDBPortfolios(true); // Include history
  }, [fetchDBPortfolios]);

  const handleCreate = async () => {
    const portfolio = await createDBPortfolio({
      name: 'New Portfolio',
      targetWeights: { BTC: 50, ETH: 50 },
      rebalanceEnabled: false,
      rebalanceInterval: 'weekly',
    });

    if (portfolio) {
      setCurrentDBPortfolio(portfolio);
    }
  };

  const handleToggleEnabled = async (id: string, currentValue: boolean) => {
    await updateDBPortfolio(id, { rebalanceEnabled: !currentValue });
  };

  return (
    <div className="portfolio-management">
      <div className="header">
        <h1>Portfolio Management</h1>
        <button onClick={handleCreate} disabled={isLoading}>
          Create New Portfolio
        </button>
      </div>

      {error && <div className="error">Error: {error}</div>}

      <div className="portfolio-list">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          dbPortfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className={`portfolio-card ${currentDBPortfolio?.id === portfolio.id ? 'active' : ''}`}
              onClick={() => setCurrentDBPortfolio(portfolio)}
            >
              <h3>{portfolio.name}</h3>
              <div className="portfolio-info">
                <span className={`status ${portfolio.rebalanceEnabled ? 'enabled' : 'disabled'}`}>
                  {portfolio.rebalanceEnabled ? '● Enabled' : '○ Disabled'}
                </span>
                <span className="interval">{portfolio.rebalanceInterval}</span>
              </div>
              <div className="portfolio-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleEnabled(portfolio.id, portfolio.rebalanceEnabled);
                  }}
                >
                  {portfolio.rebalanceEnabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerRebalance(portfolio.id);
                  }}
                  disabled={!portfolio.rebalanceEnabled}
                >
                  Rebalance
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this portfolio?')) {
                      deleteDBPortfolio(portfolio.id);
                    }
                  }}
                  className="danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {currentDBPortfolio && (
        <div className="portfolio-details">
          <h2>{currentDBPortfolio.name}</h2>
          <div className="details-grid">
            <div>
              <h4>Target Allocation</h4>
              {Object.entries(currentDBPortfolio.targetWeights).map(([symbol, weight]) => (
                <div key={symbol} className="allocation-item">
                  <span className="symbol">{symbol}</span>
                  <span className="weight">{weight}%</span>
                </div>
              ))}
            </div>
            <div>
              <h4>Settings</h4>
              <p>Interval: {currentDBPortfolio.rebalanceInterval}</p>
              <p>Threshold: €{currentDBPortfolio.rebalanceThreshold}</p>
              <p>Max Orders: {currentDBPortfolio.maxOrdersPerRebalance || 'Unlimited'}</p>
            </div>
            <div>
              <h4>Schedule</h4>
              <p>
                Last rebalanced:{' '}
                {currentDBPortfolio.lastRebalancedAt
                  ? new Date(currentDBPortfolio.lastRebalancedAt).toLocaleString()
                  : 'Never'}
              </p>
              <p>
                Next rebalance:{' '}
                {currentDBPortfolio.nextRebalanceAt
                  ? new Date(currentDBPortfolio.nextRebalanceAt).toLocaleString()
                  : 'Not scheduled'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example 8: Using both legacy and database portfolios
 */
export function HybridPortfolioView() {
  const {
    portfolios, // Legacy in-memory
    dbPortfolios, // Database
    fetchPortfolios,
    fetchDBPortfolios,
  } = usePortfolioStore();

  useEffect(() => {
    // Fetch both types
    fetchPortfolios(); // Legacy
    fetchDBPortfolios(); // Database
  }, [fetchPortfolios, fetchDBPortfolios]);

  return (
    <div>
      <div>
        <h2>Legacy Portfolios (In-Memory)</h2>
        <p>Count: {portfolios.length}</p>
      </div>
      <div>
        <h2>Database Portfolios</h2>
        <p>Count: {dbPortfolios.length}</p>
        {dbPortfolios.map((p) => (
          <div key={p.id}>{p.name}</div>
        ))}
      </div>
    </div>
  );
}


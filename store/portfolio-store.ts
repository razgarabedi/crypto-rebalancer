import { create } from 'zustand';
import { Portfolio, Asset } from '@/types';

// Database portfolio type (from Prisma)
interface DBPortfolio {
  id: string;
  name: string;
  userId?: string | null;
  targetWeights: Record<string, number>;
  rebalanceEnabled: boolean;
  rebalanceInterval: string;
  rebalanceThreshold: number;
  maxOrdersPerRebalance?: number | null;
  thresholdRebalanceEnabled?: boolean; // Threshold-based rebalancing
  thresholdRebalancePercentage?: number; // Percentage deviation trigger
  orderType?: string; // 'market' or 'limit'
  smartRoutingEnabled?: boolean; // Enable smart route selection
  schedulerEnabled?: boolean; // Enable automatic scheduler
  checkFrequency?: string; // How often to check for rebalancing
  totalFeesPaid?: number; // Cumulative trading fees in EUR
  lastRebalancedAt?: Date | null;
  nextRebalanceAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreatePortfolioData {
  name: string;
  userId?: string;
  targetWeights: Record<string, number>;
  rebalanceEnabled?: boolean;
  rebalanceInterval?: string;
  rebalanceThreshold?: number;
  maxOrdersPerRebalance?: number;
  thresholdRebalanceEnabled?: boolean;
  thresholdRebalancePercentage?: number;
  orderType?: string; // 'market' or 'limit'
  smartRoutingEnabled?: boolean;
  schedulerEnabled?: boolean;
  checkFrequency?: string;
}

interface UpdatePortfolioData {
  name?: string;
  targetWeights?: Record<string, number>;
  rebalanceEnabled?: boolean;
  rebalanceInterval?: string;
  rebalanceThreshold?: number;
  maxOrdersPerRebalance?: number;
  thresholdRebalanceEnabled?: boolean;
  thresholdRebalancePercentage?: number;
  orderType?: string; // 'market' or 'limit'
  smartRoutingEnabled?: boolean;
  schedulerEnabled?: boolean;
  checkFrequency?: string;
}

interface PortfolioStore {
  portfolios: Portfolio[];
  dbPortfolios: DBPortfolio[];
  currentPortfolio: Portfolio | null;
  currentDBPortfolio: DBPortfolio | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setPortfolios: (portfolios: Portfolio[]) => void;
  setDBPortfolios: (portfolios: DBPortfolio[]) => void;
  setCurrentPortfolio: (portfolio: Portfolio | null) => void;
  setCurrentDBPortfolio: (portfolio: DBPortfolio | null) => void;
  addPortfolio: (portfolio: Portfolio) => void;
  updatePortfolio: (id: string, portfolio: Partial<Portfolio>) => void;
  deletePortfolio: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Fetch actions (legacy in-memory)
  fetchPortfolios: () => Promise<void>;
  fetchPortfolio: (id: string) => Promise<void>;
  rebalancePortfolio: (id: string) => Promise<void>;
  
  // Database actions (new)
  fetchDBPortfolios: (includeHistory?: boolean) => Promise<void>;
  fetchDBPortfolio: (id: string) => Promise<void>;
  createDBPortfolio: (data: CreatePortfolioData) => Promise<DBPortfolio | null>;
  updateDBPortfolio: (id: string, data: UpdatePortfolioData) => Promise<void>;
  deleteDBPortfolio: (id: string) => Promise<void>;
  triggerRebalance: (id: string) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  portfolios: [],
  dbPortfolios: [],
  currentPortfolio: null,
  currentDBPortfolio: null,
  isLoading: false,
  error: null,

  setPortfolios: (portfolios) => set({ portfolios }),
  
  setDBPortfolios: (portfolios) => set({ dbPortfolios: portfolios }),
  
  setCurrentPortfolio: (portfolio) => set({ currentPortfolio: portfolio }),
  
  setCurrentDBPortfolio: (portfolio) => set({ currentDBPortfolio: portfolio }),
  
  addPortfolio: (portfolio) => 
    set((state) => ({ portfolios: [...state.portfolios, portfolio] })),
  
  updatePortfolio: (id, updates) =>
    set((state) => ({
      portfolios: state.portfolios.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      currentPortfolio:
        state.currentPortfolio?.id === id
          ? { ...state.currentPortfolio, ...updates }
          : state.currentPortfolio,
    })),
  
  deletePortfolio: (id) =>
    set((state) => ({
      portfolios: state.portfolios.filter((p) => p.id !== id),
      currentPortfolio:
        state.currentPortfolio?.id === id ? null : state.currentPortfolio,
    })),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),

  // Legacy in-memory actions
  fetchPortfolios: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/portfolios');
      if (!response.ok) throw new Error('Failed to fetch portfolios');
      const data = await response.json();
      set({ portfolios: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },

  fetchPortfolio: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/portfolios/${id}`);
      if (!response.ok) throw new Error('Failed to fetch portfolio');
      const data = await response.json();
      set({ currentPortfolio: data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },

  rebalancePortfolio: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/rebalance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId: id }),
      });
      if (!response.ok) throw new Error('Failed to rebalance portfolio');
      const data = await response.json();
      get().updatePortfolio(id, data);
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },

  // Database actions
  fetchDBPortfolios: async (includeHistory = false) => {
    set({ isLoading: true, error: null });
    try {
      const url = `/api/portfolios/manage${includeHistory ? '?includeHistory=true' : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch portfolios from database');
      const data = await response.json();
      set({ 
        dbPortfolios: data.portfolios || [],
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },

  fetchDBPortfolio: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/portfolios/${id}`);
      if (!response.ok) throw new Error('Failed to fetch portfolio from database');
      const data = await response.json();
      set({ 
        currentDBPortfolio: data.portfolio,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },

  createDBPortfolio: async (data: CreatePortfolioData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/portfolios/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portfolio');
      }
      const result = await response.json();
      
      // Refresh portfolios list
      await get().fetchDBPortfolios();
      
      set({ isLoading: false });
      return result.portfolio;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
      return null;
    }
  },

  updateDBPortfolio: async (id: string, data: UpdatePortfolioData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/portfolios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update portfolio');
      }
      
      // Refresh portfolios list
      await get().fetchDBPortfolios();
      
      // Update current portfolio if it's the one being updated
      if (get().currentDBPortfolio?.id === id) {
        await get().fetchDBPortfolio(id);
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },

  deleteDBPortfolio: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/portfolios/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete portfolio');
      }
      
      // Update local state
      set((state) => ({
        dbPortfolios: state.dbPortfolios.filter((p) => p.id !== id),
        currentDBPortfolio: state.currentDBPortfolio?.id === id ? null : state.currentDBPortfolio,
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },

  triggerRebalance: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/scheduler/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioId: id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger rebalance');
      }
      
      // Wait a moment for database to complete the update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh portfolio to get updated lastRebalancedAt and totalFeesPaid
      await get().fetchDBPortfolio(id);
      
      // Also refresh the portfolio list
      await get().fetchDBPortfolios(false);
      
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },
}));


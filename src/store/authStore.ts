import { create } from 'zustand';
import type { User, AuthResponse, WalletAssetSummary } from '@/types/auth';
import { authService } from '@/services/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  activeOrgId: string | null;
  walletSummaries: WalletAssetSummary[] | null;
  walletSummariesFetchedAt: number | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasMenuAccess: boolean;
  
  // Actions
  login: (response: AuthResponse) => void;
  logout: () => void;
  setOrganization: (orgId: string) => void;
  fetchUser: () => Promise<void>;
  fetchWalletSummaries: (force?: boolean) => Promise<void>;
}

let walletSummariesRequest: Promise<void> | null = null;
let fetchUserRequest: Promise<void> | null = null;
const WALLET_SUMMARIES_TTL_MS = 60_000;

export const useWalletBalances = () => {
  const summaries = useAuthStore(state => state.walletSummaries);
  
  const allowance = summaries?.find(s => s.asset_code === 'MENU_MONTHLY_ALLOWANCE')?.total_balance || 0;
  const promoCredits = summaries?.find(s => s.asset_code === 'MENU_PROMO_CREDIT')?.total_balance || 0;
  const credits = summaries?.find(s => s.asset_code === 'MENU_CREDIT')?.total_balance || 0;
  const commission = summaries?.find(s => s.asset_code === 'COMMISSION_LEDGER')?.total_balance || 0;
  
  // Total usable balance for Studio (excluding commission)
  const usableBalance = allowance + promoCredits + credits; 

  return { allowance, promoCredits, credits, commission, usableBalance };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('v_menu_token'),
  activeOrgId: localStorage.getItem('v_menu_org_id'),
  walletSummaries: null,
  walletSummariesFetchedAt: null,
  isLoading: true, // Initially true while we check token
  isAuthenticated: !!localStorage.getItem('v_menu_token'),
  hasMenuAccess: false,

  login: (response: AuthResponse) => {
    const { access_token: token, user, access } = response;
    
    localStorage.setItem('v_menu_token', token);
    
    const orgId = access?.active_org_id || user?.org_id || null;
    if (orgId) {
      localStorage.setItem('v_menu_org_id', orgId);
    }
    
    const hasAccess = access?.has_menu_access ?? false;

    set({ 
      token, 
      user: { ...user, access }, 
      activeOrgId: orgId,
      isAuthenticated: true,
      hasMenuAccess: hasAccess,
      isLoading: false 
    });
  },

  logout: () => {
    localStorage.removeItem('v_menu_token');
    localStorage.removeItem('v_menu_org_id');
    set({ 
      user: null, 
      token: null, 
      activeOrgId: null,
      walletSummaries: null,
      walletSummariesFetchedAt: null,
      isAuthenticated: false,
      hasMenuAccess: false,
      isLoading: false 
    });
    window.location.href = '/login';
  },

  setOrganization: (orgId: string) => {
    localStorage.setItem('v_menu_org_id', orgId);
    
    // We should ideally call the backend to switch org context
    // For now, we update local state but permissions should be re-fetched
    const { user } = get();
    const hasAccess = user?.access?.has_menu_access ?? false;
    
    set({ activeOrgId: orgId, hasMenuAccess: hasAccess });
  },

  fetchUser: async () => {
    if (fetchUserRequest) {
      return fetchUserRequest;
    }

    const { token } = get();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    fetchUserRequest = (async () => {
      try {
        const data = await authService.getCurrentSession();
        
        if (!data || !data.user) {
          throw new Error('Invalid user data received');
        }

        const { user, access } = data;
        
        const activeOrgId = access?.active_org_id || user?.org_id || null;
        if (activeOrgId) {
          localStorage.setItem('v_menu_org_id', activeOrgId);
        }
        
        const hasAccess = access?.has_menu_access ?? false;

        set({ 
          user: { ...user, access }, 
          activeOrgId: activeOrgId,
          isAuthenticated: true,
          hasMenuAccess: hasAccess,
          isLoading: false 
        });
      } catch (error) {
        // API client interceptor will handle 401 redirect
        console.error('Failed to fetch user:', error);
        set({ 
          user: null, 
          isAuthenticated: false,
          hasMenuAccess: false,
          isLoading: false 
        });
      } finally {
        fetchUserRequest = null;
      }
    })();

    return fetchUserRequest;
  },

  fetchWalletSummaries: async (force = false) => {
    if (walletSummariesRequest) {
      return walletSummariesRequest;
    }

    const { token, walletSummariesFetchedAt, walletSummaries } = get();
    if (!token) return;

    const isFresh = !force &&
      walletSummaries &&
      walletSummariesFetchedAt &&
      Date.now() - walletSummariesFetchedAt < WALLET_SUMMARIES_TTL_MS;
    if (isFresh) {
      return;
    }

    walletSummariesRequest = (async () => {
      try {
        const response = await authService.getWalletSummary();
        const newSummaries = response.assets || [];
        
        const { walletSummaries: currentWalletSummaries } = get();
        
        // Compare balances by asset code instead of stringifying payloads.
        let hasChanged = false;
        if (!currentWalletSummaries || currentWalletSummaries.length !== newSummaries.length) {
          hasChanged = true;
        } else {
          for (let i = 0; i < newSummaries.length; i++) {
            const oldAsset = currentWalletSummaries.find(a => a.asset_code === newSummaries[i].asset_code);
            if (!oldAsset || oldAsset.total_balance !== newSummaries[i].total_balance) {
              hasChanged = true;
              break;
            }
          }
        }

        set({
          walletSummaries: hasChanged ? newSummaries : currentWalletSummaries,
          walletSummariesFetchedAt: Date.now(),
        });
      } catch (error) {
        console.error('Failed to fetch wallet summaries:', error);
      } finally {
        walletSummariesRequest = null;
      }
    })();
    return walletSummariesRequest;
  }
}));

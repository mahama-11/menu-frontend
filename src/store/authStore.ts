import { create } from 'zustand';
import type { User, AuthResponse } from '@/types/auth';
import { authService } from '@/services/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  activeOrgId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasMenuAccess: boolean;
  
  // Actions
  login: (response: AuthResponse) => void;
  logout: () => void;
  setOrganization: (orgId: string) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('v_menu_token'),
  activeOrgId: localStorage.getItem('v_menu_org_id'),
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
    const { token } = get();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

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
    }
  }
}));

import { menuApiClient } from './api';
import type { User, AuthResponse, CreditsSummary, AccessContext } from '@/types/auth';

export interface SessionResponse {
  authenticated: boolean;
  user: User;
  credits: CreditsSummary;
  access: AccessContext;
}

export interface ProfileResponse {
  name: string;
  restaurant_name: string;
  email: string;
  language_preference: string;
  plan: string;
}

export interface Activity {
  id: string;
  action_type: string;
  action_name: string;
  credits_used: number;
  created_at: string;
}

export interface ActivitiesResponse {
  activities: Activity[];
  total_count: number;
}

export const authService = {
  // Use Menu Backend endpoints
  login: async (email: string, password: string):Promise<AuthResponse> => {
    const response = await menuApiClient.post('/auth/login', { email, password });
    return response as unknown as AuthResponse;
  },

  register: async (name: string, restaurant_name: string, email: string, password: string, referral_code?: string):Promise<AuthResponse> => {
    // Backend expects 'email', 'password', 'restaurant_name', and optional 'referral_code'
    const payload: Record<string, string> = { name, email, password, restaurant_name };
    if (referral_code) {
      payload.referral_code = referral_code;
    }
    const response = await menuApiClient.post('/auth/register', payload);
    return response as unknown as AuthResponse;
  },

  getCurrentSession: async ():Promise<SessionResponse> => {
    const response = await menuApiClient.get('/auth/session');
    return response as unknown as SessionResponse;
  },

  getCredits: async ():Promise<{ balance: number; permanent_balance?: number; reward_balance?: number; allowance_balance?: number; max_credits?: number; plan_name?: string; reset_date?: string }> => {
    const response = await menuApiClient.get('/user/credits');
    return response as unknown as { balance: number; permanent_balance?: number; reward_balance?: number; allowance_balance?: number; max_credits?: number; plan_name?: string; reset_date?: string };
  },

  getWalletSummary: async ():Promise<import('@/types/auth').WalletSummaryResponse> => {
    return menuApiClient.get('/user/wallet-summary') as unknown as import('@/types/auth').WalletSummaryResponse;
  },

  getProfile: async ():Promise<ProfileResponse> => {
    return menuApiClient.get('/user/profile') as unknown as ProfileResponse;
  },

  updateProfile: async (name: string, restaurant_name: string, language_preference: string):Promise<unknown> => {
    const response = await menuApiClient.patch('/user/profile', { name, restaurant_name, language_preference });
    return response;
  },

  getActivities: async (limit: number = 20, offset: number = 0):Promise<ActivitiesResponse> => {
    return menuApiClient.get(`/user/activities?limit=${limit}&offset=${offset}`) as unknown as ActivitiesResponse;
  },

  getWalletHistory: async (limit: number = 20, offset: number = 0):Promise<import('@/types/wallet').WalletHistoryResponse> => {
    return menuApiClient.get(`/user/wallet-history?limit=${limit}&offset=${offset}`) as unknown as import('@/types/wallet').WalletHistoryResponse;
  },

  getAuditHistory: async (limit: number = 20, offset: number = 0, targetType?: string):Promise<import('@/types/wallet').AuditHistoryResponse> => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (targetType) params.append('target_type', targetType);
    return menuApiClient.get(`/user/audit-history?${params.toString()}`) as unknown as import('@/types/wallet').AuditHistoryResponse;
  },
};

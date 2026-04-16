import { menuApiClient, platformApiClient } from './api';
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

  register: async (name: string, restaurant_name: string, email: string, password: string):Promise<AuthResponse> => {
    // Backend expects 'email', 'password', and 'restaurant_name'
    const response = await menuApiClient.post('/auth/register', { name, email, password, restaurant_name });
    return response as unknown as AuthResponse;
  },

  getCurrentSession: async ():Promise<SessionResponse> => {
    const response = await menuApiClient.get('/auth/session');
    return response as unknown as SessionResponse;
  },

  getCredits: async ():Promise<{ balance: number; max_credits?: number; plan_name?: string; reset_date?: string }> => {
    const response = await menuApiClient.get('/user/credits');
    return response as unknown as { balance: number; max_credits?: number; plan_name?: string; reset_date?: string };
  },

  getProfile: async ():Promise<{ data: ProfileResponse }> => {
    const response = await menuApiClient.get('/user/profile');
    return response as unknown as { data: ProfileResponse };
  },

  updateProfile: async (name: string, restaurant_name: string, language_preference: string):Promise<any> => {
    const response = await menuApiClient.patch('/user/profile', { name, restaurant_name, language_preference });
    return response;
  },

  getActivities: async (limit: number = 20, offset: number = 0):Promise<{ data: ActivitiesResponse }> => {
    const response = await menuApiClient.get(`/user/activities?limit=${limit}&offset=${offset}`);
    return response as unknown as { data: ActivitiesResponse };
  },

  switchOrganization: async (orgId: string):Promise<{ access_token?: string; current_org_id?: string; permissions?: string[]; org_role?: string }> => {
    const response = await platformApiClient.post('/orgs/switch', { organization_id: orgId });
    return response as unknown as { access_token?: string; current_org_id?: string; permissions?: string[]; org_role?: string };
  }
};

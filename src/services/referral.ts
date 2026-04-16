import { menuApiClient } from './api';
import type { 
  ReferralOverview, 
  ReferralCode, 
  ReferralConversion, 
  Commission,
  ReferralProgram
} from '@/types/referral';

export const referralService = {
  getPrograms: async (): Promise<{ data: { programs: ReferralProgram[] } }> => {
    const response = await menuApiClient.get('/referrals/programs');
    return response as unknown as { data: { programs: ReferralProgram[] } };
  },

  getOverview: async (): Promise<{ data: ReferralOverview }> => {
    const response = await menuApiClient.get('/referrals/me/overview');
    return response as unknown as { data: ReferralOverview };
  },

  getCodes: async (limit: number = 20, offset: number = 0): Promise<{ data: { codes: ReferralCode[], total: number } }> => {
    const response = await menuApiClient.get(`/referrals/me/codes?limit=${limit}&offset=${offset}`);
    return response as unknown as { data: { codes: ReferralCode[], total: number } };
  },

  createCode: async (program_id: string, metadata: string = '{}'): Promise<{ data: ReferralCode }> => {
    const response = await menuApiClient.post('/referrals/me/codes', { program_id, metadata });
    return response as unknown as { data: ReferralCode };
  },

  getConversions: async (limit: number = 20, offset: number = 0): Promise<{ data: { conversions: ReferralConversion[], total: number } }> => {
    const response = await menuApiClient.get(`/referrals/me/conversions?limit=${limit}&offset=${offset}`);
    return response as unknown as { data: { conversions: ReferralConversion[], total: number } };
  },

  getCommissions: async (limit: number = 20, offset: number = 0): Promise<{ data: { commissions: Commission[], total: number } }> => {
    const response = await menuApiClient.get(`/referrals/me/commissions?limit=${limit}&offset=${offset}`);
    return response as unknown as { data: { commissions: Commission[], total: number } };
  }
};

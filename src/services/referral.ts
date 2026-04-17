import { menuApiClient } from './api';
import type { 
  ReferralProgram, 
  ReferralOverview, 
  ReferralCode, 
  ReferralConversion, 
  Commission,
  ReferralCodeResolve,
  RedeemResponse
} from '@/types/referral';

export const referralService = {
  // 解析推荐码
  resolveCode: async (code: string): Promise<{ data: ReferralCodeResolve }> => {
    const response = await menuApiClient.get(`/referrals/codes/${code}/resolve`);
    return response as unknown as { data: ReferralCodeResolve };
  },

  // 获取推荐计划列表
  getPrograms: async (): Promise<{ data: { programs: ReferralProgram[] } }> => {
    const response = await menuApiClient.get('/referrals/programs');
    return response as unknown as { data: { programs: ReferralProgram[] } };
  },

  // 获取个人推荐概览（统计数据）
  getOverview: async (conversion_status?: string, commission_status?: string): Promise<{ data: ReferralOverview }> => {
    const params = new URLSearchParams();
    if (conversion_status) params.append('conversion_status', conversion_status);
    if (commission_status) params.append('commission_status', commission_status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await menuApiClient.get(`/referrals/me/overview${qs}`);
    return response as unknown as { data: ReferralOverview };
  },

  // 获取个人的推荐码列表
  getCodes: async (limit: number = 20, offset: number = 0, program_code?: string, status?: string): Promise<{ data: { codes: ReferralCode[], total: number } }> => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (program_code) params.append('program_code', program_code);
    if (status) params.append('status', status);
    const response = await menuApiClient.get(`/referrals/me/codes?${params.toString()}`);
    return response as unknown as { data: { codes: ReferralCode[], total: number } };
  },

  // 确保推荐码存在 (没有则创建)
  ensureCode: async (program_code?: string): Promise<{ data: ReferralCode }> => {
    const payload = program_code ? { program_code } : {};
    const response = await menuApiClient.post('/referrals/me/codes/ensure', payload);
    return response as unknown as { data: ReferralCode };
  },

  // 创建新的推荐码
  createCode: async (program_id: string, metadata: string = '{}'): Promise<{ data: ReferralCode }> => {
    const response = await menuApiClient.post('/referrals/me/codes', { program_id, metadata });
    return response as unknown as { data: ReferralCode };
  },

  // 获取推荐转化记录
  getConversions: async (limit: number = 20, offset: number = 0, status?: string): Promise<{ data: { conversions: ReferralConversion[], total: number } }> => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (status) params.append('status', status);
    const response = await menuApiClient.get(`/referrals/me/conversions?${params.toString()}`);
    return response as unknown as { data: { conversions: ReferralConversion[], total: number } };
  },

  // 获取佣金记录
  getCommissions: async (limit: number = 20, offset: number = 0, status?: string): Promise<{ data: { commissions: Commission[], total: number } }> => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (status) params.append('status', status);
    const response = await menuApiClient.get(`/referrals/me/commissions?${params.toString()}`);
    return response as unknown as { data: { commissions: Commission[], total: number } };
  },

  // 兑换佣金
  redeemCommissions: async (): Promise<{ data: RedeemResponse }> => {
    const response = await menuApiClient.post('/referrals/me/commissions/redeem');
    return response as unknown as { data: RedeemResponse };
  }
};

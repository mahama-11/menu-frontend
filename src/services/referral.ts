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

type ItemsResponse<T> = { items?: T[] };

const normalizeProgram = (item: ReferralProgram): ReferralProgram => ({
  ...item,
  effective_from: item.effective_from || undefined,
  effective_to: item.effective_to || undefined,
  metadata: item.metadata || undefined,
  created_at: item.created_at || undefined,
  updated_at: item.updated_at || undefined,
});

const normalizeCode = (item: ReferralCode): ReferralCode => ({
  ...item,
  metadata: item.metadata || undefined,
  invite_url: item.invite_url || undefined,
  signup_url: item.signup_url || undefined,
  share_text: item.share_text || undefined,
});

const normalizeConversion = (item: ReferralConversion): ReferralConversion => ({
  ...item,
  promoter_subject_type: item.promoter_subject_type || undefined,
  promoter_subject_id: item.promoter_subject_id || undefined,
  settlement_subject_type: item.settlement_subject_type || undefined,
  settlement_subject_id: item.settlement_subject_id || undefined,
  reference_type: item.reference_type || undefined,
  reference_id: item.reference_id || undefined,
  metadata: item.metadata || undefined,
});

const normalizeCommission = (item: Commission): Commission => ({
  ...item,
  product_code: item.product_code || undefined,
  commission_type: item.commission_type || undefined,
  beneficiary_subject_type: item.beneficiary_subject_type || undefined,
  beneficiary_subject_id: item.beneficiary_subject_id || undefined,
  settlement_subject_type: item.settlement_subject_type || undefined,
  settlement_subject_id: item.settlement_subject_id || undefined,
  updated_at: item.updated_at || undefined,
  settled_at: item.settled_at || undefined,
  description: item.description || undefined,
  reference_type: item.reference_type || undefined,
  reference_id: item.reference_id || undefined,
  redeemed_reward_id: item.redeemed_reward_id || undefined,
  metadata: item.metadata || undefined,
});

const normalizeResolvedCode = (item: ReferralCodeResolve): ReferralCodeResolve => ({
  ...item,
  product_code: item.product_code || undefined,
  program_code: item.program_code || undefined,
  commission_policy: item.commission_policy || undefined,
  commission_currency: item.commission_currency || undefined,
  commission_fixed_amount: item.commission_fixed_amount ?? undefined,
  commission_rate_bps: item.commission_rate_bps ?? undefined,
  promoter_name: item.promoter_name || undefined,
  promoter_id: item.promoter_id || undefined,
  promoter_subject_type: item.promoter_subject_type || undefined,
  promoter_subject_id: item.promoter_subject_id || undefined,
  status: item.status || undefined,
  metadata: item.metadata || undefined,
  reward_policy_desc: item.reward_policy_desc || undefined,
  settlement_delay_days: item.settlement_delay_days ?? undefined,
  allow_repeat: item.allow_repeat ?? undefined,
});

export const createEmptyReferralOverview = (): ReferralOverview => ({
  programs: [],
  codes: [],
  conversions: [],
  commissions: [],
  total_conversions: 0,
  tracked_conversions: 0,
  earned_conversions: 0,
  reversed_conversions: 0,
  total_commission: 0,
  earned_commission: 0,
  redeemable_commission: 0,
  redeemed_commission: 0,
  pending_commission: 0,
  reversed_commission: 0,
  redeem_target_asset_code: 'MENU_PROMO_CREDIT',
  invite_base_url: undefined,
});

const extractItems = <T>(response: ItemsResponse<T> | T[] | null | undefined): T[] => {
  if (Array.isArray(response)) {
    return response;
  }
  return response?.items || [];
};

const normalizeOverview = (input: ReferralOverview | null | undefined): ReferralOverview => {
  if (!input) {
    return createEmptyReferralOverview();
  }

  return {
    ...createEmptyReferralOverview(),
    ...input,
    programs: extractItems(input.programs).map(normalizeProgram),
    codes: extractItems(input.codes).map(normalizeCode),
    conversions: extractItems(input.conversions).map(normalizeConversion),
    commissions: extractItems(input.commissions).map(normalizeCommission),
    total_conversions: input.total_conversions ?? 0,
    tracked_conversions: input.tracked_conversions ?? 0,
    earned_conversions: input.earned_conversions ?? 0,
    reversed_conversions: input.reversed_conversions ?? 0,
    total_commission: input.total_commission ?? 0,
    earned_commission: input.earned_commission ?? 0,
    redeemable_commission: input.redeemable_commission ?? 0,
    redeemed_commission: input.redeemed_commission ?? 0,
    pending_commission: input.pending_commission ?? 0,
    reversed_commission: input.reversed_commission ?? 0,
    redeem_target_asset_code: input.redeem_target_asset_code || 'MENU_PROMO_CREDIT',
    invite_base_url: input.invite_base_url || undefined,
  };
};

export const referralService = {
  resolveCode: async (code: string): Promise<ReferralCodeResolve> => {
    const response = await menuApiClient.get(`/referrals/codes/${code}/resolve`) as unknown as ReferralCodeResolve;
    return normalizeResolvedCode(response);
  },

  getPrograms: async (): Promise<{ programs: ReferralProgram[] }> => {
    const response = await menuApiClient.get('/referrals/programs') as unknown as ItemsResponse<ReferralProgram> | ReferralProgram[];
    return { programs: extractItems(response) };
  },

  getOverview: async (conversion_status?: string, commission_status?: string): Promise<ReferralOverview> => {
    const params = new URLSearchParams();
    if (conversion_status) params.append('conversion_status', conversion_status);
    if (commission_status) params.append('commission_status', commission_status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await menuApiClient.get(`/referrals/me/overview${qs}`) as unknown as ReferralOverview;
    return normalizeOverview(response);
  },

  getCodes: async (limit: number = 20, offset: number = 0, program_code?: string, status?: string): Promise<{ codes: ReferralCode[], total: number }> => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (program_code) params.append('program_code', program_code);
    if (status) params.append('status', status);
    const response = await menuApiClient.get(`/referrals/me/codes?${params.toString()}`) as unknown as ItemsResponse<ReferralCode> | ReferralCode[];
    const items = extractItems(response);
    return { codes: items.map(normalizeCode), total: items.length };
  },

  ensureCode: async (program_code?: string): Promise<ReferralCode> => {
    const payload = program_code ? { program_code } : {};
    const response = await menuApiClient.post('/referrals/me/codes/ensure', payload) as unknown as ReferralCode;
    return normalizeCode(response);
  },

  createCode: async (program_code: string, metadata: Record<string, unknown> = {}): Promise<ReferralCode> => {
    const response = await menuApiClient.post('/referrals/me/codes', { program_code, metadata }) as unknown as ReferralCode;
    return normalizeCode(response);
  },

  getConversions: async (limit: number = 20, offset: number = 0, status?: string): Promise<{ conversions: ReferralConversion[], total: number }> => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (status) params.append('status', status);
    const response = await menuApiClient.get(`/referrals/me/conversions?${params.toString()}`) as unknown as ItemsResponse<ReferralConversion> | ReferralConversion[];
    const items = extractItems(response);
    return { conversions: items.map(normalizeConversion), total: items.length };
  },

  getCommissions: async (limit: number = 20, offset: number = 0, status?: string): Promise<{ commissions: Commission[], total: number }> => {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (status) params.append('status', status);
    const response = await menuApiClient.get(`/referrals/me/commissions?${params.toString()}`) as unknown as ItemsResponse<Commission> | Commission[];
    const items = extractItems(response);
    return { commissions: items.map(normalizeCommission), total: items.length };
  },

  redeemCommissions: async (): Promise<RedeemResponse> => {
    return menuApiClient.post('/referrals/me/commissions/redeem', {}) as unknown as RedeemResponse;
  },
};

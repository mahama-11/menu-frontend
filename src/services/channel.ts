import { menuApiClient } from './api';
import type {
  ChannelAdjustmentCreateInput,
  ChannelAdjustmentView,
  ChannelBindingView,
  ChannelCommissionView,
  ChannelOverview,
  ChannelPreviewInput,
  ChannelPreviewView,
  ChannelSettlementView,
} from '@/types/channel';

type ItemsResponse<T> = { items?: T[] };

const extractItems = <T>(response: ItemsResponse<T> | T[] | null | undefined): T[] => {
  if (Array.isArray(response)) {
    return response;
  }
  return response?.items || [];
};

const normalizeBindingView = (item: ChannelBindingView): ChannelBindingView => ({
  ...item,
  partner: item.partner || undefined,
  program: item.program || undefined,
  binding: {
    ...item.binding,
    effective_from: item.binding.effective_from || undefined,
    effective_to: item.binding.effective_to || undefined,
    locked_until: item.binding.locked_until || undefined,
  },
});

const normalizeCommissionView = (item: ChannelCommissionView): ChannelCommissionView => ({
  ...item,
  partner: item.partner || undefined,
  program: item.program || undefined,
  ledger: {
    ...item.ledger,
    available_at: item.ledger.available_at || undefined,
    earned_at: item.ledger.earned_at || undefined,
    settled_at: item.ledger.settled_at || undefined,
    reversed_at: item.ledger.reversed_at || undefined,
    reversal_event_id: item.ledger.reversal_event_id || undefined,
  },
});

const normalizeSettlementView = (item: ChannelSettlementView): ChannelSettlementView => ({
  ...item,
  partner: item.partner || undefined,
  program: item.program || undefined,
  batch: item.batch
    ? {
        ...item.batch,
        generated_at: item.batch.generated_at || undefined,
        confirmed_at: item.batch.confirmed_at || undefined,
        closed_at: item.batch.closed_at || undefined,
      }
    : undefined,
});

const normalizeAdjustmentView = (item: ChannelAdjustmentView): ChannelAdjustmentView => ({
  ...item,
  partner: item.partner || undefined,
  program: item.program || undefined,
  item: {
    ...item.item,
    effective_at: item.item.effective_at || undefined,
  },
});

const normalizePreviewView = (item: ChannelPreviewView): ChannelPreviewView => ({
  ...item,
  partner: item.partner || undefined,
  program: item.program || undefined,
  result: {
    ...item.result,
    snapshot: item.result.snapshot || undefined,
    legacy_policy: item.result.legacy_policy || undefined,
  },
});

export const createEmptyChannelOverview = (): ChannelOverview => ({
  partners: [],
  current_bindings: [],
  total_commission: 0,
  pending_commission: 0,
  earned_commission: 0,
  settled_commission: 0,
  reversed_commission: 0,
  pending_clawback: 0,
  applied_clawback: 0,
  settlement_count: 0,
  recent_settlements: [],
});

const normalizeOverview = (input: ChannelOverview | null | undefined): ChannelOverview => {
  if (!input) {
    return createEmptyChannelOverview();
  }
  return {
    ...createEmptyChannelOverview(),
    ...input,
    partners: input.partners || [],
    current_bindings: (input.current_bindings || []).map(normalizeBindingView),
    recent_settlements: (input.recent_settlements || []).map(normalizeSettlementView),
    total_commission: input.total_commission ?? 0,
    pending_commission: input.pending_commission ?? 0,
    earned_commission: input.earned_commission ?? 0,
    settled_commission: input.settled_commission ?? 0,
    reversed_commission: input.reversed_commission ?? 0,
    pending_clawback: input.pending_clawback ?? 0,
    applied_clawback: input.applied_clawback ?? 0,
    settlement_count: input.settlement_count ?? 0,
  };
};

export const channelService = {
  getOverview: async (): Promise<ChannelOverview> => {
    const response = await menuApiClient.get('/channel/me/overview') as unknown as ChannelOverview;
    return normalizeOverview(response);
  },

  getCurrentBinding: async (): Promise<{ items: ChannelBindingView[] }> => {
    const response = await menuApiClient.get('/channel/current-binding') as unknown as ItemsResponse<ChannelBindingView> | ChannelBindingView[];
    return { items: extractItems(response).map(normalizeBindingView) };
  },

  getCommissions: async (status?: string): Promise<{ items: ChannelCommissionView[] }> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await menuApiClient.get(`/channel/me/commissions${query}`) as unknown as ItemsResponse<ChannelCommissionView> | ChannelCommissionView[];
    return { items: extractItems(response).map(normalizeCommissionView) };
  },

  getSettlements: async (status?: string): Promise<{ items: ChannelSettlementView[] }> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await menuApiClient.get(`/channel/me/settlements${query}`) as unknown as ItemsResponse<ChannelSettlementView> | ChannelSettlementView[];
    return { items: extractItems(response).map(normalizeSettlementView) };
  },

  getAdjustments: async (status?: string): Promise<{ items: ChannelAdjustmentView[] }> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const response = await menuApiClient.get(`/channel/me/adjustments${query}`) as unknown as ItemsResponse<ChannelAdjustmentView> | ChannelAdjustmentView[];
    return { items: extractItems(response).map(normalizeAdjustmentView) };
  },

  createAdjustment: async (input: ChannelAdjustmentCreateInput): Promise<ChannelAdjustmentView> => {
    const response = await menuApiClient.post('/channel/me/adjustments', input) as unknown as ChannelAdjustmentView;
    return normalizeAdjustmentView(response);
  },

  preview: async (input: ChannelPreviewInput): Promise<ChannelPreviewView> => {
    const response = await menuApiClient.post('/channel/me/preview', input) as unknown as ChannelPreviewView;
    return normalizePreviewView(response);
  },
};

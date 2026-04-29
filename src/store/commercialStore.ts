import { create } from 'zustand';
import { commercialService } from '@/services/commercial';
import type { CommercialOrderView } from '@/types/commercial';
import { deriveLatestSubscription } from '@/lib/commercialPlan';

const COMMERCIAL_CONTEXT_TTL_MS = 60_000;

interface CommercialState {
  orders: CommercialOrderView[];
  latestSubscription: CommercialOrderView | null;
  fetchedAt: number | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  fetchCommercialContext: (force?: boolean) => Promise<void>;
}

let commercialRequest: Promise<void> | null = null;

export const useCommercialStore = create<CommercialState>((set, get) => ({
  orders: [],
  latestSubscription: null,
  fetchedAt: null,
  status: 'idle',

  fetchCommercialContext: async (force = false) => {
    if (commercialRequest) {
      return commercialRequest;
    }

    const { fetchedAt, status, orders } = get();
    const isFresh = !force && fetchedAt && Date.now() - fetchedAt < COMMERCIAL_CONTEXT_TTL_MS;
    if (isFresh || status === 'loading') {
      return;
    }

    commercialRequest = (async () => {
      set({ status: 'loading' });
      try {
        const result = await commercialService.listOrders();
        const nextOrders = result.items || [];
        set({
          orders: nextOrders,
          latestSubscription: deriveLatestSubscription(nextOrders),
          fetchedAt: Date.now(),
          status: 'ready',
        });
      } catch (error) {
        console.error('Failed to fetch commercial context:', error);
        set({
          orders,
          latestSubscription: deriveLatestSubscription(orders),
          status: 'error',
        });
      } finally {
        commercialRequest = null;
      }
    })();

    return commercialRequest;
  },
}));

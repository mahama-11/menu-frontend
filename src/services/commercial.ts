import { menuApiClient } from './api';
import type { CommercialOfferingsResponse, CommercialOrdersResult, CommercialOrderView } from '@/types/commercial';

export const commercialService = {
  getOfferings: async (): Promise<CommercialOfferingsResponse> => {
    return menuApiClient.get('/commercial/offerings') as unknown as CommercialOfferingsResponse;
  },

  createOrder: async (input: { sku_code?: string; package_code?: string; quantity?: number; metadata?: string }): Promise<CommercialOrderView> => {
    return menuApiClient.post('/commercial/orders', input) as unknown as CommercialOrderView;
  },

  listOrders: async (): Promise<CommercialOrdersResult> => {
    return menuApiClient.get('/commercial/orders') as unknown as CommercialOrdersResult;
  },

  confirmOrderPayment: async (orderID: string, input?: { payment_method?: string; provider_code?: string; payment_asset_code?: string; external_payment_id?: string; metadata?: string }): Promise<CommercialOrderView> => {
    return menuApiClient.post(`/commercial/orders/${orderID}/confirm-payment`, input || {}) as unknown as CommercialOrderView;
  },
};

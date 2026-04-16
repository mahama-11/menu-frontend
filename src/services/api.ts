import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { APIResponse } from '@/types/auth';

const PLATFORM_API_BASE_URL = import.meta.env.VITE_PLATFORM_API_BASE_URL || '/api/v1/platform';
const MENU_API_BASE_URL = import.meta.env.VITE_MENU_API_BASE_URL || '/api/v1/menu';

const createClient = (baseURL: string) =>
  axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const platformApiClient = createClient(PLATFORM_API_BASE_URL);
export const menuApiClient = createClient(MENU_API_BASE_URL);
export const apiClient = menuApiClient;

// Helper to get auth token
const getToken = () => localStorage.getItem('v_menu_token');
const getOrgId = () => localStorage.getItem('v_menu_org_id');

const applyInterceptors = (client: typeof platformApiClient) => {
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken();
      const orgId = getOrgId();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (orgId) {
        config.headers['X-Organization-ID'] = orgId;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response: AxiosResponse<APIResponse>) => {
      const resData = response.data;

      if (resData && (resData.code === 0 || resData.code === 200)) {
        return resData.data;
      }

      if (resData && resData.code === undefined) {
        return resData;
      }

      if (resData && resData.code !== 0 && resData.code !== 200) {
        let errorMsg = resData.message || resData.error || 'Unknown business error';
        // Special case mapping for known auth error codes from backend
        if (resData.code === 1001) {
          errorMsg = 'Invalid email or password. Please try again.';
        }
        return Promise.reject(new Error(errorMsg));
      }

      return response.data;
    },
    (error: AxiosError<APIResponse>) => {
      if (error.response) {
        const { status, data } = error.response;

        if (status === 401) {
          localStorage.removeItem('v_menu_token');
          localStorage.removeItem('v_menu_org_id');

          const isAuthPage = window.location.pathname.match(/^\/(login|register)/);
          if (!isAuthPage) {
            window.location.href = '/login?expired=1';
          }
        }

        if (data && (data.message || data.error)) {
          return Promise.reject(new Error(data.message || data.error));
        }
      }

      return Promise.reject(error);
    }
  );
};

applyInterceptors(platformApiClient);
applyInterceptors(menuApiClient);

export default apiClient;

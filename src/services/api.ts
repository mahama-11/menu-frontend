import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { APIResponse } from '@/types/auth';

const MENU_API_BASE_URL = import.meta.env.VITE_MENU_API_BASE_URL || '/api/v1/menu';

const createClient = (baseURL: string) =>
  axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const menuApiClient = createClient(MENU_API_BASE_URL);
export const apiClient = menuApiClient;

// Helper to get auth token
const getToken = () => localStorage.getItem('v_menu_token');
const getOrgId = () => localStorage.getItem('v_menu_org_id');

const applyInterceptors = (client: typeof menuApiClient) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (response: AxiosResponse<APIResponse>): any => {
      const resData = response.data;

      if (resData && (resData.code === 0 || resData.code === 200)) {
        return resData.data;
      }

      if (resData && resData.code === undefined) {
        return resData;
      }

      if (resData && resData.code !== 0 && resData.code !== 200) {
        // Priority 1: Semantic error_code and error_hint from backend
        if (resData.error_code) {
          return Promise.reject(new Error(resData.error_hint || resData.error_code));
        }
        
        // Priority 2: Fallback to message
        const errorMsg = resData.message || resData.error || 'Unknown business error';
        
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
        } else if (status === 403) {
          // Handle forbidden globally (e.g. show toast or redirect)
          console.warn('Forbidden: You do not have permission for this action.');
        } else if (status === 429) {
          // Handle rate limiting
          console.warn('Too Many Requests: Please slow down.');
          return Promise.reject(new Error('Rate limit exceeded. Please try again later.'));
        } else if (status >= 500) {
          console.error(`Server error (${status}):`, data);
          // Don't swallow the error, but we can provide a fallback generic message if data is empty
        }

        if (data) {
          if (data.error_code) {
            return Promise.reject(new Error(data.error_hint || data.error_code));
          }
          if (data.message || data.error) {
            return Promise.reject(new Error(data.message || data.error));
          }
        }
      }

      return Promise.reject(error);
    }
  );
};

applyInterceptors(menuApiClient);

export default apiClient;

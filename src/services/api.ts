import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { APIResponse } from '@/types/auth';
import i18n from '@/locales/i18n';

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

const getLocalizedErrorMessage = (errorCode: string, defaultHint?: string): string => {
  const i18nKey = `err.${errorCode}`;
  const translated = i18n.t(i18nKey);
  // If i18next returns the key itself, it means translation is missing
  if (translated !== i18nKey) {
    return translated;
  }
  return defaultHint || errorCode;
};

type MenuAPIError = Error & {
  error_code?: string;
  error_hint?: string;
  status?: number;
};

const createMenuAPIError = (message: string, options?: { error_code?: string; error_hint?: string; status?: number }): MenuAPIError => {
  const error = new Error(message) as MenuAPIError;
  if (options?.error_code) error.error_code = options.error_code;
  if (options?.error_hint) error.error_hint = options.error_hint;
  if (options?.status !== undefined) error.status = options.status;
  return error;
};

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
          const errMsg = getLocalizedErrorMessage(resData.error_code, resData.error_hint);
          return Promise.reject(createMenuAPIError(errMsg, {
            error_code: resData.error_code,
            error_hint: resData.error_hint,
            status: response.status,
          }));
        }
        
        // Priority 2: Fallback to message
        const errorMsg = resData.message || resData.error || 'Unknown business error';
        
        return Promise.reject(createMenuAPIError(errorMsg, { status: response.status }));
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
            const errMsg = getLocalizedErrorMessage(data.error_code, data.error_hint);
            return Promise.reject(createMenuAPIError(errMsg, {
              error_code: data.error_code,
              error_hint: data.error_hint,
              status,
            }));
          }
          if (data.message || data.error) {
            return Promise.reject(createMenuAPIError(String(data.message || data.error), { status }));
          }
        }
      }

      return Promise.reject(error);
    }
  );
};

applyInterceptors(menuApiClient);

export default apiClient;

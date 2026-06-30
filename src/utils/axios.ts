import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, AxiosHeaders } from 'axios';
import { authStoreApi } from '../stores/authStore';

const PUBLIC_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const LOCAL_API_BASE_URL = import.meta.env.VITE_API_LOCAL_URL;
const PRIVATE_API_BASE_URL = import.meta.env.VITE_APP_API_URL || PUBLIC_API_BASE_URL;
const REQUEST_TIMEOUT = 30000;
const REFRESH_ENDPOINT = '/auths/refresh';

const createApiInstance = (baseURL: string | undefined, options: AxiosRequestConfig = {}): AxiosInstance =>
  axios.create({
    baseURL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

const publicApi = createApiInstance(PUBLIC_API_BASE_URL);
const localApi = createApiInstance(LOCAL_API_BASE_URL);
const privateApi = createApiInstance(PRIVATE_API_BASE_URL);

privateApi.interceptors.request.use(
  (config) => {
    const token = authStoreApi.getAccessToken();

    if (token) {
      const headers = AxiosHeaders.from(config.headers ?? {});
      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

const forceLogout = () => {
  authStoreApi.clearAuth();
  window.location.href = '/admin/login';
};

/**
 * refresh 응답에서 토큰 추출. 백엔드는 `BaseResponse<TokenResponse>` =
 * `{ data: { accessToken, refreshToken } }` 형태(중첩)로 응답하므로 nested data 까지 본다.
 * accessToken 은 바디가 바로 문자열인 경우도 허용.
 */
const pickRefreshField = (raw: unknown, field: 'accessToken' | 'refreshToken'): string | null => {
  if (field === 'accessToken' && typeof raw === 'string') return raw;
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o[field] === 'string') return o[field] as string;
  if (o.data && typeof o.data === 'object') {
    const inner = (o.data as Record<string, unknown>)[field];
    if (typeof inner === 'string') return inner;
  }
  return null;
};

privateApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { response, config } = error;

    if (!response || !config) {
      return Promise.reject(error);
    }

    if (response.status !== 401 || config._retry) {
      return Promise.reject(error);
    }

    config._retry = true;

    const refreshToken = authStoreApi.getRefreshToken();

    if (!refreshToken) {
      forceLogout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          const headers = AxiosHeaders.from(config.headers ?? {});
          headers.set('Authorization', `Bearer ${newToken}`);
          config.headers = headers;
          privateApi(config).then(resolve).catch(reject);
        });
      });
    }

    isRefreshing = true;

    try {
      // 백엔드 `/api/auths/refresh` 는 RefreshRequest{ refreshToken } 를 @RequestBody 로 받는다.
      // (헤더가 아니라 바디로 보내야 함 — 헤더로 보내면 NotBlank 검증 실패로 400)
      const res = await publicApi.post(REFRESH_ENDPOINT, { refreshToken });
      const newToken = pickRefreshField(res.data, 'accessToken');
      const newRefreshToken = pickRefreshField(res.data, 'refreshToken');

      if (!newToken) {
        throw new Error('리프레시 응답에 토큰이 없습니다.');
      }

      // 백엔드가 리프레시 토큰을 회전(새 값 발급)하면 함께 갱신해야 다음 갱신도 성공한다.
      if (newRefreshToken) {
        authStoreApi.setTokens(newToken, newRefreshToken);
      } else {
        authStoreApi.refreshAccessToken(newToken);
      }
      isRefreshing = false;
      onRefreshed(newToken);

      const headers = AxiosHeaders.from(config.headers ?? {});
      headers.set('Authorization', `Bearer ${newToken}`);
      config.headers = headers;

      return privateApi(config);
    } catch (refreshError) {
      isRefreshing = false;
      forceLogout();
      return Promise.reject(refreshError);
    }
  },
);

const unwrap = <T = unknown>(promise: Promise<{ data: T }>) => promise.then((res) => res.data);

export const APIService = {
  public: {
    get: <T = unknown>(url: string, config?: AxiosRequestConfig) => unwrap<T>(publicApi.get<T>(url, config)),
    post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      unwrap<T>(publicApi.post<T>(url, data, config)),
    put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      unwrap<T>(publicApi.put<T>(url, data, config)),
    patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      unwrap<T>(publicApi.patch<T>(url, data, config)),
    delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => unwrap<T>(publicApi.delete<T>(url, config)),
  },
  local: {
    get: <T = unknown>(url: string, config?: AxiosRequestConfig) => unwrap<T>(localApi.get<T>(url, config)),
    post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      unwrap<T>(localApi.post<T>(url, data, config)),
    put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      unwrap<T>(localApi.put<T>(url, data, config)),
    patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      unwrap<T>(localApi.patch<T>(url, data, config)),
    delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => unwrap<T>(localApi.delete<T>(url, config)),
  },
  private: {
    get: <T = unknown>(url: string, config?: AxiosRequestConfig) => unwrap<T>(privateApi.get<T>(url, config)),
    post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      unwrap<T>(privateApi.post<T>(url, data, config)),
    put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      unwrap<T>(privateApi.put<T>(url, data, config)),
    patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
      unwrap<T>(privateApi.patch<T>(url, data, config)),
    delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => unwrap<T>(privateApi.delete<T>(url, config)),
  },
};

export default { public: publicApi, local: localApi, private: privateApi };

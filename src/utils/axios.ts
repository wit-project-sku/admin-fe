import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig, AxiosHeaders } from 'axios';
import { authStoreApi } from '../stores/authStore';
import { isAccessTokenExpired } from './authToken';
import { parseAuthSessionResponse } from './authResponse';

const PUBLIC_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const LOCAL_API_BASE_URL = import.meta.env.VITE_API_LOCAL_URL;
const PRIVATE_API_BASE_URL = import.meta.env.VITE_APP_API_URL || PUBLIC_API_BASE_URL;
const REQUEST_TIMEOUT = 30000;
/**
 * 파일이 실린 요청(multipart)의 타임아웃 — 2분.
 *
 * 조회·저장은 30초면 충분하지만 업로드는 회선이 결정한다. 30초였을 때 의상 사진 교체가 전송 도중
 * 끊겨, 서버에는 닿지도 못한 채 nginx 에 `400 · 본문 0바이트`로 찍혔다(2026-09-17 운영). 그래서
 * 파일이 실린 요청만 늘린다 — 전역을 늘리면 응답 없는 조회까지 2분을 기다리게 된다.
 */
const UPLOAD_TIMEOUT = 120000;
const REFRESH_ENDPOINT = '/auths/refresh';

/** FormData(=파일 업로드)면 타임아웃을 늘린다. 업로드 훅이 15곳이라 인스턴스에서 한 번에 건다. */
const withUploadTimeout = (instance: AxiosInstance): AxiosInstance => {
  instance.interceptors.request.use((config) => {
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      config.timeout = UPLOAD_TIMEOUT;
    }
    return config;
  });
  return instance;
};

const createApiInstance = (baseURL: string | undefined, options: AxiosRequestConfig = {}): AxiosInstance =>
  withUploadTimeout(
    axios.create({
      baseURL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    }),
  );

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
  window.location.hash = '#/admin/login';
};

export const extractTokenFromRefreshBody = (raw: unknown) => parseAuthSessionResponse(raw)?.accessToken ?? null;

/** Calls `/auths/refresh` and stores renewed session tokens. Shared by 401 interceptor and app bootstrap. */
export async function performTokenRefresh(): Promise<string> {
  const refreshToken = authStoreApi.getRefreshToken();
  if (!refreshToken) {
    throw new Error('리프레시 토큰이 없습니다.');
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh((newToken) => resolve(newToken));
      setTimeout(() => reject(new Error('토큰 재발급 대기 시간이 초과되었습니다.')), REQUEST_TIMEOUT);
    });
  }

  isRefreshing = true;

  try {
    const res = await publicApi.post(REFRESH_ENDPOINT, { refreshToken });
    const session = parseAuthSessionResponse(res.data);

    if (!session?.accessToken) {
      throw new Error('리프레시 응답에 토큰이 없습니다.');
    }

    authStoreApi.refreshAccessToken(session.accessToken, session.refreshToken, session.username);
    onRefreshed(session.accessToken);
    return session.accessToken;
  } finally {
    isRefreshing = false;
  }
}

/**
 * On reload, silently renew an expired/missing access token when a refresh token is still valid.
 * Returns true when the session should be treated as authenticated.
 */
export async function bootstrapAuthSession(): Promise<boolean> {
  const accessToken = authStoreApi.getAccessToken();
  const refreshToken = authStoreApi.getRefreshToken();

  if (!refreshToken) {
    return Boolean(accessToken);
  }

  if (accessToken && !isAccessTokenExpired(accessToken)) {
    return true;
  }

  try {
    await performTokenRefresh();
    return true;
  } catch {
    authStoreApi.clearAuth();
    return false;
  }
}

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

    try {
      const newToken = await performTokenRefresh();
      const headers = AxiosHeaders.from(config.headers ?? {});
      headers.set('Authorization', `Bearer ${newToken}`);
      config.headers = headers;
      return privateApi(config);
    } catch (refreshError) {
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

import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { authStoreApi } from '../../stores/authStore';

export type LoginPayload = {
  username: string;
  password: string;
};

type LoginMutationResult = {
  response: unknown;
  accessToken: string;
  refreshToken: string | null;
};

const pickAccessToken = (r: unknown): string | undefined => {
  if (r == null) return undefined;
  if (typeof r === 'string') return r;
  if (typeof r !== 'object') return undefined;
  const o = r as { accessToken?: string; data?: unknown };
  if (typeof o.accessToken === 'string') return o.accessToken;
  if (typeof o.data === 'string') return o.data;
  if (o.data && typeof o.data === 'object') {
    const inner = (o.data as { accessToken?: string }).accessToken;
    return typeof inner === 'string' ? inner : undefined;
  }
  return undefined;
};

const pickRefreshToken = (r: unknown): string | null => {
  if (r == null || typeof r !== 'object') return null;
  const o = r as { refreshToken?: string; data?: unknown };
  if (typeof o.refreshToken === 'string') return o.refreshToken;
  if (o.data && typeof o.data === 'object') {
    const inner = (o.data as { refreshToken?: string }).refreshToken;
    return typeof inner === 'string' ? inner : null;
  }
  return null;
};

export const useLogin = () => {
  const { mutate: login, mutateAsync: loginAsync, isPending, error } = useMutation({
    mutationFn: async (payload: LoginPayload): Promise<LoginMutationResult> => {
      const response = await APIService.public.post<unknown>('/auths/login', payload);
      const accessToken = pickAccessToken(response);
      const refreshToken = pickRefreshToken(response);

      if (!accessToken) {
        throw new Error('로그인 응답에 accessToken이 없습니다.');
      }

      return { response, accessToken, refreshToken };
    },
    onSuccess: (data) => {
      authStoreApi.setTokens(data.accessToken, data.refreshToken);
    },
  });

  return { login, loginAsync, isPending, error };
};

import { useMutation } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { parseAuthSessionResponse } from '../../utils/authResponse';
import { authStoreApi } from '../../stores/authStore';

export type LoginPayload = {
  username: string;
  password: string;
};

type LoginMutationResult = {
  response: unknown;
  accessToken: string;
  refreshToken: string;
  username: string | null;
};

export const useLogin = () => {
  const { mutate: login, mutateAsync: loginAsync, isPending, error } = useMutation({
    mutationFn: async (payload: LoginPayload): Promise<LoginMutationResult> => {
      const response = await APIService.public.post<unknown>('/auths/login', payload);
      const parsed = parseAuthSessionResponse(response);

      if (!parsed?.accessToken) {
        throw new Error('로그인 응답에 accessToken이 없습니다.');
      }

      const { accessToken, refreshToken, username } = parsed;

      if (!refreshToken) {
        throw new Error('로그인 응답에 refreshToken이 없습니다.');
      }

      return { response, accessToken, refreshToken, username };
    },
    onSuccess: (data) => {
      authStoreApi.setTokens(data.accessToken, data.refreshToken, data.username);
    },
  });

  return { login, loginAsync, isPending, error };
};

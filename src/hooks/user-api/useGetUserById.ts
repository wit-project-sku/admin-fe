import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import type { UserListItem } from './useGetUsers';

type UserByIdResponse = {
  success: boolean;
  code: number;
  message: string;
  data: UserListItem;
};

const unwrapUser = (raw: unknown): UserListItem | null => {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.data && typeof r.data === 'object') return r.data as UserListItem;
  return null;
};

export const userByIdQueryKey = (userId: number | null) => ['users', 'detail', userId] as const;

export const useGetUserById = (userId: number | null) => {
  return useQuery({
    queryKey: userByIdQueryKey(userId),
    queryFn: (): Promise<UserByIdResponse> =>
      APIService.private.get<UserByIdResponse>(`/users/${userId}`),
    select: unwrapUser,
    enabled: userId != null,
    staleTime: 30 * 1000,
  });
};

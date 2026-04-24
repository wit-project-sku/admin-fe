import { useQuery } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';
import { useAuthStore } from '../../stores/authStore';

export const ROLE_ADMIN = 'ROLE_ADMIN';
export const ROLE_USER = 'ROLE_USER';

export type UserRole = typeof ROLE_ADMIN | typeof ROLE_USER;

export type MeUser = {
  userId: number;
  username: string;
  name: string;
  role: UserRole;
};

type ApiEnvelope<T> = {
  success?: boolean;
  code?: number;
  message?: string;
  data?: T;
};

const unwrapMePayload = (raw: unknown): MeUser | null => {
  if (!raw || typeof raw !== 'object') return null;
  const envelope = raw as ApiEnvelope<MeUser> & Partial<MeUser>;
  const candidate = envelope.data && typeof envelope.data === 'object' ? envelope.data : envelope;
  if (!candidate || typeof candidate !== 'object') return null;
  const { userId, username, name, role } = candidate as MeUser;
  if (typeof role !== 'string') return null;
  return {
    userId: Number(userId),
    username: String(username ?? ''),
    name: String(name ?? ''),
    role: role as UserRole,
  };
};

export const ME_QUERY_KEY = ['auth', 'me'] as const;

export const useGetMe = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => APIService.private.get<unknown>('/users'),
    select: (raw): MeUser | null => unwrapMePayload(raw),
    enabled: hasHydrated && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { APIService } from '../../utils/axios';

export type AdminUserRole = 'ROLE_ADMIN' | 'ROLE_USER';

export type UserListItem = {
  userId: number;
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  role: AdminUserRole;
};

export type UserFilterParam = 'ROLE_USER' | 'ROLE_ADMIN' | 'INACTIVE';

type PagedData = {
  content: UserListItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type UsersPagedResult = {
  content: UserListItem[];
  totalElements: number;
  totalPages: number;
};

type UsersResponse = {
  success: boolean;
  code: number;
  message: string;
  data: PagedData | UserListItem[];
};

const unwrapUsers = (raw: unknown): UsersPagedResult => {
  const empty: UsersPagedResult = { content: [], totalElements: 0, totalPages: 0 };
  if (!raw || typeof raw !== 'object') return empty;
  const r = raw as Record<string, unknown>;
  const payload = r.data;

  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const p = payload as Record<string, unknown>;
    const content = Array.isArray(p.content) ? (p.content as UserListItem[]) : [];
    return {
      content,
      totalElements: Number(p.totalElements ?? content.length),
      totalPages: Number(p.totalPages ?? 1),
    };
  }

  if (Array.isArray(payload)) {
    return {
      content: payload as UserListItem[],
      totalElements: payload.length,
      totalPages: 1,
    };
  }

  return empty;
};

export type GetUsersParams = {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  filter?: UserFilterParam;
};

export const USERS_BASE_KEY = ['users'] as const;

export const USER_LIST_QUERY_KEY = (params: GetUsersParams) =>
  ['users', 'list', params] as const;

export const useGetUsers = (params: GetUsersParams = {}) => {
  const { pageNum = 1, pageSize = 10, keyword, filter } = params;

  return useQuery({
    queryKey: USER_LIST_QUERY_KEY(params),
    placeholderData: keepPreviousData,
    queryFn: (): Promise<UsersResponse> =>
      APIService.private.get<UsersResponse>('/users', {
        params: {
          pageNum,
          pageSize,
          keyword: keyword || undefined,
          filter: filter || undefined,
        },
      }),
    select: unwrapUsers,
    staleTime: 30 * 1000,
  });
};

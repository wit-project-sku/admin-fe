import { ROLE_ADMIN, ROLE_USER, type UserRole } from '../hooks/auth-api/useGetMe';

/** Paths that ROLE_USER is allowed to visit inside `/admin`. */
export const USER_ALLOWED_PATHS = [
  '/admin/dashboard',
  '/admin/payments',
  '/admin/deliveries',
  '/admin/refunds',
  '/admin/products',
] as const;

/** Fallback landing page for each role once they are authenticated. */
export const ROLE_DEFAULT_LANDING: Record<UserRole, string> = {
  [ROLE_ADMIN]: '/admin/dashboard',
  [ROLE_USER]: '/admin/dashboard',
};

export const isPathAllowedForRole = (role: UserRole | null | undefined, pathname: string): boolean => {
  if (role === ROLE_ADMIN) return true;
  if (role === ROLE_USER) {
    return USER_ALLOWED_PATHS.some((allowed) => pathname === allowed || pathname.startsWith(`${allowed}/`));
  }
  return false;
};

export const getRoleLabel = (role: UserRole | null | undefined): string => {
  if (role === ROLE_ADMIN) return '관리자';
  if (role === ROLE_USER) return '사용자';
  return '사용자';
};

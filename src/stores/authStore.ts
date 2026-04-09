import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const parseUsernameFromToken = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!)) as { sub?: string; username?: string };
    return payload?.sub ?? payload?.username ?? null;
  } catch {
    return null;
  }
};

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setTokens: (accessToken: string, refreshToken?: string | null) => void;
  clearAuth: () => void;
  refreshAccessToken: (accessToken: string) => void;
  getAuthSnapshot: () => AuthState;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      username: null,
      isAuthenticated: false,
      hasHydrated: false,
      setTokens: (accessToken, refreshToken = null) =>
        set({
          accessToken,
          refreshToken,
          username: parseUsernameFromToken(accessToken),
          isAuthenticated: Boolean(accessToken),
          hasHydrated: true,
        }),
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          username: null,
          isAuthenticated: false,
          hasHydrated: true,
        }),
      refreshAccessToken: (accessToken) =>
        set({
          accessToken,
          username: parseUsernameFromToken(accessToken),
          isAuthenticated: Boolean(accessToken),
          hasHydrated: true,
        }),
      getAuthSnapshot: () => get(),
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.username = parseUsernameFromToken(state.accessToken);
        state.isAuthenticated = Boolean(state.accessToken);
        state.hasHydrated = true;
      },
    },
  ),
);

export const authStoreApi = {
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: (accessToken: string, refreshToken?: string | null) => useAuthStore.getState().setTokens(accessToken, refreshToken),
  clearAuth: () => useAuthStore.getState().clearAuth(),
  refreshAccessToken: (accessToken: string) => useAuthStore.getState().refreshAccessToken(accessToken),
};

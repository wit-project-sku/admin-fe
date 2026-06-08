import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usernameFromAccessToken } from '../utils/authToken';

export type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  authBootstrapped: boolean;
  setTokens: (accessToken: string, refreshToken?: string | null, username?: string | null) => void;
  clearAuth: () => void;
  refreshAccessToken: (accessToken: string, refreshToken?: string | null, username?: string | null) => void;
  setAuthBootstrapped: (value: boolean) => void;
  getAuthSnapshot: () => AuthState;
};

function computeIsAuthenticated(accessToken: string | null, refreshToken: string | null): boolean {
  return Boolean(accessToken || refreshToken);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      username: null,
      isAuthenticated: false,
      hasHydrated: false,
      authBootstrapped: false,
      setTokens: (accessToken, refreshToken = null, username = null) =>
        set({
          accessToken,
          refreshToken,
          username: username ?? usernameFromAccessToken(accessToken),
          isAuthenticated: computeIsAuthenticated(accessToken, refreshToken),
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
      refreshAccessToken: (accessToken, refreshToken = null, username = null) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
          username: username ?? usernameFromAccessToken(accessToken) ?? state.username,
          isAuthenticated: computeIsAuthenticated(accessToken, refreshToken ?? state.refreshToken),
          hasHydrated: true,
        })),
      setAuthBootstrapped: (value) => set({ authBootstrapped: value }),
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
        state.username = usernameFromAccessToken(state.accessToken);
        state.isAuthenticated = computeIsAuthenticated(state.accessToken, state.refreshToken);
        state.hasHydrated = true;
        state.authBootstrapped = false;
      },
    },
  ),
);

export const authStoreApi = {
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: (accessToken: string, refreshToken?: string | null, username?: string | null) =>
    useAuthStore.getState().setTokens(accessToken, refreshToken, username),
  clearAuth: () => useAuthStore.getState().clearAuth(),
  refreshAccessToken: (accessToken: string, refreshToken?: string | null, username?: string | null) =>
    useAuthStore.getState().refreshAccessToken(accessToken, refreshToken, username),
  setAuthBootstrapped: (value: boolean) => useAuthStore.getState().setAuthBootstrapped(value),
};

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { authApi, userApi } from "@/lib/api/services";
import type { LoginResponse, User } from "@/lib/api/types";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthContextValue = AuthState & {
  isReady: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setLoginSession: (payload: LoginResponse) => void;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
};

const AUTH_STORAGE_KEY = "order-app-session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthState;
        setState(parsed);
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  const persist = useCallback((nextState: AuthState) => {
    setState(nextState);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextState));
  }, []);

  const setLoginSession = useCallback(
    (payload: LoginResponse) => {
      persist({
        user: payload.user,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken
      });
    },
    [persist]
  );

  const refreshProfile = useCallback(async () => {
    if (!state.accessToken) {
      return;
    }

    try {
      const profile = await userApi.getMe(state.accessToken);
      persist({
        ...state,
        user: profile
      });
    } catch {
      persist({ user: null, accessToken: null, refreshToken: null });
    }
  }, [persist, state]);

  const logout = useCallback(async () => {
    if (state.accessToken) {
      try {
        await authApi.logout(state.accessToken);
      } catch {
        // Ignore API logout failures and clear local session anyway.
      }
    }

    const next = { user: null, accessToken: null, refreshToken: null };
    setState(next);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, [state.accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isReady,
      isAuthenticated: Boolean(state.accessToken && state.user),
      isAdmin: state.user?.role === "admin",
      setLoginSession,
      refreshProfile,
      logout
    }),
    [isReady, logout, refreshProfile, setLoginSession, state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

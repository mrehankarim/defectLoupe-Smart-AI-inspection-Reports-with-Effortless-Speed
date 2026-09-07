import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError, setUnauthorizedHandler, setStoredTokens, clearStoredTokens } from "../services/api";

export type UserRole = "ADMIN" | "INSPECTOR" | "CLIENT_VIEWER";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
};

type Credentials = {
  email: string;
  password: string;
};

type Registration = Credentials & {
  first_name: string;
  last_name: string;
  phone_number?: string;
  license_number?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (data: Registration) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isApiError(error: unknown): error is ApiError {
  return typeof error === "object" && error !== null && "status" in error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await api.get<AuthUser>("/auth/me");
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (!isApiError(error) || error.status !== 401) {
        throw error;
      }
      clearStoredTokens();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredTokens();
      setUser(null);
      const next = `${window.location.pathname}${window.location.search}`;
      if (!next.startsWith("/login") && !next.startsWith("/signup") && !next.startsWith("/verify-email")) {
        navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true });
      }
    });

    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  useEffect(() => {
    void refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login: async (credentials: Credentials) => {
        const res = await api.post<{ access_token?: string; refresh_token?: string }>("/auth/login", credentials);
        if (res?.access_token) {
          setStoredTokens(res.access_token, res.refresh_token);
        }
        await refreshUser();
      },
      register: async (data: Registration) => {
        await api.post("/auth/register", data);
      },
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } finally {
          clearStoredTokens();
          setUser(null);
        }
      },
      refreshUser,
    }),
    [isLoading, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

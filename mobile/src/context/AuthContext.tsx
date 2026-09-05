import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  authService,
  UserProfile,
  InspectorProfile,
} from "../services/authService";
import {
  STORAGE_KEYS,
  getBaseUrl,
  setBaseUrl,
  setUnauthorizedCallback,
  DEFAULT_SERVER_URL,
} from "../services/api";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  inspector: InspectorProfile | null;
  serverUrl: string;
  isServerOnline: boolean;
  serverStatusMessage: string;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateServerUrl: (newUrl: string) => Promise<boolean>;
  checkServerConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  inspector: null,
  serverUrl: DEFAULT_SERVER_URL,
  isServerOnline: false,
  serverStatusMessage: "Checking connection...",
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
  updateServerUrl: async () => false,
  checkServerConnection: async () => false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [inspector, setInspector] = useState<InspectorProfile | null>(null);
  const [serverUrl, setServerUrlState] = useState<string>(DEFAULT_SERVER_URL);
  const [isServerOnline, setIsServerOnline] = useState<boolean>(false);
  const [serverStatusMessage, setServerStatusMessage] = useState<string>("Checking...");

  const checkServerConnection = useCallback(async (): Promise<boolean> => {
    const health = await authService.checkServerHealth();
    setIsServerOnline(health.ok);
    setServerStatusMessage(health.message);
    return health.ok;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setInspector(null);
  }, []);

  useEffect(() => {
    setUnauthorizedCallback(() => {
      setIsAuthenticated(false);
      setUser(null);
      setInspector(null);
    });

    const bootstrap = async () => {
      try {
        const [savedUrl, savedToken, savedUser, savedInspector] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL),
          AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.INSPECTOR),
        ]);

        if (savedUrl) {
          setServerUrlState(savedUrl);
          await setBaseUrl(savedUrl);
        }

        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedInspector) setInspector(JSON.parse(savedInspector));

        if (savedToken) {
          setIsAuthenticated(true);
          // Refresh in background
          authService.getMe().then(setUser).catch(() => {});
          authService.getInspectorMe().then(setInspector).catch(() => {});
        }
      } catch {
      } finally {
        setIsLoading(false);
        checkServerConnection();
      }
    };

    bootstrap();
  }, [checkServerConnection]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, pass);
      setIsAuthenticated(true);
      if (result.user) setUser(result.user);
      const insp = await authService.getInspectorMe().catch(() => null);
      if (insp) setInspector(insp);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      await authService.register(data);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const [u, i] = await Promise.all([
        authService.getMe(),
        authService.getInspectorMe(),
      ]);
      setUser(u);
      setInspector(i);
    } catch {}
  };

  const updateServerUrl = async (newUrl: string): Promise<boolean> => {
    await setBaseUrl(newUrl);
    setServerUrlState(newUrl);
    return await checkServerConnection();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        inspector,
        serverUrl,
        isServerOnline,
        serverStatusMessage,
        login,
        register,
        logout,
        refreshProfile,
        updateServerUrl,
        checkServerConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

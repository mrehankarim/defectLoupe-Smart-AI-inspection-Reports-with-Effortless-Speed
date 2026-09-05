import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const DEFAULT_SERVER_URL =
  Platform.OS === "android" ? "http://10.0.2.2:80" : "http://localhost:80";

export const STORAGE_KEYS = {
  SERVER_URL: "@defectloupe_server_url",
  ACCESS_TOKEN: "@defectloupe_access_token",
  REFRESH_TOKEN: "@defectloupe_refresh_token",
  USER: "@defectloupe_user",
  INSPECTOR: "@defectloupe_inspector",
  OFFLINE_QUEUE: "@defectloupe_offline_queue",
};

let currentBaseUrl = DEFAULT_SERVER_URL;
let onUnauthorizedCallback: (() => void) | null = null;

export const setUnauthorizedCallback = (cb: (() => void) | null) => {
  onUnauthorizedCallback = cb;
};

export const getBaseUrl = () => currentBaseUrl;

export const setBaseUrl = async (url: string) => {
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith("/")) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  currentBaseUrl = cleanUrl;
  apiClient.defaults.baseURL = cleanUrl;
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SERVER_URL, cleanUrl);
  } catch {}
};

// Initialize server URL from storage
AsyncStorage.getItem(STORAGE_KEYS.SERVER_URL).then((savedUrl) => {
  if (savedUrl) {
    currentBaseUrl = savedUrl;
    apiClient.defaults.baseURL = savedUrl;
  }
}).catch(() => {});

export const apiClient: AxiosInstance = axios.create({
  baseURL: currentBaseUrl,
  timeout: 25000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.Cookie = `access_token=${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const refreshResponse = await axios.post(
          `${currentBaseUrl}/auth/refresh`,
          { refresh_token: refreshToken },
          {
            headers: {
              Cookie: `refresh_token=${refreshToken}`,
            },
          }
        );

        const newAccessToken = refreshResponse.data?.access_token;
        const newRefreshToken = refreshResponse.data?.refresh_token;

        if (newAccessToken) {
          await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        }
        if (newRefreshToken) {
          await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
        }

        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr as Error);
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER,
          STORAGE_KEYS.INSPECTOR,
        ]);
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Normalize API errors
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
    }
    if (data?.message) return String(data.message);
    if (error.message) return error.message;
  }
  return String(error || "Unknown network error");
};

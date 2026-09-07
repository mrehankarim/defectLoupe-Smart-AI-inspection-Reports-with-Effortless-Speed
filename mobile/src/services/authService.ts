import { apiClient, STORAGE_KEYS, getBaseUrl } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

export interface InspectorProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  license_number?: string;
  inspector_type: string;
  company_id?: string;
}

export interface LoginResult {
  message: string;
  access_token?: string;
  refresh_token?: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  user?: UserProfile;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const response = await apiClient.post<LoginResult>("/auth/login", {
      email,
      password,
    });

    const data = response.data;

    // Check Set-Cookie headers if access_token not in body
    let token = data.access_token;
    let rToken = data.refresh_token;

    if (!token && response.headers["set-cookie"]) {
      const cookies = response.headers["set-cookie"];
      const cookieStr = Array.isArray(cookies) ? cookies.join(";") : String(cookies);
      const matchAccess = cookieStr.match(/access_token=([^;]+)/);
      const matchRefresh = cookieStr.match(/refresh_token=([^;]+)/);
      if (matchAccess) token = matchAccess[1];
      if (matchRefresh) rToken = matchRefresh[1];
    }

    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    }
    if (rToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, rToken);
    }

    // Fetch user & inspector info
    try {
      const meRes = await apiClient.get<UserProfile>("/auth/me");
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(meRes.data));
      data.user = meRes.data;
    } catch {}

    try {
      const inspRes = await apiClient.get<InspectorProfile>("/inspectors/me");
      await AsyncStorage.setItem(
        STORAGE_KEYS.INSPECTOR,
        JSON.stringify(inspRes.data)
      );
    } catch {}

    return data;
  },

  async register(payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    license_number?: string;
  }) {
    const response = await apiClient.post("/auth/register", payload);
    return response.data;
  },

  async getMe(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>("/auth/me");
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
    return response.data;
  },

  async getInspectorMe(): Promise<InspectorProfile> {
    const response = await apiClient.get<InspectorProfile>("/inspectors/me");
    await AsyncStorage.setItem(
      STORAGE_KEYS.INSPECTOR,
      JSON.stringify(response.data)
    );
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch {}
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
      STORAGE_KEYS.INSPECTOR,
    ]);
  },

  async checkServerHealth(): Promise<{ ok: boolean; message: string }> {
    try {
      // Hit the auth service root endpoint (routed by Traefik)
      const url = `${getBaseUrl()}/auth/`;
      const res = await axios.get(url, { timeout: 4000 });
      return { ok: res.status === 200, message: "Connected to DefectLoupe" };
    } catch (err: any) {
      // If we get any response (even 4xx), the server is reachable
      if (err.response) {
        return { ok: true, message: "Connected to DefectLoupe" };
      }
      return {
        ok: false,
        message: err.message || "Cannot reach server. Check IP & port.",
      };
    }
  },

  async seedDemo(): Promise<{ message: string }> {
    const response = await apiClient.post("/api/v1/demo/seed");
    return response.data;
  },
};

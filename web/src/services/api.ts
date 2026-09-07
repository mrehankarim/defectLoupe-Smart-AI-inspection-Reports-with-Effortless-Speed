let rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
if (rawBaseUrl && !rawBaseUrl.startsWith("http://") && !rawBaseUrl.startsWith("https://")) {
  if (!rawBaseUrl.includes(".") && !rawBaseUrl.includes("localhost")) {
    rawBaseUrl = `${rawBaseUrl}.onrender.com`;
  }
  rawBaseUrl = `https://${rawBaseUrl}`;
}
const BASE_URL = rawBaseUrl;

const TOKEN_KEY = "defectloupe_access_token";
const REFRESH_TOKEN_KEY = "defectloupe_refresh_token";

export function getStoredAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredTokens(accessToken: string, refreshToken?: string | null) {
  try {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch {
    // Ignore storage restrictions if in private/iframe
  }
}

export function clearStoredTokens() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Ignore
  }
}

export interface ApiError {
  status: number;
  detail: string;
}

let refreshPromise: Promise<boolean> | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function canRefresh(path: string) {
  return path === "/auth/me" || path === "/inspectors/me" || (!path.startsWith("/auth/") && !path.startsWith("/inspectors/"));
}

function getServiceBaseUrl(path: string): string {
  if (!BASE_URL.includes(".onrender.com")) {
    return BASE_URL;
  }

  const p = path.startsWith("/api/v1/") ? path.slice(7) : path;

  // 1. Auth service: /auth, /inspectors
  if (p.startsWith("/auth") || p.startsWith("/inspectors")) {
    return BASE_URL.replace(/defectloupe-[a-z0-9-]+/, "defectloupe-auth");
  }

  // 2. Media service: /photos, /observations, /transcriptions, /media
  if (
    p.startsWith("/photos") ||
    p.startsWith("/observations") ||
    p.startsWith("/transcriptions") ||
    p.includes("/media") ||
    p.includes("/photos") ||
    p.includes("/observations")
  ) {
    return BASE_URL.replace(/defectloupe-[a-z0-9-]+/, "defectloupe-media");
  }

  // 3. AI service: /rag, /reports, /analyze, /generate-report, /report/
  if (
    p.startsWith("/rag") ||
    p.startsWith("/reports") ||
    p.includes("/analyze") ||
    p.includes("/generate-report") ||
    p.includes("/report/")
  ) {
    return BASE_URL.replace(/defectloupe-[a-z0-9-]+/, "defectloupe-ai");
  }

  // 4. Core service: /clients, /properties, /inspections, /dashboard, /areas, /templates
  return BASE_URL.replace(/defectloupe-[a-z0-9-]+/, "defectloupe-core");
}

function buildUrl(path: string): string {
  const serviceBase = getServiceBaseUrl(path);
  if (path.startsWith("/auth/") || path.startsWith("/inspectors/") || path.startsWith("/auth")) {
    return `${serviceBase}${path}`;
  }
  if (path.startsWith("/api/v1/")) {
    return `${serviceBase}${path}`;
  }
  return `${serviceBase}/api/v1${path}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function formatErrorDetail(detail: unknown, fallback: string) {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const validationMessage = detail.find(
      (item): item is { msg: string } =>
        typeof item === "object" && item !== null && "msg" in item && typeof item.msg === "string",
    )?.msg;
    return validationMessage ?? fallback;
  }

  return fallback;
}

async function parseError(response: Response): Promise<ApiError> {
  const fallback = response.statusText;
  try {
    const error = (await response.json()) as { detail?: unknown };
    return { status: response.status, detail: formatErrorDetail(error.detail, fallback) };
  } catch {
    return { status: response.status, detail: fallback };
  }
}

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  const authBase = getServiceBaseUrl("/auth/refresh");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const currentAccess = getStoredAccessToken();
  if (currentAccess) {
    headers["Authorization"] = `Bearer ${currentAccess}`;
  }

  const response = await fetch(`${authBase}/auth/refresh`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
  });

  if (!response.ok) {
    clearStoredTokens();
    return false;
  }

  try {
    const data = (await response.json()) as { access_token?: string; refresh_token?: string };
    if (data?.access_token) {
      setStoredTokens(data.access_token, data.refresh_token);
    }
    return true;
  } catch {
    return true;
  }
}

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retryAfterRefresh = true,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = getStoredAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = buildUrl(path);
  const response = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && retryAfterRefresh && canRefresh(path)) {
    if (await refreshSession()) {
      return request<T>(method, path, body, false);
    }
    clearStoredTokens();
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return parseResponse<T>(response);
}

async function uploadRequest<T>(
  path: string,
  formData: FormData,
  retryAfterRefresh = true,
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getStoredAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = buildUrl(path);
  const response = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });

  if (response.status === 401 && retryAfterRefresh && canRefresh(path)) {
    if (await refreshSession()) {
      return uploadRequest<T>(path, formData, false);
    }
    clearStoredTokens();
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return parseResponse<T>(response);
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  upload: <T>(path: string, formData: FormData) => uploadRequest<T>(path, formData),
};

/** Build query string from params object, skipping null/undefined */
export function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)]),
  ).toString();
}

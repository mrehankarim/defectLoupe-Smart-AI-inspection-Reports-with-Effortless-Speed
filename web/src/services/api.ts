let rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
if (rawBaseUrl && !rawBaseUrl.startsWith("http://") && !rawBaseUrl.startsWith("https://")) {
  if (!rawBaseUrl.includes(".") && !rawBaseUrl.includes("localhost")) {
    rawBaseUrl = `${rawBaseUrl}.onrender.com`;
  }
  rawBaseUrl = `https://${rawBaseUrl}`;
}
const BASE_URL = rawBaseUrl;

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

function buildUrl(path: string): string {
  if (path.startsWith("/auth/") || path.startsWith("/inspectors/") || path.startsWith("/auth")) {
    return `${BASE_URL}${path}`;
  }
  if (path.startsWith("/api/v1/")) {
    return `${BASE_URL}${path}`;
  }
  return `${BASE_URL}/api/v1${path}`;
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
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    return false;
  }

  await response.text();
  return true;
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
  const url = buildUrl(path);
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (response.status === 401 && retryAfterRefresh && canRefresh(path)) {
    if (await refreshSession()) {
      return uploadRequest<T>(path, formData, false);
    }
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

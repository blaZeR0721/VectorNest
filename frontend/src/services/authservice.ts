import { API_URL } from "@/config/env";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthError {
  detail: string;
}

function saveTokens(tokens: TokenResponse) {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    if (Array.isArray(err.detail)) {
      throw new Error(
        err.detail
          .map((e: { msg: string }) => e.msg.replace(/^Value error,\s*/i, ""))
          .join(", ")
      );
    }
    throw new Error(err.detail || `Error: ${res.status}`);
  }
  return res.json();
}

export async function register(
  email: string,
  password: string
): Promise<{ message: string; user_id: string }> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function verifyEmail(
  email: string,
  otp: string
): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const tokens = await handleResponse<TokenResponse>(res);
  saveTokens(tokens);
  return tokens;
}

export async function resendOtp(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function login(
  email: string,
  password: string
): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const tokens = await handleResponse<TokenResponse>(res);
  saveTokens(tokens);
  return tokens;
}

export async function refreshTokens(): Promise<TokenResponse> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "x-refresh-token": refreshToken },
  });
  const tokens = await handleResponse<TokenResponse>(res);
  saveTokens(tokens);
  return tokens;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { "x-refresh-token": refreshToken },
    }).catch(() => {});
  }
  clearTokens();
}

export async function forgotPassword(
  email: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
}

export async function resetPassword(
  token: string,
  new_password: string,
  confirm_password: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password, confirm_password }),
  });
  return handleResponse(res);
}

let refreshPromise: Promise<TokenResponse> | null = null;

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshTokens().finally(() => (refreshPromise = null));
      }
      await refreshPromise;
      const newToken = getAccessToken();
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(url, { ...options, headers });
    } catch {
      clearTokens();
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  return res;
}

export async function changePassword(
  old_password: string,
  new_password: string,
  confirm_password: string
) {
  const res = await authFetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ old_password, new_password, confirm_password }),
  });
  const tokens = await handleResponse<TokenResponse>(res);
  saveTokens(tokens);
  return tokens;
}

export async function getProfile() {
  const res = await authFetch(`${API_URL}/auth/profile`);
  return handleResponse<{ id: string; email: string }>(res);
}

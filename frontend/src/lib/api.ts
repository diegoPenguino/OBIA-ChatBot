/**
 * API client for the OBIA ChatBot backend.
 * All functions throw on error so callers can catch and display messages.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("obia_token");
}

export function setToken(token: string): void {
  localStorage.setItem("obia_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("obia_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface UserMe {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  is_admin: boolean;
  requests_used: number;
  max_requests: number;
  is_active: boolean;
}

export interface AskResponse {
  response: string;
  input_tokens: number;
  output_tokens: number;
  requests_remaining: number;
}

export interface AdminUser {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  is_admin: boolean;
  requests_used: number;
  max_requests: number;
  is_active: boolean;
  created_at: string | null;
}

export interface AdminLog {
  id: number;
  user_id: number;
  username: string;
  prompt: string;
  response: string;
  input_tokens: number;
  output_tokens: number;
  created_at: string | null;
}

// ── Auth ──────────────────────────────────────────────────────────────────

export async function login(
  username: string,
  password: string
): Promise<void> {
  const data = await request<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.access_token);
}

// ── User ──────────────────────────────────────────────────────────────────

export async function getMe(): Promise<UserMe> {
  return request<UserMe>("/me");
}

// ── Ask ───────────────────────────────────────────────────────────────────

export async function askQuestion(prompt: string): Promise<AskResponse> {
  return request<AskResponse>("/ask", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}

export interface HistoryItem {
  id: number;
  prompt: string;
  response: string;
  input_tokens: number;
  output_tokens: number;
  created_at: string;
}

export async function getHistory(): Promise<HistoryItem[]> {
  return request<HistoryItem[]>("/history");
}

// ── Admin ─────────────────────────────────────────────────────────────────

export async function getAdminUsers(): Promise<AdminUser[]> {
  return request<AdminUser[]>("/admin/users");
}

export async function getAdminLogs(
  limit = 100,
  offset = 0,
  userId?: number
): Promise<AdminLog[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  if (userId !== undefined) {
    params.set("user_id", userId.toString());
  }
  return request<AdminLog[]>(`/admin/logs?${params}`);
}

export async function toggleUser(
  userId: number,
  isActive: boolean
): Promise<AdminUser> {
  return request<AdminUser>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function createAdminUser(userData: {
  username: string;
  first_name?: string;
  last_name?: string;
  password: string;
  max_requests: number;
}): Promise<AdminUser> {
  return request<AdminUser>("/admin/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function updateUserRequests(
  userId: number,
  maxRequests: number
): Promise<AdminUser> {
  return request<AdminUser>(`/admin/users/${userId}/requests`, {
    method: "PATCH",
    body: JSON.stringify({ max_requests: maxRequests }),
  });
}

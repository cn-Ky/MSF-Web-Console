export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
export const WS_BASE = API_BASE.replace(/^http/, "ws");

const TOKEN_KEY = "msf-console-token";
const USER_KEY = "msf-console-user";

export interface AuthUser {
  username: string;
  role: "admin" | "operator";
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Giris basarisiz");
  }
  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  const user: AuthUser = { username: data.username, role: data.role };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface SessionSummary {
  id: string;
  label: string;
  owner: string;
  createdAt: number;
  status: "running" | "exited";
}

async function handleAuthError(res: Response) {
  if (res.status === 401) {
    clearAuth();
    window.location.reload();
  }
}

export async function listSessions(): Promise<SessionSummary[]> {
  const res = await fetch(`${API_BASE}/api/sessions`, { headers: authHeaders() });
  if (!res.ok) {
    await handleAuthError(res);
    throw new Error("Oturumlar alinamadi");
  }
  return res.json();
}

export async function createSession(label?: string): Promise<SessionSummary> {
  const res = await fetch(`${API_BASE}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) {
    await handleAuthError(res);
    throw new Error("Oturum olusturulamadi");
  }
  return res.json();
}

export async function killSession(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/sessions/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 404) {
    await handleAuthError(res);
    throw new Error("Oturum sonlandirilamadi");
  }
}

// WebSocket URL'ine token'i query param olarak ekler (WS header gonderemez)
export function wsUrlFor(sessionId: string): string {
  const token = getToken() || "";
  return `${WS_BASE}/ws/${sessionId}?token=${encodeURIComponent(token)}`;
}

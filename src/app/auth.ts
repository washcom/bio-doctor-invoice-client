export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
};

const tokenKey = "biodoctor_auth_token";
const userKey = "biodoctor_auth_user";

export function getToken() {
  return localStorage.getItem(tokenKey) || "";
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(userKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser) {
  localStorage.setItem(tokenKey, token);
  localStorage.setItem(userKey, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
}

export function authHeaders(extra?: Record<string, string>): HeadersInit {
  const token = getToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

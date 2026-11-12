import { apiRequest, ApiError } from "./client";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "./config";
import type { AuthResponse, AuthUser } from "./types";

function saveSession(response: AuthResponse) {
  localStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

async function registerGuest(): Promise<AuthResponse> {
  const id = crypto.randomUUID().slice(0, 8);
  const email = `shopper-${id}@example.com`;
  const password = `Shop${id}!123`;
  const response = await apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  saveSession(response);
  localStorage.setItem(
    "stroyka-guest-credentials",
    JSON.stringify({ email, password }),
  );
  return response;
}

async function loginWithStoredGuest(): Promise<AuthResponse | null> {
  const raw = localStorage.getItem("stroyka-guest-credentials");
  if (!raw) return null;
  try {
    const { email, password } = JSON.parse(raw) as {
      email: string;
      password: string;
    };
    const response = await apiRequest<AuthResponse>("/api/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    saveSession(response);
    return response;
  } catch {
    return null;
  }
}

/** Ensures a customer JWT exists so cart endpoints work without a login screen. */
export async function ensureCustomerSession(): Promise<AuthUser> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    try {
      await apiRequest("/api/cart", { method: "GET" });
      const user = getStoredUser();
      if (user) return user;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        // network/other: still try to recover session
      }
      clearSession();
    }
  }

  const loggedIn = await loginWithStoredGuest();
  if (loggedIn) return loggedIn.user;

  const registered = await registerGuest();
  return registered.user;
}

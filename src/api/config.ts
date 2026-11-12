export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export const AUTH_TOKEN_KEY = "stroyka-auth-token";
export const AUTH_USER_KEY = "stroyka-auth-user";

import api, {
  setAccessToken,
  clearAccessToken,
} from "./api";

/**
 * Login user
 */
export async function login(credentials) {
  const { data } = await api.post("/api/v1/auth/login", credentials);

  // Save access token in memory
  if (data?.data?.accessToken) {
    setAccessToken(data.data.accessToken);
  }

  return data.data;
}

/**
 * Register new user
 */
export async function register(userData) {
  const { data } = await api.post("/api/v1/auth/register", userData);

  return data.data;
}

/**
 * Logout user
 */
export async function logout() {
  try {
    await api.post("/api/v1/auth/logout");
  } finally {
    clearAccessToken();
  }
}

/**
 * Get currently logged-in user
 */
export async function getCurrentUser() {
  const { data } = await api.get("/api/v1/users/me");

  return data.data;
}

/**
 * Check if session is still valid.
 * api.js will automatically refresh the access token if needed.
 */
export async function restoreSession() {
  try {
    const user = await getCurrentUser();
    return user;
  } catch {
    clearAccessToken();
    return null;
  }
}
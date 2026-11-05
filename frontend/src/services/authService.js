import api, {
  setAccessToken,
  clearAccessToken,
  getAccessToken,
} from "./api";

/**
 * Decode JWT token to extract claims
 */
export function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const claims = JSON.parse(jsonPayload);
    return {
      id: claims.userId,
      role: claims.role,
      organizationId: claims.organizationId,
      email: claims.sub,
      exp: claims.exp
    };
  } catch (e) {
    console.error("Failed to decode JWT token", e);
    return null;
  }
}

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
 * Register new vendor
 */
export async function register(vendorData) {
  const { data } = await api.post("/api/v1/auth/vendor/register", vendorData);

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
 * Change user password
 */
export async function changePassword(passwordData) {
  const { data } = await api.post("/api/v1/auth/change-password", passwordData);
  return data;
}

/**
 * Get currently logged-in user
 */
export async function getCurrentUser() {
  const token = getAccessToken();
  if (token) {
    return decodeToken(token);
  }
  return null;
}

/**
 * Check if session is still valid.
 * Calls /refresh to fetch a new token using the HttpOnly cookie.
 */
export async function restoreSession() {
  try {
    // Call refresh endpoint to get a fresh access token
    const { data } = await api.post("/api/v1/auth/refresh", {});
    if (data?.data?.accessToken) {
      setAccessToken(data.data.accessToken);
      return decodeToken(data.data.accessToken);
    }
    return null;
  } catch {
    clearAccessToken();
    return null;
  }
}

/**
 * Get currently authenticated user's complete profile
 */
export async function getSelfProfile() {
  const { data } = await api.get("/api/v1/auth/me");
  return data.data;
}

/**
 * Deactivate vendor account and log out
 */
export async function deactivateVendor() {
  try {
    const { data } = await api.delete("/api/v1/auth/me");
    return data;
  } finally {
    clearAccessToken();
  }
}

/**
 * Schedules a proactive silent token refresh ~60s before the access token expires.
 * @param {string} token - The current access token.
 * @param {Function} onRefreshed - Called with the new token string after a successful refresh.
 * @param {Function} onExpired - Called when the token is already expired or refresh fails.
 * @returns {number} The setTimeout timer ID (pass to clearTimeout to cancel).
 */
export function scheduleTokenRefresh(token, onRefreshed, onExpired) {
  const claims = decodeToken(token);
  if (!claims || !claims.exp) {
    onExpired();
    return null;
  }

  const delay = claims.exp * 1000 - Date.now() - 60_000; // fire 60s before expiry

  if (delay <= 0) {
    onExpired();
    return null;
  }

  const timerId = setTimeout(async () => {
    try {
      const response = await api.post('/api/v1/auth/refresh');
      const newToken = response.data.data.accessToken;
      setAccessToken(newToken);
      onRefreshed(newToken);
    } catch {
      onExpired();
    }
  }, delay);

  return timerId;
}

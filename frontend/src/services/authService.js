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
      email: claims.sub
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
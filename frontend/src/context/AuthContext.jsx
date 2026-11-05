import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  login as loginService,
  logout as logoutService,
  restoreSession,
  decodeToken,
  getSelfProfile,
  scheduleTokenRefresh,
} from "../services/authService";
import { getAccessToken } from "../services/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const refreshTimerRef = useRef(null);

  /**
   * Schedules a proactive silent refresh for the given token.
   * Clears any existing timer first to avoid duplicate timers.
   */
  const scheduleRefresh = useCallback(
    (token) => {
      clearTimeout(refreshTimerRef.current);

      refreshTimerRef.current = scheduleTokenRefresh(
        token,
        // onRefreshed — new token issued; reschedule for the next cycle
        (newToken) => {
          scheduleRefresh(newToken);
        },
        // onExpired — token expired or refresh failed; force logout
        () => {
          clearTimeout(refreshTimerRef.current);
          setUser(null);
          navigate("/login");
        }
      );
    },
    [navigate]
  );

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = await restoreSession();

        if (currentUser) {
          // Fetch full profile to get fullName not available in JWT claims
          let fullName = null;
          try {
            const profile = await getSelfProfile();
            fullName = profile?.fullName ?? null;
          } catch {
            // non-fatal
          }
          setUser({ ...currentUser, fullName });

          // Schedule proactive refresh using the token stored by restoreSession
          const token = getAccessToken();
          if (token) {
            scheduleRefresh(token);
          }
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [scheduleRefresh]);

  const login = async (credentials) => {
    const data = await loginService(credentials);

    const decoded = data?.accessToken ? decodeToken(data.accessToken) : null;

    // Fetch full profile to get fullName and other details not in the JWT
    let fullName = null;
    try {
      const profile = await getSelfProfile();
      fullName = profile?.fullName ?? null;
    } catch {
      // non-fatal — proceed without fullName
    }

    const userObject = {
      id: data.userId,
      role: data.role,
      organizationId: data.organizationId,
      email: decoded?.email || credentials.email,
      fullName,
    };

    setUser(userObject);

    // Schedule proactive refresh for the newly issued token
    if (data?.accessToken) {
      scheduleRefresh(data.accessToken);
    }

    return data;
  };

  const logout = async () => {
    clearTimeout(refreshTimerRef.current);
    try {
      await logoutService();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

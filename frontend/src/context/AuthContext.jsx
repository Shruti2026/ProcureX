import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  login as loginService,
  logout as logoutService,
  restoreSession,
  decodeToken,
  getSelfProfile,
} from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

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
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

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

    return data;
  };

  const logout = async () => {
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
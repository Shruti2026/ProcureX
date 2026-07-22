import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  login as loginService,
  logout as logoutService,
  restoreSession,
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
          setUser(currentUser);
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

    setUser(data.user);

    navigate("/dashboard");

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
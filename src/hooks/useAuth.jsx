import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import { API_ENDPOINTS } from "../api/contracts";
import {
  AUTH_CHANGED_EVENT,
  AUTH_FORBIDDEN_EVENT,
  AUTH_SESSION_KEY,
  clearAuthSession,
  getStoredAuth,
  saveAuthSession,
  updateStoredUser,
} from "../api/authSession";
import { expandPermissions } from "../auth/permissions";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => getStoredAuth());
  const [status, setStatus] = useState(session ? "validating" : "anonymous");
  const [error, setError] = useState(null);

  const refreshUser = useCallback(async () => {
    if (!getStoredAuth()?.accessToken) return null;
    try {
      const envelope = await apiRequest(API_ENDPOINTS.me);
      const nextSession = updateStoredUser(envelope.data);
      setSession(nextSession);
      setStatus("authenticated");
      setError(null);
      return envelope.data;
    } catch (refreshError) {
      setError(refreshError);
      if (refreshError?.status !== 401) setStatus("authenticated");
      throw refreshError;
    }
  }, []);

  useEffect(() => {
    const syncSession = () => {
      const nextSession = getStoredAuth();
      setSession(nextSession);
      setStatus(nextSession ? "authenticated" : "anonymous");
    };
    const handleStorage = (event) => {
      if (event.key === AUTH_SESSION_KEY) syncSession();
    };
    const handleAuthChange = () => syncSession();
    const handleForbidden = () => {
      refreshUser().catch(() => {});
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    window.addEventListener(AUTH_FORBIDDEN_EVENT, handleForbidden);
    if (getStoredAuth()?.accessToken) refreshUser().catch(() => {});
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
      window.removeEventListener(AUTH_FORBIDDEN_EVENT, handleForbidden);
    };
  }, [refreshUser]);

  const login = useCallback(async ({ username, password }) => {
    setStatus("authenticating");
    setError(null);

    try {
      const envelope = await apiRequest(API_ENDPOINTS.login, {
        method: "POST",
        body: { username, password },
        skipAuth: true,
      });
      const nextSession = saveAuthSession(envelope.data);
      setSession(nextSession);
      setStatus("authenticated");
      return nextSession;
    } catch (loginError) {
      setStatus("anonymous");
      setError(loginError);
      throw loginError;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getStoredAuth()?.accessToken) {
        await apiRequest(API_ENDPOINTS.logout, { method: "POST" });
      }
    } catch (logoutError) {
      // Local logout must still succeed if the token is already expired or revoked.
    } finally {
      clearAuthSession("logout");
      setSession(null);
      setStatus("anonymous");
      setError(null);
    }
  }, []);

  const value = useMemo(
    () => {
      const rawPermissions = session?.user?.permissions || [];
      const permissions = expandPermissions(rawPermissions);
      return {
        session,
        token: session?.accessToken || "",
        user: session?.user || null,
        isAuthenticated: Boolean(session?.accessToken),
        status,
        error,
        rawPermissions,
        permissions,
        hasPermission: (permission) => Boolean(permissions.includes(permission)),
        hasAnyPermission: (requiredPermissions) => requiredPermissions.some((permission) => permissions.includes(permission)),
        login,
        logout,
        refreshUser,
      };
    },
    [error, login, logout, refreshUser, session, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

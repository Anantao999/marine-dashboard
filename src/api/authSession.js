export const AUTH_SESSION_KEY = "marine_dashboard_auth";
export const AUTH_CHANGED_EVENT = "marine-auth-session-change";
export const AUTH_FORBIDDEN_EVENT = "marine-auth-forbidden";

const dispatchAuthChange = (session, reason) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { session, reason } }));
};

export const getStoredAuth = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session?.accessToken) return null;
    if (session.expiresAt && Date.now() >= session.expiresAt) {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }

    return session;
  } catch (error) {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
};

export const getAuthToken = () => getStoredAuth()?.accessToken || "";

export const saveAuthSession = (loginData) => {
  const expiresIn = Number(loginData?.expiresIn || 0);
  const session = {
    accessToken: loginData?.accessToken || "",
    expiresIn,
    expiresAt: expiresIn > 0 ? Date.now() + expiresIn * 1000 : null,
    user: loginData?.user || null,
    savedAt: Date.now(),
  };

  if (!session.accessToken) {
    throw new Error("Login response did not include accessToken");
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  dispatchAuthChange(session, "login");
  return session;
};

export const updateStoredUser = (user) => {
  const session = getStoredAuth();
  if (!session?.accessToken) return null;

  const nextSession = { ...session, user };
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));
  dispatchAuthChange(nextSession, "user-refresh");
  return nextSession;
};

export const clearAuthSession = (reason = "logout") => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  dispatchAuthChange(null, reason);
};

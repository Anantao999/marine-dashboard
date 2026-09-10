import { apiRequest, buildApiPath } from "./client";
import { API_ENDPOINTS } from "./contracts";

export const listUsers = (query) => apiRequest(API_ENDPOINTS.users, { query });
export const getUser = (userId) => apiRequest(buildApiPath(API_ENDPOINTS.user, { userId }));
export const createUser = (body) => apiRequest(API_ENDPOINTS.users, { method: "POST", body });
export const updateUser = (userId, body) =>
  apiRequest(buildApiPath(API_ENDPOINTS.user, { userId }), { method: "PATCH", body });
export const resetUserPassword = (userId, newPassword) =>
  apiRequest(buildApiPath(API_ENDPOINTS.resetUserPassword, { userId }), {
    method: "POST",
    body: { newPassword },
  });

export const listRoles = () => apiRequest(API_ENDPOINTS.roles);
export const createRole = (body) => apiRequest(API_ENDPOINTS.roles, { method: "POST", body });
export const updateRole = (roleCode, body) =>
  apiRequest(buildApiPath(API_ENDPOINTS.role, { roleCode }), { method: "PATCH", body });
export const deleteRole = (roleCode) =>
  apiRequest(buildApiPath(API_ENDPOINTS.role, { roleCode }), { method: "DELETE" });
export const listPermissions = () => apiRequest(API_ENDPOINTS.permissions);

export const changeOwnPassword = (body) =>
  apiRequest(API_ENDPOINTS.changePassword, { method: "POST", body });

export const API_VERSION = "v1";

export const API_ENDPOINTS = {
  login: "/auth/login",
  logout: "/auth/logout",
  me: "/auth/me",
  changePassword: "/auth/change-password",
  users: "/users",
  user: "/users/{userId}",
  resetUserPassword: "/users/{userId}/reset-password",
  roles: "/roles",
  role: "/roles/{roleCode}",
  permissions: "/permissions",
  snapshot: "/dashboard/snapshot",
  vessel: "/vessels/{vesselId}/realtime",
  engines: "/vessels/{vesselId}/engines",
  navigation: "/vessels/{vesselId}/navigation",
  alarms: "/vessels/{vesselId}/alarms",
  acknowledgeAlarm: "/vessels/{vesselId}/alarms/{alarmId}/acknowledge",
  resetAlarm: "/alarms/{alarmId}/reset",
  systemStatus: "/vessels/{vesselId}/system-status",
  trend: "/vessels/{vesselId}/trend",
  trendTags: "/trends/tags",
  trendQuery: "/trends/query",
  pointTableVersions: "/vessels/{vesselId}/devices/{deviceId}/point-table-versions",
  pointTable: "/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}",
  savePointTableDraft: "/vessels/{vesselId}/devices/{deviceId}/point-tables",
  pointTest: "/vessels/{vesselId}/devices/{deviceId}/point-test",
  validatePointTable: "/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/validate",
  applyPointTable: "/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/apply",
  rollbackPointTable: "/vessels/{vesselId}/devices/{deviceId}/point-tables/{version}/rollback",
};

export const DEFAULT_API_CONTEXT = {
  vesselId: "MHM-TierIII-Demo",
  deviceId: "MAIN_GENSET_1",
  version: "v2",
};

export const POINT_RUNTIME_FIELDS = [
  "pointCode",
  "pointName",
  "pointType",
  "functionCode",
  "registerAddress",
  "bitIndex",
  "dataType",
  "registerCount",
  "scale",
  "offset",
  "unit",
  "byteOrder",
];

export const normalizeApiEnvelope = (payload) => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload;
  }

  return {
    success: true,
    code: "OK",
    message: "",
    serverTime: new Date().toISOString(),
    data: payload,
    errors: [],
  };
};

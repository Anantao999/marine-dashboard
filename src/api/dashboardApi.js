import { apiRequest, buildApiPath } from "./client";
import { API_ENDPOINTS } from "./contracts";
import { useApiResource } from "./useApiResource";

export const useBackendSnapshot = (options = {}) =>
  useApiResource(API_ENDPOINTS.snapshot, options);

export const useBackendVesselData = (vesselId, options = {}) =>
  useApiResource(buildApiPath(API_ENDPOINTS.vessel, { vesselId }), options);

export const useBackendEngineData = (vesselId, options = {}) =>
  useApiResource(buildApiPath(API_ENDPOINTS.engines, { vesselId }), options);

export const useBackendNavigationData = (vesselId, options = {}) =>
  useApiResource(buildApiPath(API_ENDPOINTS.navigation, { vesselId }), options);

export const useBackendAlarmsData = (vesselId, options = {}) =>
  useApiResource(buildApiPath(API_ENDPOINTS.alarms, { vesselId }), options);

export const useBackendSystemStatus = (vesselId, options = {}) =>
  useApiResource(buildApiPath(API_ENDPOINTS.systemStatus, { vesselId }), options);

export const useBackendTrendData = (vesselId, options = {}) =>
  useApiResource(buildApiPath(API_ENDPOINTS.trend, { vesselId }), options);

export const useBackendPointTable = (vesselId, deviceId, version, options = {}) =>
  useApiResource(buildApiPath(API_ENDPOINTS.pointTable, { vesselId, deviceId, version }), options);

export const acknowledgeBackendAlarm = (vesselId, alarmId) =>
  apiRequest(buildApiPath(API_ENDPOINTS.acknowledgeAlarm, { vesselId, alarmId }), {
    method: "POST",
    body: {
      acknowledgedAt: new Date().toISOString(),
    },
  });

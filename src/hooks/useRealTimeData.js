import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiRequest, buildApiPath } from "../api/client";
import { API_ENDPOINTS, DEFAULT_API_CONTEXT } from "../api/contracts";
import {
  buildHistoricalRawFields,
  ENGINE_ID_TO_HISTORICAL_PREFIX,
  getFirstHistoricalFieldValue,
  getHistoricalFieldValue,
  hasHistoricalEngineFields,
  HISTORICAL_CYLINDER_SUFFIXES,
  HISTORICAL_ENGINE_PREFIXES,
  HISTORICAL_FIELD_SUFFIXES,
} from "../api/historicalFields";
import { useApiResource } from "../api/useApiResource";

const DATA_SOURCE = (process.env.REACT_APP_DATA_SOURCE || "backend").toLowerCase();
const USE_BACKEND = DATA_SOURCE !== "mock";
const USE_DEMO_FLUCTUATION = (process.env.REACT_APP_DEMO_FLUCTUATION || "false").toLowerCase() === "true";
const USE_BACKEND_API = USE_BACKEND && !USE_DEMO_FLUCTUATION;
const USE_LOCAL_DEMO_DATA = !USE_BACKEND_API;
const DEFAULT_VESSEL_ID = process.env.REACT_APP_VESSEL_ID || DEFAULT_API_CONTEXT.vesselId;
const BACKEND_READY_ENDPOINTS = new Set([
  API_ENDPOINTS.vessel,
  API_ENDPOINTS.engines,
  API_ENDPOINTS.alarms,
  API_ENDPOINTS.acknowledgeAlarm,
  API_ENDPOINTS.systemStatus,
  API_ENDPOINTS.trend,
]);
const pendingBackendRoute = (data, endpoint) => ({
  ...data,
  timestamp: "",
  quality: "UNWIRED",
  source: "PENDING_BACKEND_ROUTE",
  backendRoute: endpoint,
  backendRouteReady: false,
});

// 生成随机范围内的数值
const randomInRange = (min, max, decimals = 1) => {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
};

// 生成随机变化（基于当前值的微小波动）
const fluctuate = (current, min, max, volatility = 0.02) => {
  const change = current * volatility * (Math.random() - 0.5) * 2;
  let newValue = current + change;
  newValue = Math.max(min, Math.min(max, newValue));
  return parseFloat(newValue.toFixed(1));
};

// 初始船舶数据
const initialVesselData = {
  position: { lat: 31.503, lon: 122.105 },
  heading: 35,
  pitch: -0.3,
  cog: 30.3,
  sog: 10.0,
  wind: { direction: "NW", speed: 18 },
  draft: { fore: -0.7, aft: 0 },
  fuelConsumption: 3555.8,
  temperature: 28,
  humidity: 65,
};

// 初始引擎数据
const initialEngineData = {
  diesel1: {
    rpm: 850,
    power: 12450,
    load: 88,
    fuelRate: 285.5,
    torque: 142.3,
    thrust: 2850,
    exhaustTemp: 412.5,
    coolantTemp: 78,
    lubeOilTemp: 85,
    oilPressure: 4.2,
    coolantPressure: 3.2,
    seaWaterPressure: 2.8,
    fuelRailPressure: 7.6,
    fuelDeliveryPressure: 4.5,
    intakeManifoldPressureLB: 2.4,
    intakeManifoldPressureRB: 2.6,
    intakeManifoldTemperatureLBF: 45,
    intakeManifoldTemperatureLBR: 47,
    intakeManifoldTemperatureRBF: 46,
    intakeManifoldTemperatureRBR: 48,
    exhaustTempLB: 425,
    exhaustTempRB: 421,
    crankcasePressure: 12.1,
    fuelTemperature: 38,
    barometricPressure: 1.0,
    lubeOilFilterDifferentialPressure: 0.52,
    mainControlPower: 24,
    backupControlPower: 24,
    expansionTankLowAlarm: false,
    lowLubOilShutdownBelow1500: false,
    lowLubOilShutdownAbove1500: false,
    highCoolantTemperatureShutdown: false,
    fuelLeakageAlarm: false,
    overspeedShutdown: false,
    localEmergencyStop: false,
    remoteEmergencyStop: false,
    turboSpeed: 18.2,
    cylinders: [438, 425, 418, 432, 420, 408, 445, 416, 422, 410, 430, 428, 415, 420, 422, 418],
    status: "running",
    alerts: [],
  },
  diesel2: {
    rpm: 820,
    power: 11800,
    load: 82,
    fuelRate: 270.2,
    torque: 138.5,
    thrust: 2720,
    exhaustTemp: 405.8,
    coolantTemp: 76,
    lubeOilTemp: 83,
    oilPressure: 4.0,
    coolantPressure: 3.1,
    seaWaterPressure: 2.7,
    fuelRailPressure: 7.4,
    fuelDeliveryPressure: 4.4,
    intakeManifoldPressureLB: 2.3,
    intakeManifoldPressureRB: 2.5,
    intakeManifoldTemperatureLBF: 44,
    intakeManifoldTemperatureLBR: 46,
    intakeManifoldTemperatureRBF: 45,
    intakeManifoldTemperatureRBR: 47,
    exhaustTempLB: 412,
    exhaustTempRB: 411,
    crankcasePressure: 11.8,
    fuelTemperature: 37,
    barometricPressure: 1.0,
    lubeOilFilterDifferentialPressure: 0.5,
    mainControlPower: 24,
    backupControlPower: 24,
    expansionTankLowAlarm: false,
    lowLubOilShutdownBelow1500: false,
    lowLubOilShutdownAbove1500: false,
    highCoolantTemperatureShutdown: false,
    fuelLeakageAlarm: false,
    overspeedShutdown: false,
    localEmergencyStop: false,
    remoteEmergencyStop: false,
    turboSpeed: 17.5,
    cylinders: [420, 412, 405, 418, 415, 400, 430, 408, 415, 405, 422, 418, 408, 415, 418, 412],
    status: "running",
    alerts: [],
  },
  aux1: {
    rpm: 1500,
    power: 3200,
    load: 75,
    fuelRate: 720,
    frequency: 50.0,
    voltage: 400,
    current: 462,
    powerFactor: 0.85,
    exhaustTemp: 385.2,
    coolantTemp: 74,
    lubeOilTemp: 81,
    oilPressure: 3.8,
    coolantPressure: 3.0,
    seaWaterPressure: 2.6,
    fuelRailPressure: 7.1,
    fuelDeliveryPressure: 4.2,
    intakeManifoldPressureLB: 2.2,
    intakeManifoldPressureRB: 2.4,
    intakeManifoldTemperatureLBF: 43,
    intakeManifoldTemperatureLBR: 45,
    intakeManifoldTemperatureRBF: 44,
    intakeManifoldTemperatureRBR: 46,
    exhaustTempLB: 384,
    exhaustTempRB: 383,
    crankcasePressure: 10.8,
    fuelTemperature: 36,
    barometricPressure: 1.0,
    lubeOilFilterDifferentialPressure: 0.47,
    mainControlPower: 24,
    backupControlPower: 24,
    expansionTankLowAlarm: false,
    lowLubOilShutdownBelow1500: false,
    lowLubOilShutdownAbove1500: false,
    highCoolantTemperatureShutdown: false,
    fuelLeakageAlarm: false,
    overspeedShutdown: false,
    localEmergencyStop: false,
    remoteEmergencyStop: false,
    cylinders: [392, 385, 378, 388, 382, 372, 395, 380, 385, 378, 390, 386, 378, 385, 388, 382],
    status: "running",
    alerts: [],
  },
  aux2: {
    rpm: 1500,
    power: 2800,
    load: 65,
    fuelRate: 630,
    frequency: 50.1,
    voltage: 398,
    current: 405,
    powerFactor: 0.84,
    exhaustTemp: 378.5,
    coolantTemp: 73,
    lubeOilTemp: 80,
    oilPressure: 3.6,
    coolantPressure: 2.9,
    seaWaterPressure: 2.5,
    fuelRailPressure: 6.9,
    fuelDeliveryPressure: 4.1,
    intakeManifoldPressureLB: 2.1,
    intakeManifoldPressureRB: 2.3,
    intakeManifoldTemperatureLBF: 42,
    intakeManifoldTemperatureLBR: 44,
    intakeManifoldTemperatureRBF: 43,
    intakeManifoldTemperatureRBR: 45,
    exhaustTempLB: 377,
    exhaustTempRB: 376,
    crankcasePressure: 10.2,
    fuelTemperature: 35,
    barometricPressure: 1.0,
    lubeOilFilterDifferentialPressure: 0.44,
    mainControlPower: 24,
    backupControlPower: 24,
    expansionTankLowAlarm: false,
    lowLubOilShutdownBelow1500: false,
    lowLubOilShutdownAbove1500: false,
    highCoolantTemperatureShutdown: false,
    fuelLeakageAlarm: false,
    overspeedShutdown: false,
    localEmergencyStop: false,
    remoteEmergencyStop: false,
    cylinders: [380, 372, 365, 375, 370, 360, 382, 368, 372, 365, 378, 374, 365, 372, 375, 370],
    status: "standby",
    alerts: [],
  },
};

// 初始导航数据
const initialNavigationData = {
  route: {
    name: "Shanghai - Tokyo",
    eta: "2026-05-15 14:30",
    distanceRemaining: 1250,
    distanceTraveled: 380,
    waypoints: [
      { name: "Shanghai Port", lat: 31.23, lon: 121.47, status: "completed" },
      { name: "Waypoint Alpha", lat: 32.15, lon: 125.50, status: "completed" },
      { name: "East China Sea", lat: 32.80, lon: 127.00, status: "current" },
      { name: "Tokyo Bay", lat: 35.45, lon: 139.65, status: "upcoming" },
    ],
  },
  ais: [
    { mmsi: "123456789", name: "MV Pacific Star", type: "Cargo", distance: 2.5, bearing: 45, cog: 120, sog: 12.5, status: "underway" },
    { mmsi: "987654321", name: "MV Ocean Glory", type: "Tanker", distance: 4.2, bearing: 280, cog: 300, sog: 8.2, status: "anchored" },
    { mmsi: "456789123", name: "FV Sea Hunter", type: "Fishing", distance: 1.8, bearing: 160, cog: 45, sog: 6.5, status: "underway" },
  ],
  weather: {
    wind: { speed: 18, direction: "NW", gust: 22 },
    sea: { state: "Moderate", waveHeight: 1.5, swell: 0.8 },
    visibility: 10,
    pressure: 1015,
    trend: "steady",
  },
};

// 初始警报数据
const initialAlarmsData = {
  active: [
    { id: 1, time: "08:15:32", source: "Engine Room", type: "warning", priority: "high", message: "High bilge water level in engine room", acknowledged: false },
    { id: 2, time: "09:22:15", source: "Main Engine", type: "info", priority: "medium", message: "Scheduled maintenance reminder", acknowledged: false },
    { id: 3, time: "07:45:00", source: "Navigation", type: "info", priority: "low", message: "AIS target update", acknowledged: true },
  ],
  history: [
    { id: 101, time: "06:30:00", source: "Diesel Gen 1", type: "warning", priority: "high", message: "Oil pressure low warning", resolved: true, resolvedTime: "06:45:00" },
    { id: 102, time: "05:15:00", source: "Steering", type: "alarm", priority: "critical", message: "Steering system anomaly", resolved: true, resolvedTime: "05:20:00" },
    { id: 103, time: "04:00:00", source: "Fire System", type: "info", priority: "low", message: "Fire detector test completed", resolved: true, resolvedTime: "04:01:00" },
    { id: 104, time: "03:30:00", source: "Navigation", type: "warning", priority: "medium", message: "Course deviation detected", resolved: true, resolvedTime: "03:35:00" },
  ],
};

const initialSystemStatus = {
  systemHealth: 95,
  cpuLoad: 30,
  memoryUsage: 45,
  networkLatency: 12,
  sensors: {
    gps: true,
    gyro: true,
    radar: true,
    ais: true,
    depth: true,
    speed: true,
  },
};

const emptyValue = (value) => {
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (typeof value === "string") return "";
  if (Array.isArray(value)) return value.map(emptyValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, emptyValue(item)]));
  }
  return value;
};

const emptyVesselData = { ...emptyValue(initialVesselData), quality: "UNKNOWN", source: "" };
const emptyEngineData = Object.fromEntries(
  Object.entries(initialEngineData).map(([key, engine]) => [key, { ...emptyValue(engine), status: "unknown", alerts: [] }])
);
const emptySystemStatus = emptyValue(initialSystemStatus);

const ALARMS_QUERY = { includeHistory: true };
const ENGINE_META_KEYS = new Set(["timestamp", "quality", "source"]);

const readValue = (value, fallback) => {
  if (value && typeof value === "object" && "value" in value) return value.value;
  return value ?? fallback;
};

const readObjectValue = (source, keys, fallback) => {
  if (!source || typeof source !== "object") return fallback;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      return readValue(source[key], fallback);
    }
  }
  return fallback;
};

const readNumeric = (value, fallback = 0) => {
  const raw = readValue(value, undefined);
  if (raw === undefined || raw === null || raw === "") return fallback;
  const number = Number(raw);
  return Number.isFinite(number) ? number : fallback;
};

const readBoolean = (value, fallback = false) => {
  const raw = readValue(value, undefined);
  if (raw === undefined || raw === null || raw === "") return fallback;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw !== 0;
  if (typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (["true", "yes", "y", "1", "active", "alarm"].includes(normalized)) return true;
    if (["false", "no", "n", "0", "inactive", "normal"].includes(normalized)) return false;
  }
  return Boolean(raw);
};

const average = (items) => {
  const valid = items.map(Number).filter((item) => Number.isFinite(item));
  if (!valid.length) return 0;
  return valid.reduce((sum, item) => sum + item, 0) / valid.length;
};

const readHistoricalValue = (source, prefix, suffix, fallback, aliases = []) => {
  const exact = getHistoricalFieldValue(source, prefix, suffix);
  if (exact !== undefined) return readValue(exact, fallback);
  return readObjectValue(source, aliases, fallback);
};

const readHistoricalNumber = (source, prefix, suffix, fallback, aliases = []) =>
  readNumeric(readHistoricalValue(source, prefix, suffix, fallback, aliases), fallback);

const readHistoricalBoolean = (source, prefix, suffix, fallback, aliases = []) =>
  readBoolean(readHistoricalValue(source, prefix, suffix, fallback, aliases), fallback);

const normalizeVesselData = (data) => {
  const source = data || {};
  const fallback = USE_BACKEND_API ? emptyVesselData : initialVesselData;
  const position = source.position || {};
  const wind = source.wind || {};
  const draft = source.draft || {};

  return {
    ...fallback,
    ...source,
    timestamp: source.timestamp,
    quality: source.quality,
    source: source.source,
    position: {
      ...fallback.position,
      ...position,
      lat: readValue(position.lat, fallback.position.lat),
      lon: readValue(position.lon, fallback.position.lon),
    },
    heading: readValue(source.heading, fallback.heading),
    pitch: readValue(source.pitch, fallback.pitch),
    roll: readValue(source.roll, source.draft?.fore ?? 0),
    cog: readValue(source.cog, fallback.cog),
    sog: readValue(source.sog, fallback.sog),
    wind: {
      ...fallback.wind,
      ...wind,
      speed: readValue(wind.speed, fallback.wind.speed),
      direction: readValue(wind.direction, fallback.wind.direction),
    },
    draft: {
      ...fallback.draft,
      ...draft,
      fore: readValue(draft.fore, fallback.draft.fore),
      aft: readValue(draft.aft, fallback.draft.aft),
    },
    fuelConsumption: readValue(source.fuelConsumption, fallback.fuelConsumption),
    temperature: readValue(source.temperature, fallback.temperature),
    humidity: readValue(source.humidity, fallback.humidity),
  };
};

const normalizeEngine = (engine = {}, fallback = {}, historicalPrefix = "CMMS01") => {
  const source = engine && typeof engine === "object" ? engine : {};
  const historicalCylinders = HISTORICAL_CYLINDER_SUFFIXES.map((suffix) => {
    const exact = getHistoricalFieldValue(source, historicalPrefix, suffix);
    return exact === undefined ? undefined : readNumeric(exact, undefined);
  });
  const fallbackCylinders = source.cylinders || source.cylinderTemperatures || fallback.cylinders || [];
  const cylinders = historicalCylinders.some((value) => value !== undefined)
    ? historicalCylinders.map((value, index) => readNumeric(value, readNumeric(fallbackCylinders[index], 0)))
    : fallbackCylinders.map((temp) => readNumeric(temp, 0));
  const safeCylinders = cylinders.length ? cylinders : [];
  const exhaustTempLB = readHistoricalNumber(
    source,
    historicalPrefix,
    HISTORICAL_FIELD_SUFFIXES.exhaustTempLB,
    readNumeric(source.exhaustTempLB, average(safeCylinders.slice(0, 8))),
    ["exhaustTempLB"]
  );
  const exhaustTempRB = readHistoricalNumber(
    source,
    historicalPrefix,
    HISTORICAL_FIELD_SUFFIXES.exhaustTempRB,
    readNumeric(source.exhaustTempRB, average(safeCylinders.slice(8, 16))),
    ["exhaustTempRB"]
  );
  const exhaustTemp = readNumeric(
    readObjectValue(source, ["exhaustTemp", "temperature"], undefined),
    average([exhaustTempLB, exhaustTempRB]) || average(safeCylinders)
  );
  const rpm = readHistoricalNumber(
    source,
    historicalPrefix,
    HISTORICAL_FIELD_SUFFIXES.engineSpeed,
    fallback.rpm ?? 0,
    ["rpm", "engineSpeed"]
  );
  const status = source.status || (rpm > 0 ? "running" : fallback.status || "standby");

  return {
    ...fallback,
    ...source,
    timestamp: readHistoricalValue(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.sourceTag,
      source.timestamp || fallback.timestamp
    ),
    historicalSource: historicalPrefix,
    rawFields: {
      ...(source.rawFields || {}),
      ...buildHistoricalRawFields(source, historicalPrefix),
    },
    rpm,
    engineSpeed: rpm,
    power: readValue(source.power, fallback.power ?? 0),
    load: readValue(source.load, fallback.load ?? 0),
    fuelRate: readValue(source.fuelRate, fallback.fuelRate ?? 0),
    torque: readValue(source.torque, fallback.torque ?? 0),
    thrust: readValue(source.thrust, fallback.thrust ?? 0),
    exhaustTemp,
    coolantTemp: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.coolantTemperature,
      fallback.coolantTemp ?? 0,
      ["coolantTemp", "coolantTemperature"]
    ),
    lubeOilTemp: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.lubricatingOilTemperature,
      fallback.lubeOilTemp ?? fallback.lubricatingOilTemperature ?? 0,
      ["lubeOilTemp", "lubricatingOilTemperature"]
    ),
    oilPressure: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.lubeOilPress,
      fallback.oilPressure ?? 0,
      ["oilPressure", "lubeOilPress", "lubeOilPressure"]
    ),
    lubeOilPress: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.lubeOilPress,
      fallback.oilPressure ?? 0,
      ["lubeOilPress", "oilPressure", "lubeOilPressure"]
    ),
    coolantPressure: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.coolantPressure,
      fallback.coolantPressure ?? 0,
      ["coolantPressure"]
    ),
    seaWaterPressure: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.seaWaterPressure,
      fallback.seaWaterPressure ?? 0,
      ["seaWaterPressure"]
    ),
    expansionTankLowAlarm: readHistoricalBoolean(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.expansionTankLowAlarm,
      fallback.expansionTankLowAlarm ?? false,
      ["expansionTankLowAlarm"]
    ),
    fuelRailPressure: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.fuelRailPressure,
      fallback.fuelRailPressure ?? 0,
      ["fuelRailPressure"]
    ),
    fuelDeliveryPressure: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.fuelDeliveryPressure,
      fallback.fuelDeliveryPressure ?? fallback.fuelPressure ?? 0,
      ["fuelDeliveryPressure", "fuelPressure"]
    ),
    fuelPressure: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.fuelDeliveryPressure,
      fallback.fuelPressure ?? fallback.fuelDeliveryPressure ?? 0,
      ["fuelPressure", "fuelDeliveryPressure"]
    ),
    intakeManifoldPressureLB: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.intakeManifoldPressureLB,
      fallback.intakeManifoldPressureLB ?? 0,
      ["intakeManifoldPressureLB"]
    ),
    intakeManifoldPressureRB: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.intakeManifoldPressureRB,
      fallback.intakeManifoldPressureRB ?? 0,
      ["intakeManifoldPressureRB"]
    ),
    intakeManifoldTemperatureLBF: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.intakeManifoldTemperatureLBF,
      fallback.intakeManifoldTemperatureLBF ?? 0,
      ["intakeManifoldTemperatureLBF"]
    ),
    intakeManifoldTemperatureLBR: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.intakeManifoldTemperatureLBR,
      fallback.intakeManifoldTemperatureLBR ?? 0,
      ["intakeManifoldTemperatureLBR"]
    ),
    intakeManifoldTemperatureRBF: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.intakeManifoldTemperatureRBF,
      fallback.intakeManifoldTemperatureRBF ?? 0,
      ["intakeManifoldTemperatureRBF"]
    ),
    intakeManifoldTemperatureRBR: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.intakeManifoldTemperatureRBR,
      fallback.intakeManifoldTemperatureRBR ?? 0,
      ["intakeManifoldTemperatureRBR"]
    ),
    exhaustTempLB,
    exhaustTempRB,
    crankcasePressure: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.crankcasePressure,
      fallback.crankcasePressure ?? 0,
      ["crankcasePressure"]
    ),
    fuelTemperature: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.fuelTemperature,
      fallback.fuelTemperature ?? fallback.fuelTemp ?? 0,
      ["fuelTemperature", "fuelTemp"]
    ),
    fuelTemp: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.fuelTemperature,
      fallback.fuelTemp ?? fallback.fuelTemperature ?? 0,
      ["fuelTemp", "fuelTemperature"]
    ),
    barometricPressure: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.barometricPressure,
      fallback.barometricPressure ?? 0,
      ["barometricPressure"]
    ),
    lubeOilFilterDifferentialPressure: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.lubeOilFilterDifferentialPressure,
      fallback.lubeOilFilterDifferentialPressure ?? 0,
      ["lubeOilFilterDifferentialPressure"]
    ),
    mainControlPower: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.mainControlPower,
      fallback.mainControlPower ?? 0,
      ["mainControlPower"]
    ),
    backupControlPower: readHistoricalNumber(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.backupControlPower,
      fallback.backupControlPower ?? 0,
      ["backupControlPower"]
    ),
    lowLubOilShutdownBelow1500: readHistoricalBoolean(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.lowLubOilShutdownBelow1500,
      fallback.lowLubOilShutdownBelow1500 ?? false,
      ["lowLubOilShutdownBelow1500"]
    ),
    lowLubOilShutdownAbove1500: readHistoricalBoolean(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.lowLubOilShutdownAbove1500,
      fallback.lowLubOilShutdownAbove1500 ?? false,
      ["lowLubOilShutdownAbove1500"]
    ),
    highCoolantTemperatureShutdown: readHistoricalBoolean(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.highCoolantTemperatureShutdown,
      fallback.highCoolantTemperatureShutdown ?? false,
      ["highCoolantTemperatureShutdown"]
    ),
    fuelLeakageAlarm: readHistoricalBoolean(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.fuelLeakageAlarm,
      fallback.fuelLeakageAlarm ?? false,
      ["fuelLeakageAlarm"]
    ),
    overspeedShutdown: readHistoricalBoolean(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.overspeedShutdown,
      fallback.overspeedShutdown ?? false,
      ["overspeedShutdown"]
    ),
    localEmergencyStop: readHistoricalBoolean(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.localEmergencyStop,
      fallback.localEmergencyStop ?? false,
      ["localEmergencyStop"]
    ),
    remoteEmergencyStop: readHistoricalBoolean(
      source,
      historicalPrefix,
      HISTORICAL_FIELD_SUFFIXES.remoteEmergencyStop,
      fallback.remoteEmergencyStop ?? false,
      ["remoteEmergencyStop"]
    ),
    turboSpeed: readValue(source.turboSpeed, fallback.turboSpeed ?? 0),
    voltage: readValue(source.voltage, fallback.voltage ?? 400),
    current: readValue(source.current, fallback.current ?? 450),
    powerFactor: readValue(source.powerFactor, fallback.powerFactor ?? 0.84),
    cylinders: safeCylinders,
    status,
    alerts: source.alerts || fallback.alerts || [],
  };
};

const normalizeEngineData = (data) => {
  const source = data?.engines || data || {};
  const normalized = Object.keys(initialEngineData).reduce((acc, key) => {
    const historicalPrefix = ENGINE_ID_TO_HISTORICAL_PREFIX[key];
    const sourceEngine =
      source[key] ||
      source[historicalPrefix] ||
      (hasHistoricalEngineFields(source, historicalPrefix) ? source : {});
    acc[key] = normalizeEngine(sourceEngine, USE_BACKEND_API ? emptyEngineData[key] : initialEngineData[key], historicalPrefix);
    return acc;
  }, {});

  Object.keys(source)
    .filter((key) => !ENGINE_META_KEYS.has(key))
    .filter((key) => !Object.prototype.hasOwnProperty.call(normalized, key))
    .filter((key) => !HISTORICAL_ENGINE_PREFIXES.includes(key))
    .filter((key) => source[key] && typeof source[key] === "object")
    .forEach((key) => {
      const historicalPrefix = ENGINE_ID_TO_HISTORICAL_PREFIX[key] || "CMMS01";
      normalized[key] = normalizeEngine(source[key], (USE_BACKEND_API ? emptyEngineData[key] : initialEngineData[key]) || {}, historicalPrefix);
    });

  return {
    ...normalized,
    __meta: {
      timestamp: data?.timestamp,
      quality: data?.quality,
      source: data?.source,
    },
  };
};

const normalizeNavigationData = (data) => ({
  ...initialNavigationData,
  ...(data || {}),
  route: {
    ...initialNavigationData.route,
    ...(data?.route || {}),
  },
  ais: data?.ais || initialNavigationData.ais,
  weather: {
    ...initialNavigationData.weather,
    ...(data?.weather || {}),
    wind: {
      ...initialNavigationData.weather.wind,
      ...(data?.weather?.wind || {}),
    },
    sea: {
      ...initialNavigationData.weather.sea,
      ...(data?.weather?.sea || {}),
    },
  },
});

const normalizeAlarm = (alarm) => ({
  id: alarm.id || alarm.alarmId || alarm.pointCode || `${alarm.source}-${alarm.time}`,
  time: alarm.time || alarm.timestamp || alarm.occurredAt || "",
  source: alarm.source || alarm.deviceName || alarm.deviceGroup || "",
  sourceZh: alarm.sourceZh || alarm.sourceCn || alarm.deviceNameZh || "",
  sourceEn: alarm.sourceEn || alarm.deviceNameEn || "",
  pointCode: alarm.pointCode,
  type: alarm.type || alarm.level || "info",
  priority: alarm.priority || alarm.severity || "low",
  message: alarm.message || alarm.displayNameZh || alarm.pointName || alarm.pointCode || "",
  messageZh: alarm.messageZh || alarm.messageCn || alarm.displayNameZh || "",
  messageEn: alarm.messageEn || alarm.displayNameEn || "",
  acknowledged: Boolean(alarm.acknowledged || alarm.ackAt || alarm.status === "ACKNOWLEDGED"),
  resolved: Boolean(alarm.resolved || alarm.resetAt || alarm.status === "RESET"),
  resolvedTime: alarm.resolvedTime || alarm.resolvedAt,
});

const normalizeAlarmsData = (data) => {
  const source = data?.alarms || data || {};
  return {
    timestamp: source.timestamp || data?.timestamp,
    active: (source.active || []).map(normalizeAlarm),
    history: (source.history || []).map(normalizeAlarm),
  };
};

const normalizeSystemStatus = (data) => ({
  ...(USE_BACKEND_API ? emptySystemStatus : initialSystemStatus),
  ...(data || {}),
  sensors: {
    ...(USE_BACKEND_API ? emptySystemStatus.sensors : initialSystemStatus.sensors),
    ...(data?.sensors || {}),
  },
});

const readTrendHistoricalNumber = (point, suffix, fallback, aliases = []) => {
  const preferredPrefix =
    point.historicalSource ||
    point.sourcePrefix ||
    ENGINE_ID_TO_HISTORICAL_PREFIX[point.engineId] ||
    "CMMS01";
  const exact = getFirstHistoricalFieldValue(point, suffix, preferredPrefix);
  if (exact !== undefined) return readNumeric(exact, fallback);
  return readNumeric(readObjectValue(point, aliases, undefined), fallback);
};

const normalizeTrendPoint = (point) => {
  const cylinderValues = HISTORICAL_CYLINDER_SUFFIXES
    .map((suffix) => getFirstHistoricalFieldValue(point, suffix, point.historicalSource || "CMMS01"))
    .filter((value) => value !== undefined)
    .map((value) => readNumeric(value, 0));
  const exhaustTempLB = readTrendHistoricalNumber(
    point,
    HISTORICAL_FIELD_SUFFIXES.exhaustTempLB,
    undefined,
    ["exhaustTempLB"]
  );
  const exhaustTempRB = readTrendHistoricalNumber(
    point,
    HISTORICAL_FIELD_SUFFIXES.exhaustTempRB,
    undefined,
    ["exhaustTempRB"]
  );
  const derivedExhaustTemp =
    average([exhaustTempLB, exhaustTempRB].filter((value) => value !== undefined)) ||
    average(cylinderValues);

  return {
    ...point,
    time: point.time ? new Date(point.time) : new Date(point.timestamp || point.Source_Tag),
    rpm: readTrendHistoricalNumber(point, HISTORICAL_FIELD_SUFFIXES.engineSpeed, point.rpm ?? 0, ["rpm", "engineSpeed"]),
    temperature: readNumeric(point.temperature, readNumeric(point.exhaustTemp, derivedExhaustTemp)),
    exhaustTemp: readNumeric(point.exhaustTemp, derivedExhaustTemp),
    pressure: readTrendHistoricalNumber(point, HISTORICAL_FIELD_SUFFIXES.lubeOilPress, point.pressure ?? 0, ["pressure", "lubeOilPressure", "oilPressure"]),
    lubeOilPressure: readTrendHistoricalNumber(point, HISTORICAL_FIELD_SUFFIXES.lubeOilPress, point.lubeOilPressure ?? point.oilPressure ?? 0, ["lubeOilPressure", "oilPressure"]),
    coolantTemp: readTrendHistoricalNumber(point, HISTORICAL_FIELD_SUFFIXES.coolantTemperature, point.coolantTemp ?? 0, ["coolantTemp", "coolantTemperature"]),
    lubeOilTemp: readTrendHistoricalNumber(point, HISTORICAL_FIELD_SUFFIXES.lubricatingOilTemperature, point.lubeOilTemp ?? 0, ["lubeOilTemp", "lubricatingOilTemperature"]),
    fuelPressure: readTrendHistoricalNumber(point, HISTORICAL_FIELD_SUFFIXES.fuelDeliveryPressure, point.fuelPressure ?? point.fuelDeliveryPressure ?? 0, ["fuelPressure", "fuelDeliveryPressure"]),
    fuelTemp: readTrendHistoricalNumber(point, HISTORICAL_FIELD_SUFFIXES.fuelTemperature, point.fuelTemp ?? point.fuelTemperature ?? 0, ["fuelTemp", "fuelTemperature"]),
  };
};

const normalizeTrendPoints = (data) =>
  (data?.points || data || []).map(normalizeTrendPoint);

const useBackendResource = (endpoint, intervalMs, initialData, transform, options = {}) => {
  const { enabled = true, ...resourceOptions } = options;
  const endpointReady = BACKEND_READY_ENDPOINTS.has(endpoint);

  return useApiResource(endpointReady ? buildApiPath(endpoint, { vesselId: DEFAULT_VESSEL_ID }) : "", {
    enabled: USE_BACKEND_API && endpointReady && enabled,
    intervalMs,
    initialData: USE_BACKEND_API ? null : initialData,
    transform,
    ...resourceOptions,
  });
};

const resourceState = (resource) => ({
  status: resource.status,
  loading: resource.loading,
  refreshing: resource.refreshing,
  online: resource.online,
  error: resource.error?.message || "",
  reload: resource.reload,
});

// 添加平滑滤波处理
const applySmoothing = (currentValue, newValue, filterCoefficient) => {
  if (filterCoefficient === 0) return newValue;
  return currentValue * filterCoefficient + newValue * (1 - filterCoefficient);
};

// 自定义钩子：实时船舶数据
export const useVesselData = (updateInterval = 1000, config = {}) => {
  const { smoothingFilter = 0.3 } = config;
  const [data, setData] = useState(initialVesselData);
  const prevDataRef = useRef(initialVesselData);
  const backendResource = useBackendResource(
    API_ENDPOINTS.vessel,
    updateInterval,
    initialVesselData,
    normalizeVesselData
  );

  useEffect(() => {
    if (!USE_LOCAL_DEMO_DATA) return undefined;

    const interval = setInterval(() => {
      setData((prev) => {
        const newData = {
          ...prev,
          position: {
            lat: fluctuate(prev.position.lat, 30.0, 35.0, 0.0001),
            lon: fluctuate(prev.position.lon, 120.0, 130.0, 0.0001),
          },
          heading: Math.round(fluctuate(prev.heading, 30, 40, 0.01)),
          pitch: fluctuate(prev.pitch, -1, 1, 0.1),
          cog: fluctuate(prev.cog, 25, 35, 0.02),
          sog: fluctuate(prev.sog, 8, 12, 0.03),
          wind: {
            direction: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.floor(Math.random() * 8)],
            speed: Math.round(fluctuate(prev.wind.speed, 10, 25, 0.05)),
          },
          draft: {
            fore: fluctuate(prev.draft.fore, -1.5, 0, 0.02),
            aft: fluctuate(prev.draft.aft, -0.5, 0.5, 0.02),
          },
          fuelConsumption: fluctuate(prev.fuelConsumption, 3000, 4000, 0.01),
          temperature: fluctuate(prev.temperature, 20, 35, 0.02),
          humidity: Math.round(fluctuate(prev.humidity, 50, 80, 0.01)),
        };

        // 应用平滑滤波
        const smoothedData = {
          ...newData,
          sog: applySmoothing(prevDataRef.current.sog, newData.sog, smoothingFilter),
          heading: applySmoothing(prevDataRef.current.heading, newData.heading, smoothingFilter),
          fuelConsumption: applySmoothing(prevDataRef.current.fuelConsumption, newData.fuelConsumption, smoothingFilter),
        };

        prevDataRef.current = smoothedData;
        return smoothedData;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, smoothingFilter]);

  return USE_BACKEND_API
    ? { ...(backendResource.data || pendingBackendRoute(emptyVesselData, API_ENDPOINTS.vessel)), __resource: resourceState(backendResource) }
    : data;
};

// 自定义钩子：实时引擎数据
export const useEngineData = (updateInterval = 2000, config = {}) => {
  const { rpmHighAlertLimit = 750, lubeOilPressureLowLimit = 2.5, faultInjectionEnabled = false } = config;
  const [engines, setEngines] = useState(initialEngineData);
  const faultIntervalRef = useRef(null);
  const backendResource = useBackendResource(
    API_ENDPOINTS.engines,
    updateInterval,
    initialEngineData,
    normalizeEngineData
  );

  // 故障注入效果
  useEffect(() => {
    if (!USE_LOCAL_DEMO_DATA) return undefined;

    if (faultInjectionEnabled) {
      // 强制生成紧急故障
      faultIntervalRef.current = setInterval(() => {
        setEngines((prev) => {
          const updated = { ...prev };
          // 强制使柴油机1进入故障状态
          if (updated.diesel1) {
            updated.diesel1 = {
              ...updated.diesel1,
              rpm: Math.floor(Math.random() * 200) + 800, // 异常转速
              oilPressure: Math.random() * 1.5 + 1.0, // 低油压
              status: "fault",
              alerts: [
                {
                  id: Date.now(),
                  type: "critical",
                  message: "EMERGENCY: Lube oil pressure critically low",
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          }
          return updated;
        });
      }, 3000);
    }

    return () => {
      if (faultIntervalRef.current) {
        clearInterval(faultIntervalRef.current);
      }
    };
  }, [faultInjectionEnabled]);

  useEffect(() => {
    if (!USE_LOCAL_DEMO_DATA) return undefined;

    const interval = setInterval(() => {
      setEngines((prev) => {
        const updated = { ...prev };

        // 更新每个气缸的温度
        Object.keys(updated).forEach((engineKey) => {
          const engine = updated[engineKey];
          const newOilPressure = engine.status === "running" 
            ? fluctuate(engine.oilPressure, 3.5, 5.0, 0.02) 
            : engine.oilPressure;

          // 检查报警阈值
          const alerts = [...(engine.alerts || [])];
          if (engineKey === "diesel1" && newOilPressure < lubeOilPressureLowLimit) {
            if (!alerts.find(a => a.message.includes("Lube oil pressure"))) {
              alerts.push({
                id: Date.now(),
                type: "warning",
                message: `Lube oil pressure below threshold: ${newOilPressure.toFixed(1)} Bar`,
                timestamp: new Date().toISOString(),
              });
            }
          }
          const newCylinders = engine.cylinders.map((temp) => Math.round(fluctuate(temp, 350, 500, 0.015)));
          const newExhaustTempLB = average(newCylinders.slice(0, 8));
          const newExhaustTempRB = average(newCylinders.slice(8, 16));

          updated[engineKey] = {
            ...engine,
            rpm: engine.status === "running" ? Math.round(fluctuate(engine.rpm, engine.rpm * 0.9, engine.rpm * 1.1, 0.01)) : engine.rpm,
            power: engine.status === "running" ? Math.round(fluctuate(engine.power, engine.power * 0.8, engine.power * 1.1, 0.02)) : engine.power,
            load: engine.status === "running" ? Math.round(fluctuate(engine.load, 60, 100, 0.02)) : engine.load,
            fuelRate: engine.status === "running" ? fluctuate(engine.fuelRate, engine.fuelRate * 0.8, engine.fuelRate * 1.1, 0.02) : engine.fuelRate,
            torque: engine.status === "running" ? fluctuate(engine.torque, engine.torque * 0.8, engine.torque * 1.1, 0.02) : engine.torque,
            exhaustTemp: engine.status === "running" ? fluctuate(engine.exhaustTemp, 350, 500, 0.01) : engine.exhaustTemp,
            coolantTemp: engine.status === "running" ? fluctuate(engine.coolantTemp, 70, 95, 0.01) : engine.coolantTemp,
            lubeOilTemp: engine.status === "running" ? fluctuate(engine.lubeOilTemp, 72, 98, 0.012) : engine.lubeOilTemp,
            oilPressure: newOilPressure,
            lubeOilPress: newOilPressure,
            coolantPressure: engine.status === "running" ? fluctuate(engine.coolantPressure, 2.4, 4.2, 0.012) : engine.coolantPressure,
            seaWaterPressure: engine.status === "running" ? fluctuate(engine.seaWaterPressure, 2.0, 3.8, 0.012) : engine.seaWaterPressure,
            fuelRailPressure: engine.status === "running" ? fluctuate(engine.fuelRailPressure, 6.2, 8.8, 0.015) : engine.fuelRailPressure,
            fuelDeliveryPressure: engine.status === "running" ? fluctuate(engine.fuelDeliveryPressure, 3.4, 5.4, 0.015) : engine.fuelDeliveryPressure,
            fuelPressure: engine.status === "running" ? fluctuate(engine.fuelPressure || engine.fuelDeliveryPressure, 3.4, 5.4, 0.015) : engine.fuelPressure,
            intakeManifoldPressureLB: engine.status === "running" ? fluctuate(engine.intakeManifoldPressureLB, 1.7, 3.1, 0.012) : engine.intakeManifoldPressureLB,
            intakeManifoldPressureRB: engine.status === "running" ? fluctuate(engine.intakeManifoldPressureRB, 1.7, 3.1, 0.012) : engine.intakeManifoldPressureRB,
            intakeManifoldTemperatureLBF: engine.status === "running" ? fluctuate(engine.intakeManifoldTemperatureLBF, 35, 60, 0.012) : engine.intakeManifoldTemperatureLBF,
            intakeManifoldTemperatureLBR: engine.status === "running" ? fluctuate(engine.intakeManifoldTemperatureLBR, 35, 60, 0.012) : engine.intakeManifoldTemperatureLBR,
            intakeManifoldTemperatureRBF: engine.status === "running" ? fluctuate(engine.intakeManifoldTemperatureRBF, 35, 60, 0.012) : engine.intakeManifoldTemperatureRBF,
            intakeManifoldTemperatureRBR: engine.status === "running" ? fluctuate(engine.intakeManifoldTemperatureRBR, 35, 60, 0.012) : engine.intakeManifoldTemperatureRBR,
            exhaustTempLB: engine.status === "running" ? newExhaustTempLB : engine.exhaustTempLB,
            exhaustTempRB: engine.status === "running" ? newExhaustTempRB : engine.exhaustTempRB,
            crankcasePressure: engine.status === "running" ? fluctuate(engine.crankcasePressure, 8, 16, 0.02) : engine.crankcasePressure,
            fuelTemperature: engine.status === "running" ? fluctuate(engine.fuelTemperature, 28, 52, 0.012) : engine.fuelTemperature,
            fuelTemp: engine.status === "running" ? fluctuate(engine.fuelTemp || engine.fuelTemperature, 28, 52, 0.012) : engine.fuelTemp,
            lubeOilFilterDifferentialPressure: engine.status === "running" ? fluctuate(engine.lubeOilFilterDifferentialPressure, 0.25, 0.9, 0.02) : engine.lubeOilFilterDifferentialPressure,
            turboSpeed: engine.status === "running" ? fluctuate(engine.turboSpeed, 15, 22, 0.02) : engine.turboSpeed,
            cylinders: newCylinders,
            alerts: alerts.slice(-3), // 保留最近3条报警
          };
        });

        return updated;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, lubeOilPressureLowLimit, rpmHighAlertLimit]);

  return USE_BACKEND_API
    ? { ...(backendResource.data || emptyEngineData), __resource: resourceState(backendResource) }
    : engines;
};

// 自定义钩子：实时导航数据
export const useNavigationData = (updateInterval = 3000) => {
  const [data, setData] = useState(initialNavigationData);
  const backendResource = useBackendResource(
    API_ENDPOINTS.navigation,
    updateInterval,
    initialNavigationData,
    normalizeNavigationData
  );

  useEffect(() => {
    if (!USE_LOCAL_DEMO_DATA) return undefined;

    const interval = setInterval(() => {
      setData((prev) => ({
        ...prev,
        route: {
          ...prev.route,
          distanceRemaining: Math.max(0, prev.route.distanceRemaining - 0.1),
          distanceTraveled: Math.min(1630, prev.route.distanceTraveled + 0.1),
        },
        weather: {
          ...prev.weather,
          wind: {
            speed: Math.round(fluctuate(prev.weather.wind.speed, 5, 30, 0.05)),
            direction: prev.weather.wind.direction,
            gust: Math.round(fluctuate(prev.weather.wind.gust, prev.weather.wind.speed, prev.weather.wind.speed + 10, 0.03)),
          },
          sea: {
            ...prev.weather.sea,
            waveHeight: fluctuate(prev.weather.sea.waveHeight, 0.5, 4.0, 0.05),
            swell: fluctuate(prev.weather.sea.swell, 0.2, 2.0, 0.05),
          },
          pressure: Math.round(fluctuate(prev.weather.pressure, 990, 1030, 0.001)),
        },
        ais: prev.ais.map((target) => ({
          ...target,
          distance: fluctuate(target.distance, 0.5, 10, 0.01),
          sog: fluctuate(target.sog, 0, 20, 0.02),
        })),
      }));
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return USE_BACKEND_API ? backendResource.data || pendingBackendRoute(initialNavigationData, API_ENDPOINTS.navigation) : data;
};

// 自定义钩子：实时警报数据
export const useAlarmsData = (updateInterval = 5000, language = "en") => {
  const [alarms, setAlarms] = useState(initialAlarmsData);
  const [acknowledgedIds, setAcknowledgedIds] = useState(() => new Set());
  const alarmIdRef = useRef(200);
  const backendResource = useBackendResource(
    API_ENDPOINTS.alarms,
    updateInterval,
    initialAlarmsData,
    normalizeAlarmsData,
    { query: ALARMS_QUERY }
  );

  const localizeSource = useCallback(
    (source) => {
      const map = {
        "Engine Room": "机舱",
        "Main Engine": "主机",
        "Diesel Gen 1": "柴油发电机 1",
        "Diesel Gen 2": "柴油发电机 2",
        Navigation: "导航",
        Steering: "舵机",
        "Fire System": "消防系统",
      };
      const reverseMap = Object.fromEntries(Object.entries(map).map(([en, zh]) => [zh, en]));
      return language === "zh" ? map[source] || source : reverseMap[source] || source;
    },
    [language]
  );

  const localizeMessage = useCallback(
    (message, alarm = {}) => {
      const messageMap = {
        "High bilge water level in engine room": "机舱舱底水位过高",
        "Scheduled maintenance reminder": "计划维护提醒",
        "AIS target update": "AIS 目标更新",
        "Oil pressure low warning": "油压过低警告",
        "Steering system anomaly": "舵机系统异常",
        "Fire detector test completed": "火灾探测器测试完成",
        "Course deviation detected": "检测到航向偏离",
        "Temperature sensor reading anomaly": "温度传感器读数异常",
        "Pressure below normal threshold": "压力低于正常阈值",
        "Scheduled system check required": "需要进行计划系统检查",
        "Fuel level low warning": "燃油液位低警告",
        "Communication timeout with sensor": "与传感器通信超时",
        "Low lube oil pressure alarm active": "滑油压力低告警触发",
        "Low lube oil pressure alarm": "滑油压力低报警",
        "High coolant temperature alarm active": "冷却水温度高告警触发",
        "High coolant temperature alarm": "冷却水温度高报警",
        "Fuel leakage alarm active": "燃油泄漏报警触发",
        "Fuel leakage alarm": "燃油泄漏报警",
        "Low coolant level alarm active": "冷却液位低报警触发",
        "Low coolant level alarm": "冷却液位低报警",
        "Common alarm active": "综合报警触发",
        "Common shutdown alarm active": "综合停机报警触发",
        "Overspeed shutdown alarm active": "超速停机报警触发",
        "Local emergency stop active": "本地急停触发",
        "Remote emergency stop active": "远程急停触发",
      };
      const reverseMap = Object.fromEntries(Object.entries(messageMap).map(([en, zh]) => [zh, en]));
      const pointCodeMessages = {
        GENSET_COMMON_ALARM: {
          zh: "综合报警触发",
          en: "Common alarm active",
        },
        GENSET_COMMON_SHUTDOWN_ALARM: {
          zh: "综合停机报警触发",
          en: "Common shutdown alarm active",
        },
        GENSET_COOLANT_LEVEL_LOW_ALARM: {
          zh: "冷却液位低报警触发",
          en: "Low coolant level alarm active",
        },
        GENSET_FUEL_LEAKAGE_ALARM: {
          zh: "燃油泄漏报警触发",
          en: "Fuel leakage alarm active",
        },
      };
      const pointMessage = pointCodeMessages[alarm.pointCode];
      if (language === "zh") {
        return alarm.messageZh || pointMessage?.zh || messageMap[message] || message;
      }
      return alarm.messageEn || pointMessage?.en || reverseMap[message] || message;
    },
    [language]
  );

  const localizeAlarm = useCallback(
    (alarm) => ({
      ...alarm,
      source: language === "zh"
        ? alarm.sourceZh || localizeSource(alarm.source)
        : alarm.sourceEn || localizeSource(alarm.source),
      message: localizeMessage(alarm.message, alarm),
    }),
    [language, localizeSource, localizeMessage]
  );

  const alarmSource = USE_BACKEND_API ? backendResource.data || { active: [], history: [] } : alarms;

  // expose localized alarms to consumers
  const localizedAlarms = {
    active: (alarmSource.active || []).map((alarm) =>
      localizeAlarm({
        ...alarm,
        acknowledged: alarm.acknowledged || acknowledgedIds.has(alarm.id),
      })
    ),
    history: (alarmSource.history || []).map(localizeAlarm),
  };

  useEffect(() => {
    if (!USE_LOCAL_DEMO_DATA) return undefined;

    const interval = setInterval(() => {
      setAlarms((prev) => {
        const newAlarms = { ...prev };

        // 随机生成新警报（低概率）
        if (Math.random() < 0.1) {
          const now = new Date();
          const newAlarm = {
            id: ++alarmIdRef.current,
            time: now.toLocaleTimeString(language === "zh" ? "zh-CN" : "en-US", { hour12: false }),
            source: ["Main Engine", "Diesel Gen 1", "Diesel Gen 2", "Navigation", "Steering"][Math.floor(Math.random() * 5)],
            type: ["info", "warning", "alarm"][Math.floor(Math.random() * 3)],
            priority: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)],
            message: [
              "Temperature sensor reading anomaly",
              "Pressure below normal threshold",
              "Scheduled system check required",
              "Fuel level low warning",
              "Communication timeout with sensor",
            ][Math.floor(Math.random() * 5)],
            acknowledged: false,
          };
          newAlarms.active = [newAlarm, ...newAlarms.active.slice(0, 9)];
        }

        // 随机标记已确认
        newAlarms.active = newAlarms.active.map((alarm) => {
          if (!alarm.acknowledged && Math.random() < 0.05) {
            return { ...alarm, acknowledged: true };
          }
          return alarm;
        });

        return newAlarms;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, language]);

  const acknowledgeAlarm = useCallback(async (id) => {
    if (USE_BACKEND_API) {
      setAcknowledgedIds((prev) => new Set(prev).add(id));
      try {
        await apiRequest(buildApiPath(API_ENDPOINTS.acknowledgeAlarm, { vesselId: DEFAULT_VESSEL_ID, alarmId: id }), {
          method: "POST",
          body: {
            acknowledgedAt: new Date().toISOString(),
          },
        });
      } catch (error) {
        setAcknowledgedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        throw error;
      }
      return;
    }

    setAlarms((prev) => ({
      ...prev,
      active: prev.active.map((alarm) =>
        alarm.id === id ? { ...alarm, acknowledged: true } : alarm
      ),
    }));
  }, []);

  const resetAlarm = useCallback(async (id) => {
    if (!USE_BACKEND_API) return;
    await apiRequest(buildApiPath(API_ENDPOINTS.resetAlarm, { alarmId: id }), { method: "POST" });
    await backendResource.reload();
  }, [backendResource]);

  return {
    alarms: localizedAlarms,
    acknowledgeAlarm,
    resetAlarm,
    resource: USE_BACKEND_API ? resourceState(backendResource) : { status: "success", online: true },
  };
};

// 自定义钩子：系统状态
export const useSystemStatus = (updateInterval = 1500) => {
  const [status, setStatus] = useState(initialSystemStatus);
  const backendResource = useBackendResource(
    API_ENDPOINTS.systemStatus,
    updateInterval,
    initialSystemStatus,
    normalizeSystemStatus
  );

  useEffect(() => {
    if (!USE_LOCAL_DEMO_DATA) return undefined;

    const interval = setInterval(() => {
      setStatus((prev) => ({
        ...prev,
        systemHealth: Math.round(fluctuate(prev.systemHealth, 90, 100, 0.005)),
        cpuLoad: Math.round(fluctuate(prev.cpuLoad, 15, 60, 0.05)),
        memoryUsage: Math.round(fluctuate(prev.memoryUsage, 30, 70, 0.02)),
        networkLatency: Math.round(fluctuate(prev.networkLatency, 5, 50, 0.1)),
      }));
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return USE_BACKEND_API
    ? { ...(backendResource.data || pendingBackendRoute(emptySystemStatus, API_ENDPOINTS.systemStatus)), __resource: resourceState(backendResource) }
    : status;
};

// 生成图表数据
export const useTrendData = (queryOrHours = 24, fallbackPoints = 100) => {
  const queryOptions =
    queryOrHours && typeof queryOrHours === "object"
      ? queryOrHours
      : { hours: queryOrHours, points: fallbackPoints };
  const {
    hours = 24,
    points = fallbackPoints,
    start,
    end,
    metrics = [],
    engineCode = "CMMS01",
  } = queryOptions;

  const [data, setData] = useState(() => {
    const now = Date.now();
    const start = now - hours * 3600000;
    return Array.from({ length: points }, (_, i) => ({
      time: new Date(start + i * (hours * 3600000 / Math.max(points - 1, 1))),
      temperature: randomInRange(400, 450),
      pressure: randomInRange(75, 90),
      rpm: randomInRange(800, 900),
      power: randomInRange(10000, 14000),
      lubeOilPressure: randomInRange(3.5, 4.8),
      coolantTemp: randomInRange(72, 88),
      lubeOilTemp: randomInRange(78, 92),
      fuelPressure: randomInRange(6.8, 8.4),
      fuelTemp: randomInRange(32, 46),
      load: randomInRange(60, 95),
      vesselSpeed: randomInRange(8, 16),
      windSpeed: randomInRange(5, 28),
    }));
  });
  const trendQuery = useMemo(
    () => {
      const query = {
        engineCode,
        points,
      };

      if (start && end) {
        query.start = start;
        query.end = end;
      } else {
        query.hours = hours;
      }

      if (Array.isArray(metrics) && metrics.length) {
        query.metrics = metrics.join(",");
      } else if (typeof metrics === "string" && metrics) {
        query.metrics = metrics;
      }

      return query;
    },
    [engineCode, end, hours, metrics, points, start]
  );
  const backendResource = useBackendResource(
    API_ENDPOINTS.trend,
    10000,
    data,
    normalizeTrendPoints,
    { query: trendQuery }
  );

  useEffect(() => {
    if (!USE_LOCAL_DEMO_DATA) return undefined;

    const interval = setInterval(() => {
      setData((prev) => {
        const newData = [...prev.slice(1)];
        const lastPoint = prev[prev.length - 1];
        newData.push({
          time: new Date(),
          temperature: fluctuate(lastPoint.temperature, 380, 480, 0.02),
          pressure: fluctuate(lastPoint.pressure, 70, 95, 0.01),
          rpm: Math.round(fluctuate(lastPoint.rpm, 750, 950, 0.01)),
          power: Math.round(fluctuate(lastPoint.power, 9000, 15000, 0.02)),
          lubeOilPressure: fluctuate(lastPoint.lubeOilPressure, 3.2, 5.0, 0.015),
          coolantTemp: fluctuate(lastPoint.coolantTemp, 68, 96, 0.012),
          lubeOilTemp: fluctuate(lastPoint.lubeOilTemp, 72, 98, 0.012),
          fuelPressure: fluctuate(lastPoint.fuelPressure, 6.2, 8.8, 0.015),
          fuelTemp: fluctuate(lastPoint.fuelTemp, 28, 52, 0.012),
          load: fluctuate(lastPoint.load, 45, 100, 0.02),
          vesselSpeed: fluctuate(lastPoint.vesselSpeed, 6, 18, 0.02),
          windSpeed: fluctuate(lastPoint.windSpeed, 0, 34, 0.025),
        });
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return USE_BACKEND_API ? backendResource.data || data : data;
};

const realTimeDataHooks = {
  useVesselData,
  useEngineData,
  useNavigationData,
  useAlarmsData,
  useSystemStatus,
  useTrendData,
};

export default realTimeDataHooks;

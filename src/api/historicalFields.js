export const HISTORICAL_ENGINE_PREFIXES = ["CMMS01", "CMMS02", "CMMS03", "CMMS04"];

export const ENGINE_ID_TO_HISTORICAL_PREFIX = {
  diesel1: "CMMS01",
  diesel2: "CMMS02",
  aux1: "CMMS03",
  aux2: "CMMS04",
  diesel3: "CMMS03",
  diesel4: "CMMS04",
};

export const HISTORICAL_PREFIX_TO_ENGINE_ID = {
  CMMS01: "diesel1",
  CMMS02: "diesel2",
  CMMS03: "aux1",
  CMMS04: "aux2",
};

export const HISTORICAL_FIELD_SUFFIXES = {
  sourceTag: "Source_Tag",
  lubeOilPress: "Lube Oil Press",
  coolantTemperature: "Coolant Temperature",
  lubricatingOilTemperature: "Lubricating Oil Temperature",
  coolantPressure: "Coolant Pressure",
  seaWaterPressure: "Sea Water Pressure",
  expansionTankLowAlarm: "Engine Expansion Tank Level Low Alarm",
  fuelRailPressure: "Fuel Rail Pressure",
  fuelDeliveryPressure: "Fuel CMMSlivery Pressure",
  intakeManifoldPressureLB: "Intake Manifold Pressure LB",
  intakeManifoldPressureRB: "Intake Manifold Pressure RB",
  intakeManifoldTemperatureLBF: "Intake Manifold Temperature LBF",
  intakeManifoldTemperatureLBR: "Intake Manifold Temperature LBR",
  intakeManifoldTemperatureRBF: "Intake Manifold Temperature RBF",
  intakeManifoldTemperatureRBR: "Intake Manifold Temperature RBR",
  exhaustTempLB: "Exhaust Temp. LB",
  exhaustTempRB: "Exhaust Temp. RB ",
  crankcasePressure: "Crankcase Pressure",
  fuelTemperature: "Fuel Temperature",
  barometricPressure: "Barometric Pressure",
  lubeOilFilterDifferentialPressure: "Lube Oil Filter Diferential Pressure",
  mainControlPower: "Main Control Power",
  backupControlPower: "Backup Control Power",
  lowLubOilShutdownBelow1500: "Low Lub. Oil Pressure Shutdown (below 1500rpm) ",
  lowLubOilShutdownAbove1500: "Low Lub. Oil Pressure Shutdown (above 1500rpm)",
  highCoolantTemperatureShutdown: "High Coolant Temperature Shutdown",
  fuelLeakageAlarm: "Fuel Leakage Alarm",
  engineSpeed: "Engine Speed",
  overspeedShutdown: "Overspeed Shutdown ",
  localEmergencyStop: "Local Emergency Stop",
  remoteEmergencyStop: "Remote Emergency Stop",
};

export const HISTORICAL_CYLINDER_SUFFIXES = Array.from(
  { length: 16 },
  (_, index) => `Exhaust Temp. CylinCMMSr ${index + 1}`
);

export const historicalFieldName = (prefix, suffix) =>
  suffix === HISTORICAL_FIELD_SUFFIXES.sourceTag ? suffix : `${prefix}_${suffix}`;

export const getHistoricalFieldValue = (source, prefix, suffix) => {
  if (!source || typeof source !== "object") return undefined;
  const exactKey = historicalFieldName(prefix, suffix);
  if (Object.prototype.hasOwnProperty.call(source, exactKey)) return source[exactKey];
  if (suffix === HISTORICAL_FIELD_SUFFIXES.sourceTag && Object.prototype.hasOwnProperty.call(source, suffix)) {
    return source[suffix];
  }
  return undefined;
};

export const getFirstHistoricalFieldValue = (source, suffix, preferredPrefix = "CMMS01") => {
  const prefixes = [
    preferredPrefix,
    ...HISTORICAL_ENGINE_PREFIXES.filter((prefix) => prefix !== preferredPrefix),
  ];

  for (const prefix of prefixes) {
    const value = getHistoricalFieldValue(source, prefix, suffix);
    if (value !== undefined) return value;
  }

  return undefined;
};

export const hasHistoricalEngineFields = (source, prefix) => {
  if (!source || typeof source !== "object") return false;
  return Object.values(HISTORICAL_FIELD_SUFFIXES).some((suffix) => {
    const key = historicalFieldName(prefix, suffix);
    return Object.prototype.hasOwnProperty.call(source, key);
  }) || HISTORICAL_CYLINDER_SUFFIXES.some((suffix) => {
    const key = historicalFieldName(prefix, suffix);
    return Object.prototype.hasOwnProperty.call(source, key);
  });
};

export const buildHistoricalRawFields = (source, prefix) => {
  const rawFields = {};
  if (!source || typeof source !== "object") return rawFields;

  Object.values(HISTORICAL_FIELD_SUFFIXES).forEach((suffix) => {
    const key = historicalFieldName(prefix, suffix);
    if (Object.prototype.hasOwnProperty.call(source, key)) rawFields[key] = source[key];
  });

  HISTORICAL_CYLINDER_SUFFIXES.forEach((suffix) => {
    const key = historicalFieldName(prefix, suffix);
    if (Object.prototype.hasOwnProperty.call(source, key)) rawFields[key] = source[key];
  });

  if (Object.prototype.hasOwnProperty.call(source, HISTORICAL_FIELD_SUFFIXES.sourceTag)) {
    rawFields[HISTORICAL_FIELD_SUFFIXES.sourceTag] = source[HISTORICAL_FIELD_SUFFIXES.sourceTag];
  }

  return rawFields;
};

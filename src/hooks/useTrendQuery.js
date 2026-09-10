import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../api/client";
import { API_ENDPOINTS } from "../api/contracts";

const MAX_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;
const TREND_DEMO_FALLBACK = (process.env.REACT_APP_TREND_DEMO_FALLBACK || "true").toLowerCase() !== "false";

const DEMO_TAGS = [
  { suffix: "ENGINE_SPEED", tagName: "发动机转速", tagNameEn: "Engine Speed", unit: "RPM" },
  { suffix: "LUBE_OIL_PRESS", tagName: "滑油压力", tagNameEn: "Lube Oil Press", unit: "bar" },
  { suffix: "COOLANT_TEMPERATURE", tagName: "冷却水温度", tagNameEn: "Coolant Temperature", unit: "°C" },
  { suffix: "EXHAUST_TEMP", tagName: "排气温度", tagNameEn: "Exhaust Temp", unit: "°C" },
  { suffix: "ELECTRIC_POWER", tagName: "电功率", tagNameEn: "Electric Power", unit: "kW" },
  { suffix: "GENERATOR_POWER", tagName: "发电机功率", tagNameEn: "Generator Power", unit: "kW" },
];

const normalizeCode = (value) => String(value || "").toUpperCase().replace(/[\s-]+/g, "_");
const matchesSuffix = (tagCode, suffix) => {
  const code = normalizeCode(tagCode);
  return code === suffix || code.endsWith(`_${suffix}`);
};

const demoTagsFor = (engineCode) => DEMO_TAGS.map((tag) => ({
  tagCode: `${engineCode}_${tag.suffix}`,
  tagName: tag.tagName,
  tagNameEn: tag.tagNameEn,
  unit: tag.unit,
  source: "demo-fallback",
}));

const withDemoTags = (engineCode, tags) => {
  if (!TREND_DEMO_FALLBACK) return Array.isArray(tags) ? tags : [];
  const current = Array.isArray(tags) ? tags : [];
  const missing = DEMO_TAGS
    .filter((tag) => !current.some((item) => matchesSuffix(item?.tagCode, tag.suffix)))
    .map((tag) => ({
      tagCode: `${engineCode}_${tag.suffix}`,
      tagName: tag.tagName,
      tagNameEn: tag.tagNameEn,
      unit: tag.unit,
      source: "demo-fallback",
    }));
  return [...current, ...missing];
};

const extractTagList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tags)) return data.tags;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const stableHash = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const demoProfileFor = (tagCode) => {
  if (matchesSuffix(tagCode, "ENGINE_SPEED")) return { base: 1500, amplitude: 42, min: 1350, max: 1640, decimals: 0 };
  if (matchesSuffix(tagCode, "LUBE_OIL_PRESS")) return { base: 4.1, amplitude: 0.22, min: 3.7, max: 4.6, decimals: 2 };
  if (matchesSuffix(tagCode, "COOLANT_TEMPERATURE")) return { base: 77, amplitude: 2.8, min: 70, max: 84, decimals: 1 };
  if (matchesSuffix(tagCode, "EXHAUST_TEMP")) return { base: 415, amplitude: 18, min: 370, max: 455, decimals: 1 };
  if (matchesSuffix(tagCode, "ELECTRIC_POWER") || matchesSuffix(tagCode, "GENERATOR_POWER")) return { base: 3200, amplitude: 260, min: 2500, max: 3700, decimals: 0 };
  return { base: 50, amplitude: 12, min: 0, max: 100, decimals: 1 };
};

const demoTagMetadata = (tagCode) => {
  const match = DEMO_TAGS.find((tag) => matchesSuffix(tagCode, tag.suffix));
  return match
    ? { tagName: match.tagName, tagNameEn: match.tagNameEn, unit: match.unit }
    : { tagName: tagCode, tagNameEn: tagCode, unit: "" };
};

const demoPointsFor = (engineCode, tagCode, startTime, endTime, interval) => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];

  const span = Math.max(1, end - start);
  const intervalMs = interval === "1m" ? 60 * 1000 : interval === "5m" ? 5 * 60 * 1000 : 60 * 60 * 1000;
  const count = Math.max(80, Math.min(160, Math.round(span / intervalMs) + 1));
  const profile = demoProfileFor(tagCode);
  const phase = (stableHash(`${engineCode}:${tagCode}`) % 628) / 100;
  const points = [];

  for (let index = 0; index < count; index += 1) {
    const timestamp = start + (span * index) / Math.max(count - 1, 1);
    const hours = (timestamp - start) / (60 * 60 * 1000);
    const wave = Math.sin(hours / 5.5 + phase) * 0.65 + Math.sin(hours / 18 + phase * 0.7) * 0.35;
    const value = Math.max(profile.min, Math.min(profile.max, profile.base + profile.amplitude * wave));
    points.push({
      timestamp: new Date(timestamp).toISOString(),
      value: Number(value.toFixed(profile.decimals)),
    });
  }
  return points;
};

const hasUsablePoints = (series) => (series?.points || []).some((point) => (
  Number.isFinite(new Date(point?.timestamp).getTime()) && Number.isFinite(Number(point?.value))
));

const fillMissingSeries = (series, { engineCode, tagCodes, startTime, endTime, interval }) => {
  if (!TREND_DEMO_FALLBACK) return series;
  const byTag = new Map(series.map((item) => [item.tagCode, item]));
  const selectedSeries = tagCodes.map((tagCode) => {
    const existing = byTag.get(tagCode);
    if (hasUsablePoints(existing)) return existing;
    const metadata = demoTagMetadata(tagCode);
    return {
      ...metadata,
      ...existing,
      tagCode,
      points: demoPointsFor(engineCode, tagCode, startTime, endTime, interval),
      source: "demo-fallback",
    };
  });
  const extraSeries = series.filter((item) => !tagCodes.includes(item.tagCode));
  return [...selectedSeries, ...extraSeries];
};

const splitTimeRange = (startTime, endTime) => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
  const windows = [];
  let cursor = start;
  while (cursor <= end) {
    const windowEnd = Math.min(cursor + MAX_WINDOW_MS, end);
    windows.push({ startTime: new Date(cursor).toISOString(), endTime: new Date(windowEnd).toISOString() });
    cursor = windowEnd + 1;
  }
  return windows;
};

const mergeSeries = (responses) => {
  const byTag = new Map();
  responses.forEach((response) => {
    (response?.data?.series || []).forEach((series) => {
      if (!byTag.has(series.tagCode)) {
        byTag.set(series.tagCode, { ...series, pointsByTime: new Map() });
      }
      const target = byTag.get(series.tagCode);
      (series.points || []).forEach((point) => {
        if (point?.timestamp && Number.isFinite(Number(point.value))) {
          target.pointsByTime.set(point.timestamp, point);
        }
      });
    });
  });
  return Array.from(byTag.values()).map(({ pointsByTime, ...series }) => ({
    ...series,
    points: Array.from(pointsByTime.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
  }));
};

export const useTrendTags = (engineCode) => {
  const [state, setState] = useState({ data: [], status: "loading", error: "" });
  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const envelope = await apiRequest(API_ENDPOINTS.trendTags, { query: { engineCode } });
      setState({ data: withDemoTags(engineCode, extractTagList(envelope.data)), status: "success", error: "" });
    } catch (error) {
      if (TREND_DEMO_FALLBACK) {
        setState({ data: demoTagsFor(engineCode), status: "success", error: "" });
        return;
      }
      setState({ data: [], status: "error", error: error.message });
    }
  }, [engineCode]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
};

export const useTrendSeries = ({ engineCode, tagCodes, startTime, endTime, interval = "1m" }) => {
  const [state, setState] = useState({ data: [], status: "idle", error: "" });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!engineCode || !tagCodes.length || !startTime || !endTime) {
      setState({ data: [], status: "idle", error: "" });
      return;
    }
    const windows = splitTimeRange(startTime, endTime);
    if (!windows.length) {
      setState({ data: [], status: "error", error: "日期范围无效" });
      return;
    }
    const currentRequest = ++requestId.current;
    setState((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const outcomes = await Promise.all(windows.map(async (window) => {
        try {
          return { response: await apiRequest(API_ENDPOINTS.trendQuery, {
            method: "POST",
            body: { engineCode, tagCodes, ...window, interval },
          }) };
        } catch (error) {
          return { error };
        }
      }));
      if (requestId.current !== currentRequest) return;
      const failedOutcome = outcomes.find((outcome) => outcome.error);
      if (failedOutcome && !TREND_DEMO_FALLBACK) throw failedOutcome.error;
      const merged = mergeSeries(outcomes.map((outcome) => outcome.response).filter(Boolean));
      setState({
        data: fillMissingSeries(merged, { engineCode, tagCodes, startTime, endTime, interval }),
        status: "success",
        error: "",
      });
    } catch (error) {
      if (requestId.current !== currentRequest) return;
      setState({ data: [], status: "error", error: error.message });
    }
  }, [endTime, engineCode, interval, startTime, tagCodes]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  return { ...state, reload: load };
};

export { splitTimeRange };

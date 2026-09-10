import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Settings2, SlidersHorizontal, X } from "lucide-react";
import { useLanguage } from "./hooks/useLanguage";
import { useTrendSeries, useTrendTags } from "./hooks/useTrendQuery";
import DataStateOverlay from "./components/DataStateOverlay";

const COLORS = ["#0058bc", "#0f766e", "#dc2626", "#7c3aed", "#ca8a04", "#0891b2", "#16a34a", "#db2777"];
const DEVICE_OPTIONS = [
  { key: "CMMS01", zh: "1 号柴油发电机", en: "Diesel Genset 1" },
  { key: "CMMS02", zh: "2 号柴油发电机", en: "Diesel Genset 2" },
  { key: "CMMS03", zh: "3 号柴油发电机", en: "Diesel Genset 3" },
  { key: "CMMS04", zh: "4 号柴油发电机", en: "Diesel Genset 4" },
];
const RANGE_OPTIONS = [
  { key: "week", days: 7, zh: "一星期", en: "Week" },
  { key: "month", days: 31, zh: "一个月", en: "Month" },
  { key: "quarter", days: 90, zh: "季度", en: "Quarter" },
  { key: "halfYear", days: 183, zh: "半年", en: "Half Year" },
  { key: "year", days: 365, zh: "一年", en: "Year" },
];

const pad2 = (value) => String(value).padStart(2, "0");
const dateValue = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const startOfDay = (value) => new Date(`${value}T00:00:00`).toISOString();
const endOfDay = (value) => new Date(`${value}T23:59:59`).toISOString();
const addDays = (value, days) => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days - 1);
  return dateValue(date);
};

const metricLabel = (tag, language) => language === "zh" ? tag.tagName || tag.tagNameEn || tag.tagCode : tag.tagNameEn || tag.tagName || tag.tagCode;
const deviceLabel = (deviceCode, language) => {
  const option = DEVICE_OPTIONS.find((item) => item.key === deviceCode);
  if (!option) return deviceCode;
  return language === "zh" ? option.zh : option.en;
};

const defaultMetricSelection = (tags) => {
  if (!tags.length) return [];
  const preferred = ["ENGINE_SPEED", "LUBE_OIL_PRESS", "COOLANT_TEMPERATURE", "EXHAUST_TEMP", "ELECTRIC_POWER", "GENERATOR_POWER"];
  const ordered = preferred.map((suffix) => tags.find((tag) => tag.tagCode.endsWith(suffix))?.tagCode).filter(Boolean);
  return [...new Set([...ordered, ...tags.slice(0, 4).map((tag) => tag.tagCode)])].slice(0, 3);
};

const MetricPicker = ({ tags, selected, onToggle, onClose, language }) => (
  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="shrink-0 border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-surface-container-lowest">
    <div className="mb-2 flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-200">
      <div className="flex min-w-0 items-center gap-3">
        <span>{language === "zh" ? "选择需要叠加显示的测点" : "Select overlaid metrics"}</span>
        <span className="shrink-0">{language === "zh" ? `已选 ${selected.length} 项` : `${selected.length} selected`}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
        title={language === "zh" ? "关闭参数选择" : "Close metric picker"}
        aria-label={language === "zh" ? "关闭参数选择" : "Close metric picker"}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
    <div className="grid max-h-32 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">
      {tags.map((tag, index) => {
        const checked = selected.includes(tag.tagCode);
        return (
          <button
            key={tag.tagCode}
            onClick={() => onToggle(tag.tagCode)}
            title={`${tag.tagCode}${tag.unit ? ` / ${tag.unit}` : ""}`}
            className={`flex min-h-10 items-center gap-2 rounded-md border px-2 text-left text-[10px] font-bold ${checked ? "border-transparent text-white" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-surface-container-low dark:text-slate-100"}`}
            style={checked ? { backgroundColor: COLORS[index % COLORS.length] } : {}}
          >
            <span className="min-w-0 flex-1 leading-4">{metricLabel(tag, language)}</span>
          </button>
        );
      })}
    </div>
  </motion.div>
);

const nearestPoint = (points, timestamp) => {
  if (!points.length) return null;
  return points.reduce((best, point) => Math.abs(new Date(point.timestamp).getTime() - timestamp) < Math.abs(new Date(best.timestamp).getTime() - timestamp) ? point : best, points[0]);
};

const TrendChart = ({ title, deviceCode, onDeviceChange, series, tagsByCode, selected, startTime, endTime, rangeLabel, onSettings, language }) => {
  const [hoverRatio, setHoverRatio] = useState(null);
  const width = 1000;
  const height = 300;
  const padding = 38;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const span = Math.max(1, end - start);
  const visible = selected.map((tagCode) => series.find((item) => item.tagCode === tagCode)).filter(Boolean);

  const paths = visible.map((item, index) => {
    const values = item.points.map((point) => Number(point.value)).filter(Number.isFinite);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 1;
    const range = max - min || 1;
    const path = item.points.map((point, pointIndex) => {
      const x = padding + ((new Date(point.timestamp).getTime() - start) / span) * (width - padding * 2);
      const y = padding + ((max - Number(point.value)) / range) * (height - padding * 2);
      return `${pointIndex ? "L" : "M"} ${x} ${y}`;
    }).join(" ");
    return { ...item, path, color: COLORS[selected.indexOf(item.tagCode) % COLORS.length], min, max };
  });

  const hoverTimestamp = hoverRatio === null ? null : start + hoverRatio * span;
  return (
    <section className="relative flex min-h-0 flex-1 flex-col border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-surface-container-lowest">
      <header className="mb-2 flex shrink-0 items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-on-surface">{title}</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-200">{rangeLabel} / {new Date(startTime).toLocaleDateString()} - {new Date(endTime).toLocaleDateString()}</p>
        </div>
        <div className="flex min-w-0 items-start gap-2">
          <select
            value={deviceCode}
            onChange={(event) => onDeviceChange(event.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-700 outline-none dark:border-white/10 dark:bg-surface-container-low dark:text-on-surface"
            title={language === "zh" ? "设备组" : "Device group"}
          >
            {DEVICE_OPTIONS.map((item) => (
              <option key={item.key} value={item.key}>{deviceLabel(item.key, language)}</option>
            ))}
          </select>
          <div className="flex max-w-[520px] flex-wrap justify-end gap-x-3 gap-y-1">
            {selected.map((code, index) => { const tag = tagsByCode[code]; return <span key={code} className="flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-200"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{tag ? metricLabel(tag, language) : code}</span>; })}
          </div>
          <button onClick={onSettings} className="rounded-md border border-slate-200 p-2 text-slate-500 hover:text-[#0058bc] dark:border-white/10 dark:text-slate-200" title={language === "zh" ? "曲线参数设置" : "Curve settings"}><SlidersHorizontal className="h-4 w-4" /></button>
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        {!paths.some((item) => item.points.length) && <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400 dark:text-slate-200">{language === "zh" ? "所选时间范围没有趋势数据" : "No trend data in this range"}</div>}
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full" onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setHoverRatio(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))); }} onMouseLeave={() => setHoverRatio(null)}>
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => <line key={ratio} x1={padding} x2={width - padding} y1={padding + ratio * (height - padding * 2)} y2={padding + ratio * (height - padding * 2)} stroke="#e2e8f0" />)}
          {paths.map((item) => <motion.path key={item.tagCode} d={item.path} fill="none" stroke={item.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />)}
          {hoverRatio !== null && <line x1={padding + hoverRatio * (width - padding * 2)} x2={padding + hoverRatio * (width - padding * 2)} y1={padding} y2={height - padding} stroke="#1f2937" strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />}
        </svg>
        {hoverTimestamp !== null && visible.length > 0 && (
          <div
            className="pointer-events-none absolute top-3 z-10 min-w-56 rounded-md border border-slate-200 bg-white/95 p-2 text-[10px] shadow-lg dark:border-white/10 dark:bg-surface-container-low"
            style={{
              left: `${hoverRatio * 100}%`,
              transform: hoverRatio > 0.72 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
            }}
          >
            <div className="mb-1 font-bold text-slate-700 dark:text-on-surface">{new Date(hoverTimestamp).toLocaleString("zh-CN", { hour12: false })}</div>
            {visible.map((item, index) => { const point = nearestPoint(item.points, hoverTimestamp); const tag = tagsByCode[item.tagCode]; return <div key={item.tagCode} className="flex justify-between gap-4 leading-5"><span style={{ color: COLORS[index % COLORS.length] }}>{tag ? metricLabel(tag, language) : item.tagName}</span><b>{point ? `${point.value} ${item.unit || tag?.unit || ""}` : "--"}</b></div>; })}
          </div>
        )}
      </div>
    </section>
  );
};

const Trend = () => {
  const { language } = useLanguage();
  const today = useMemo(() => new Date(), []);
  const initialStart = useMemo(() => { const date = new Date(today); date.setDate(date.getDate() - 89); return date; }, [today]);
  const [screenDevices, setScreenDevices] = useState({ screenA: "CMMS01", screenB: "CMMS02" });
  const [startDate, setStartDate] = useState(dateValue(initialStart));
  const [endDate, setEndDate] = useState(dateValue(today));
  const [rangeKey, setRangeKey] = useState("quarter");
  const [screenMode, setScreenMode] = useState("split");
  const [settingsScreen, setSettingsScreen] = useState(null);
  const [screenMetrics, setScreenMetrics] = useState({ screenA: [], screenB: [] });
  const tagsResourceA = useTrendTags(screenDevices.screenA);
  const tagsResourceB = useTrendTags(screenDevices.screenB);
  const tagsByScreen = useMemo(() => ({
    screenA: tagsResourceA.data,
    screenB: tagsResourceB.data,
  }), [tagsResourceA.data, tagsResourceB.data]);

  useEffect(() => {
    const defaults = defaultMetricSelection(tagsResourceA.data);
    if (defaults.length) setScreenMetrics((current) => ({ ...current, screenA: defaults }));
  }, [screenDevices.screenA, tagsResourceA.data]);

  useEffect(() => {
    const defaults = defaultMetricSelection(tagsResourceB.data);
    if (defaults.length) setScreenMetrics((current) => ({ ...current, screenB: defaults }));
  }, [screenDevices.screenB, tagsResourceB.data]);

  const activeScreens = useMemo(
    () => screenMode === "single" ? ["screenA"] : ["screenA", "screenB"],
    [screenMode]
  );
  const queryResourceA = useTrendSeries({ engineCode: screenDevices.screenA, tagCodes: screenMetrics.screenA, startTime: startOfDay(startDate), endTime: endOfDay(endDate), interval: rangeKey === "week" ? "1m" : "1h" });
  const queryResourceB = useTrendSeries({ engineCode: screenDevices.screenB, tagCodes: screenMetrics.screenB, startTime: startOfDay(startDate), endTime: endOfDay(endDate), interval: rangeKey === "week" ? "1m" : "1h" });
  const queryByScreen = { screenA: queryResourceA, screenB: queryResourceB };
  const tagsByCodeA = useMemo(() => Object.fromEntries(tagsResourceA.data.map((tag) => [tag.tagCode, tag])), [tagsResourceA.data]);
  const tagsByCodeB = useMemo(() => Object.fromEntries(tagsResourceB.data.map((tag) => [tag.tagCode, tag])), [tagsResourceB.data]);
  const tagsByCodeScreen = { screenA: tagsByCodeA, screenB: tagsByCodeB };
  const range = RANGE_OPTIONS.find((item) => item.key === rangeKey) || RANGE_OPTIONS[2];
  const toggleMetric = (screen, tagCode) => setScreenMetrics((current) => { const selected = current[screen]; const next = selected.includes(tagCode) ? selected.filter((item) => item !== tagCode) : [...selected, tagCode]; return { ...current, [screen]: next.length ? next : selected }; });
  const changeScreenDevice = (screen, deviceCode) => {
    setScreenDevices((current) => ({ ...current, [screen]: deviceCode }));
    setSettingsScreen(null);
  };
  const applyRange = (key) => { const option = RANGE_OPTIONS.find((item) => item.key === key) || RANGE_OPTIONS[2]; setRangeKey(key); setEndDate(addDays(startDate, option.days)); };
  const overlayResources = activeScreens.flatMap((screen) => {
    const tagsResource = screen === "screenA" ? tagsResourceA : tagsResourceB;
    const queryResource = screen === "screenA" ? queryResourceA : queryResourceB;
    return [tagsResource, screenMetrics[screen].length ? queryResource : { status: "idle" }];
  });

  return (
    <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f5f6f8] px-3 pb-3 pt-2 dark:bg-background">
      <DataStateOverlay resources={overlayResources} label={language === "zh" ? "趋势数据" : "trend data"} />
      <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3 bg-white p-3 shadow-sm dark:bg-surface-container-lowest">
        <div className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-[#4cd7d0]" /><span className="text-xs font-black uppercase text-slate-700 dark:text-on-surface">{language === "zh" ? "趋势查询" : "Trend Query"}</span></div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-200">
          <label>{language === "zh" ? "开始" : "Start"}<input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setEndDate(addDays(e.target.value, range.days)); }} className="ml-1 h-8 rounded border border-slate-200 bg-white px-2 text-slate-700 dark:border-white/10 dark:bg-surface-container-low dark:text-on-surface" /></label>
          <label>{language === "zh" ? "结束" : "End"}<input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="ml-1 h-8 rounded border border-slate-200 bg-white px-2 text-slate-700 dark:border-white/10 dark:bg-surface-container-low dark:text-on-surface" /></label>
          <select value={rangeKey} onChange={(e) => applyRange(e.target.value)} className="h-8 rounded border border-slate-200 bg-white px-2 text-slate-700 dark:border-white/10 dark:bg-surface-container-low dark:text-on-surface">{RANGE_OPTIONS.map((item) => <option key={item.key} value={item.key}>{language === "zh" ? item.zh : item.en}</option>)}</select>
          <button onClick={() => setScreenMode(screenMode === "single" ? "split" : "single")} className="h-8 rounded bg-[#1a1b1f] px-3 text-white">{screenMode === "single" ? (language === "zh" ? "分屏" : "Split") : (language === "zh" ? "单屏" : "Single")}</button>
        </div>
      </header>
      <div className={`grid min-h-0 flex-1 gap-3 ${screenMode === "split" ? "grid-rows-2" : "grid-rows-1"}`}>
        {activeScreens.map((screen, index) => (
          <div key={screen} className="flex min-h-0 flex-col gap-2">
            {settingsScreen === screen && (
              <MetricPicker
                tags={tagsByScreen[screen]}
                selected={screenMetrics[screen]}
                onToggle={(code) => toggleMetric(screen, code)}
                onClose={() => setSettingsScreen(null)}
                language={language}
              />
            )}
            <TrendChart
              title={language === "zh" ? `趋势屏幕 ${index + 1}` : `Trend Screen ${index + 1}`}
              deviceCode={screenDevices[screen]}
              onDeviceChange={(deviceCode) => changeScreenDevice(screen, deviceCode)}
              series={queryByScreen[screen].data}
              tagsByCode={tagsByCodeScreen[screen]}
              selected={screenMetrics[screen]}
              startTime={startOfDay(startDate)}
              endTime={endOfDay(endDate)}
              rangeLabel={language === "zh" ? range.zh : range.en}
              onSettings={() => setSettingsScreen(settingsScreen === screen ? null : screen)}
              language={language}
            />
          </div>
        ))}
      </div>
    </main>
  );
};

export default Trend;

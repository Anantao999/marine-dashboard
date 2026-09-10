import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Bell, BellOff, CheckCircle2, Search } from "lucide-react";
import { useAlarmsData } from "./hooks/useRealTimeData";
import { useLanguage } from "./hooks/useLanguage";
import { useFocusMode } from "./hooks/useFocusMode";
import DataStateOverlay from "./components/DataStateOverlay";

const parseAlarmDate = (alarm) => {
  const raw = alarm.timestamp || alarm.occurredAt || alarm.time || alarm.resolvedTime || "";
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date : null;
};

const dateBoundary = (value, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
  return Number.isFinite(date.getTime()) ? date : null;
};

const displayTime = (alarm, language) => {
  const parsed = parseAlarmDate(alarm);
  if (parsed) return parsed.toLocaleString(language === "zh" ? "zh-CN" : "en-US", { hour12: false });
  return alarm.time || alarm.resolvedTime || "--";
};

const Alarms = () => {
  const { t, language } = useLanguage();
  const { focusMode, toggleFocusMode } = useFocusMode();
  const { alarms, resource } = useAlarmsData(5000, language);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const alarmRows = useMemo(() => {
    const active = (alarms.active || []).map((alarm) => ({ ...alarm, bucket: "active" }));
    const history = (alarms.history || []).map((alarm) => ({ ...alarm, bucket: "history" }));
    return [...active, ...history].sort((a, b) => {
      const aDate = parseAlarmDate(a);
      const bDate = parseAlarmDate(b);
      if (aDate && bDate) return bDate - aDate;
      return String(b.time || "").localeCompare(String(a.time || ""));
    });
  }, [alarms.active, alarms.history]);

  const activeCount = alarmRows.filter((alarm) => alarm.bucket === "active").length;
  const historyCount = alarmRows.filter((alarm) => alarm.bucket === "history").length;
  const startBoundary = dateBoundary(startDate);
  const endBoundary = dateBoundary(endDate, true);

  const filteredRows = alarmRows.filter((alarm) => {
    if (tab !== "all" && alarm.bucket !== tab) return false;

    const text = `${alarm.source || ""} ${alarm.message || ""} ${alarm.pointCode || ""}`.toLowerCase();
    if (query.trim() && !text.includes(query.trim().toLowerCase())) return false;

    const parsed = parseAlarmDate(alarm);
    if (parsed && startBoundary && parsed < startBoundary) return false;
    if (parsed && endBoundary && parsed > endBoundary) return false;
    return true;
  });

  const tabs = [
    { key: "all", label: t.alarmAll, count: alarmRows.length },
    { key: "active", label: t.alarmActive, count: activeCount },
    { key: "history", label: t.alarmHistoryTab, count: historyCount },
  ];

  return (
    <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-4 pt-2 bg-[#F5F6F8] dark:bg-background">
      <DataStateOverlay resources={resource} label={language === "zh" ? "告警数据" : "alarm data"} />
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px] gap-4">
        <section className="flex min-h-0 flex-col rounded-2xl bg-white p-5 shadow-sm dark:bg-surface-container-lowest">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#1A1B1F] dark:text-on-surface">
                {t.alarmCenter}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-200">
                {language === "zh" ? "报警只映射船端报警 bit，不在 UI 端判断阈值或处理现场故障。" : "Alarms map vessel-side alarm bits only; the UI does not judge thresholds or clear vessel faults."}
              </p>
            </div>
            <button
              onClick={toggleFocusMode}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${
                focusMode
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                  : "bg-[#1A1B1F] text-white"
              }`}
            >
              {focusMode ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {focusMode ? (language === "zh" ? "专注静音" : "Focus Muted") : (language === "zh" ? "报警有声" : "Sound On")}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`rounded-xl p-4 text-left transition ${
                  tab === item.key
                    ? "bg-[#1A1B1F] text-white dark:bg-[#4CD7D0] dark:text-[#00201e]"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-surface-container-low dark:text-on-surface"
                }`}
              >
                <div className="text-3xl font-black">{item.count}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-65">{item.label}</div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-surface-container-low">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-200">
              {t.alarmStartDate}
              <input value={startDate} onChange={(event) => setStartDate(event.target.value)} type="date" className="mt-1 block h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none dark:border-white/10 dark:bg-surface-container-lowest dark:text-on-surface" />
            </label>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-200">
              {t.alarmEndDate}
              <input value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} type="date" className="mt-1 block h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none dark:border-white/10 dark:bg-surface-container-lowest dark:text-on-surface" />
            </label>
            <label className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-9 h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-200">{language === "zh" ? "关键字" : "Keyword"}</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.alarmSearch}
                className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs font-bold text-slate-700 outline-none dark:border-white/10 dark:bg-surface-container-lowest dark:text-on-surface"
              />
            </label>
            <div className="ml-auto rounded-full bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-red-700 dark:bg-red-950/45 dark:text-red-200 dark:ring-1 dark:ring-red-500/25">
              {language === "zh" ? "当前活动报警" : "Active Alarms"}: {activeCount}
            </div>
          </div>

          <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-surface-container-low">
            {filteredRows.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-green-600">
                <CheckCircle2 className="mb-2 h-10 w-10" />
                <div className="text-sm font-bold">{language === "zh" ? "当前筛选条件下没有报警" : "No alarms match the current filters"}</div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRows.map((alarm, idx) => {
                  const isActive = alarm.bucket === "active";
                  return (
                    <motion.div
                      key={`${alarm.bucket}-${alarm.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                        isActive
                          ? "border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-500/35 dark:bg-red-950/30 dark:hover:bg-red-950/45"
                          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-[#181b22] dark:hover:bg-[#20242c]"
                      }`}
                    >
                      <AlertTriangle className={`h-5 w-5 shrink-0 ${isActive ? "text-red-600 dark:text-red-300" : "text-slate-400 dark:text-slate-500"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{alarm.message}</div>
                        <div className={`text-[11px] ${isActive ? "text-slate-500 dark:text-red-100/70" : "text-slate-500 dark:text-slate-400"}`}>
                          {alarm.source || "--"} / {displayTime(alarm, language)}
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${
                        isActive
                          ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200 dark:ring-1 dark:ring-red-500/25"
                          : "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-300"
                      }`}>
                        {isActive ? t.alarmActive : t.alarmHistoryTab}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-3">
          <div className="rounded-2xl bg-[#1A1B1F] p-4 text-white shadow-xl dark:bg-surface-container-lowest">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4cd7d0]">
                {language === "zh" ? "声音策略" : "Sound Policy"}
              </span>
              {focusMode ? <BellOff className="h-4 w-4 text-blue-300" /> : <Bell className="h-4 w-4 text-[#79ff5b]" />}
            </div>
            <p className="text-sm font-bold">
              {focusMode
                ? (language === "zh" ? "专注模式开启，报警声音静音。" : "Focus mode is on. Alarm sound is muted.")
                : (language === "zh" ? "新报警触发时播放短提示音。" : "A short tone plays when new alarms arrive.")}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-surface-container-lowest">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-200">
              {language === "zh" ? "报警状态规则" : "Alarm State Rule"}
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-on-surface-variant">
              <div>{language === "zh" ? "1. bit=1 显示为活动报警。" : "1. bit=1 is displayed as Active."}</div>
              <div>{language === "zh" ? "2. bit=0 或恢复后进入历史记录。" : "2. bit=0 or recovered state becomes History."}</div>
              <div>{language === "zh" ? "3. UI 不做阈值判断。" : "3. The UI does not judge thresholds."}</div>
              <div>{language === "zh" ? "4. 消音不改变报警状态。" : "4. Muting does not change alarm state."}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Alarms;

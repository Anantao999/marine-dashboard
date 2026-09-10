import React, { useState } from "react";
import { motion } from "framer-motion";
import { EngineModel } from "./YachtModel";
import { useEngineData, useAlarmsData } from "./hooks/useRealTimeData";
import { useLanguage } from "./hooks/useLanguage";
import { useUnitSystem } from "./hooks/useUnitSystem";
import DataStateOverlay from "./components/DataStateOverlay";

const MainEngine = () => {
  const { t, language } = useLanguage();
  const { formatUnit } = useUnitSystem();
  const [activeEngine, setActiveEngine] = useState("diesel1");
  const [autoRotate, setAutoRotate] = useState(false);
  const engines = useEngineData(2000);
  const { alarms, resource: alarmsResource } = useAlarmsData(5000, language);
  const engine = engines[activeEngine];
  const fuelPressure = engine?.fuelPressure ?? engine?.fuelDeliveryPressure ?? 7.6;
  const oilTemp = engine?.lubeOilTemp ?? engine?.lubricatingOilTemperature ?? (engine?.coolantTemp || 75) + 8;
  const engineParameterList = [
    { label: language === "zh" ? "燃油压力" : "Fuel Pressure", value: formatUnit("pressure", fuelPressure, 1).text },
    { label: language === "zh" ? "滑油温度" : "Lube Oil Temp", value: formatUnit("temperature", oilTemp, 1).text },
    { label: language === "zh" ? "冷却水温度" : "Cooling Water Temp", value: formatUnit("temperature", engine?.coolantTemp || 0, 1).text },
    { label: language === "zh" ? "排气温度" : "Exhaust Temp", value: formatUnit("temperature", engine?.exhaustTemp || 0, 1).text },
    { label: language === "zh" ? "转速" : "Speed", value: `${engine?.rpm || 0} RPM` },
  ];

  const engineButtons = [
    { key: "diesel1", label: t.engine1, status: engines.diesel1.status },
    { key: "diesel2", label: t.engine2, status: engines.diesel2.status },
    { key: "aux1", label: t.gen1, status: engines.aux1.status },
    { key: "aux2", label: t.gen2, status: engines.aux2.status },
  ];

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden px-4 pb-4 pt-2 bg-[#F5F6F8] dark:bg-background" style={{ minHeight: 0 }}>
      <DataStateOverlay resources={[engines.__resource, alarmsResource]} label={language === "zh" ? "主机数据" : "engine data"} />
      {/* Main Content Row */}
      <main className="flex flex-row flex-1 gap-4 relative items-stretch" style={{ minHeight: 0 }}>
        {/* Left: Engine Selection Buttons */}
        <aside className="flex flex-col w-28 xl:w-32 shrink-0 space-y-2 z-20 justify-center" style={{ minHeight: 0 }}>
          {engineButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setActiveEngine(btn.key)}
              className={`${
                activeEngine === btn.key
                  ? "bg-[#1A1B1F] dark:bg-surface-container-lowest text-white dark:text-on-surface rounded-full px-3 py-2 text-xs font-bold tracking-wider uppercase shadow-lg text-left flex items-center justify-between"
                  : "bg-white dark:bg-surface-container-lowest text-[#1A1B1F]/60 dark:text-white rounded-full px-3 py-2 text-xs font-bold tracking-wider uppercase shadow-sm text-left hover:bg-gray-50 dark:hover:bg-dark-surface-container-low transition-colors"
              }`}
            >
              {btn.label}
              {activeEngine === btn.key && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#79ff5b] shadow-[0_0_8px_rgba(121,255,91,0.8)]"></span>
              )}
              {activeEngine !== btn.key && btn.status === "running" && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              )}
              {activeEngine !== btn.key && btn.status === "standby" && (
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
              )}
            </button>
          ))}

          {/* Auto-Rotation Toggle */}
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-white dark:bg-surface-container-lowest rounded-full shadow-sm">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${
                autoRotate ? "bg-[#4cd7d0]" : "bg-gray-300 dark:bg-surface-container-high"
              }`}
              aria-label={t.autoRotate3D}
            >
              <motion.div
                className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
                animate={{ left: autoRotate ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-on-surface-variant">
              {t.autoRotate3D}
            </span>
          </div>
        </aside>

        {/* Center: Engine 3D Visualization */}
        <section
          className="flex-1 flex flex-col relative overflow-hidden z-10"
          style={{ minHeight: 0 }}
        >
          {/*
            IMPORTANT: `@react-three/fiber`'s Canvas needs a parent with a concrete height.
            Without an explicit min-height, flex layouts can collapse, making the canvas appear
            as a small strip in the middle.
          */}
          <div className="w-full flex-1" style={{ minHeight: '300px' }}>
            <EngineModel autoRotate={autoRotate} faultAlarm={false} />
          </div>
          <div className="absolute left-4 top-4 w-64 rounded-xl border border-white/70 bg-white/95 p-3 text-black shadow-lg backdrop-blur dark:border-white/15 dark:bg-[#171a20]/95 dark:text-white">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white">
                {language === "zh" ? "主机参数" : "Main Engine Parameters"}
              </span>
              <span className="h-2 w-2 rounded-full bg-[#4cd7d0] shadow-[0_0_8px_rgba(76,215,208,0.8)]" />
            </div>
            <div className="space-y-2">
              {engineParameterList.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 border-b border-slate-200 pb-1.5 last:border-b-0 last:pb-0 dark:border-white/10">
                  <span className="text-[10px] font-semibold text-black dark:text-slate-200">{item.label}</span>
                  <span className="text-xs font-bold text-black dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right: Status Panels */}
        <aside className="w-80 xl:w-[22rem] shrink-0 flex flex-col gap-4 z-20 justify-start overflow-y-auto max-h-full" style={{ minHeight: 0 }}>
          {/* Vessel Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#1A1A1A] dark:bg-surface-container-lowest text-white dark:text-on-surface rounded-xl p-4 shadow-xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 dark:text-on-surface-variant">
                {language === "zh" ? "船名信息" : "Vessel"}
              </span>
              <span className="material-symbols-outlined text-[#4cd7d0] text-sm">directions_boat</span>
            </div>
            <div className="h-28 overflow-hidden rounded-lg bg-white/10">
              <img src="/image/board.jpg" alt={language === "zh" ? "船舶照片" : "Vessel"} className="h-full w-full object-cover" />
            </div>
            <div className="mt-2">
              <p className="text-xl font-bold">{language === "zh" ? "A 号船" : "VESSEL A"}</p>
              <p className="text-xs text-gray-400 dark:text-on-surface-variant">IMO 9876543 / {language === "zh" ? "主推进监控" : "Main propulsion monitor"}</p>
            </div>
          </motion.div>

          {/* Product Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-slate-100/50 dark:border-dark-surface-variant dark:text-on-surface"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-on-surface-variant">
                {language === "zh" ? "产品信息" : "Product Info"}
              </span>
              <span className="material-symbols-outlined text-[#4cd7d0] text-sm">precision_manufacturing</span>
            </div>
            <div className="space-y-3 text-sm text-slate-800 dark:text-on-surface">
              <div className="flex justify-between"><span className="text-gray-400 dark:text-on-surface-variant">{language === "zh" ? "型号" : "Model"}</span><b>{language === "zh" ? "船用柴油机" : "Marine Diesel"}</b></div>
              <div className="flex justify-between"><span className="text-gray-400 dark:text-on-surface-variant">{language === "zh" ? "序列号" : "Serial No."}</span><b>ME-{activeEngine.toUpperCase()}-0428</b></div>
              <div className="flex justify-between"><span className="text-gray-400 dark:text-on-surface-variant">{language === "zh" ? "生产编号" : "Prod. No."}</span><b>PRD-2026-071</b></div>
              <div className="flex justify-between"><span className="text-gray-400 dark:text-on-surface-variant">{t.load}</span><b>{engine?.load || 0}%</b></div>
            </div>
          </motion.div>

          {/* Alarm Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#1A1A1A] dark:bg-surface-container-lowest text-white dark:text-on-surface rounded-xl p-4 shadow-xl flex flex-col items-center"
          >
            <div className="mb-2 flex w-full items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300 dark:text-on-surface-variant">
                {language === "zh" ? "报警摘要" : "Alarm Summary"}
              </span>
              <span className="material-symbols-outlined text-[#ff6b6b] text-sm">notifications</span>
            </div>
            <div className="w-full space-y-2">
              {alarms.active.length > 0 ? alarms.active.slice(0, 3).map((alarm) => (
                <div key={alarm.id} className="w-full rounded-lg bg-red-500/10 p-2 text-left">
                  <p className="truncate text-sm font-bold text-red-200">{alarm.message}</p>
                  <p className="text-[11px] text-red-300/80">{alarm.source}</p>
                </div>
              )) : (
                <div className="w-full rounded-lg bg-green-500/10 p-2 text-center text-[11px] font-bold text-green-300">
                  {t.allSystemsNormal}
                </div>
              )}
            </div>
          </motion.div>
        </aside>
      </main>

      {/* Bottom: 5 Status Cards */}
      <footer className="grid grid-cols-5 gap-4 mt-3 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-slate-100/50 dark:border-dark-surface-variant hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold text-slate-400 dark:text-on-surface-variant uppercase tracking-wider">
            {t.engineSpeed}
          </span>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-semibold text-[#1A1B1F] dark:text-on-surface">{engine?.rpm || 0}</span>
            <span className="text-[10px] text-slate-400 dark:text-on-surface-variant ml-1 font-normal">{t.rpm}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-slate-100/50 dark:border-dark-surface-variant hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold text-slate-400 dark:text-on-surface-variant uppercase tracking-wider">
            {t.fuelRate}
          </span>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-semibold text-[#1A1B1F] dark:text-on-surface">{engine?.fuelRate?.toFixed(1) || 0}</span>
            <span className="text-[10px] text-slate-400 dark:text-on-surface-variant ml-1 font-normal">{t.lh}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-slate-100/50 dark:border-dark-surface-variant hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold text-slate-400 dark:text-on-surface-variant uppercase tracking-wider">
            {t.lubeOilPress}
          </span>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-semibold text-[#1A1B1F] dark:text-on-surface">{engine?.oilPressure?.toFixed(1) || 0}</span>
            <span className="text-[10px] text-slate-400 dark:text-on-surface-variant ml-1 font-normal">{t.bar}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-slate-100/50 dark:border-dark-surface-variant hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold text-slate-400 dark:text-on-surface-variant uppercase tracking-wider">
            {t.coolantTemp}
          </span>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-semibold text-[#1A1B1F] dark:text-on-surface">{engine?.coolantTemp?.toFixed(1) || 0}</span>
            <span className="text-[10px] text-slate-400 dark:text-on-surface-variant ml-1 font-normal">°C</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
            className="bg-white dark:bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-slate-100/50 dark:border-dark-surface-variant hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <span className="text-[10px] font-semibold text-slate-400 dark:text-on-surface-variant uppercase tracking-wider">
            {t.loadFactor}
          </span>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-semibold text-blue-600 dark:text-primary">{engine?.load || 0}</span>
            <span className="text-[10px] text-slate-400 dark:text-on-surface-variant ml-1 font-normal">{t.percent}</span>
          </div>
        </motion.div>
      </footer>
    </div>
  );
};

export default MainEngine;

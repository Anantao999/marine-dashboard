import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, MapPin, Wind, Compass, Gauge, Navigation, AlertTriangle, Thermometer, RotateCw } from "lucide-react";
import RealtimeDataConfigModal from "./components/RealtimeDataConfigModal";
import SystemStatusConfigModal from "./components/SystemStatusConfigModal";
import { SUBSYSTEM_CONFIG, useNavigationConfig } from "./hooks/useNavigationConfig";
import { useVesselData, useEngineData, useSystemStatus, useAlarmsData } from "./hooks/useRealTimeData";
import { useLanguage } from "./hooks/useLanguage";
import DataStateOverlay from "./components/DataStateOverlay";

const WIND_DIRECTION_DEGREES = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
};

const windDirectionAngle = (direction) => {
  const numeric = Number(direction);
  if (Number.isFinite(numeric)) return numeric;
  const key = String(direction || "").trim().toUpperCase();
  return WIND_DIRECTION_DEGREES[key] ?? null;
};

const WIND_DIRECTION_ZH = {
  N: "北",
  NNE: "北东北",
  NE: "东北",
  ENE: "东东北",
  E: "东",
  ESE: "东东南",
  SE: "东南",
  SSE: "南东南",
  S: "南",
  SSW: "南西南",
  SW: "西南",
  WSW: "西西南",
  W: "西",
  WNW: "西西北",
  NW: "西北",
  NNW: "北西北",
};

const localizeDirection = (direction, language) => {
  if (language !== "zh") return direction;
  const key = String(direction || "").trim().toUpperCase();
  return WIND_DIRECTION_ZH[key] || direction;
};

const DialGauge = ({ label, value, unit, max, icon, color = "#4CD7D0" }) => {
  const numericValue = Number(value) || 0;
  const numericMax = Number(max) > 0 ? Number(max) : 1;
  const pct = Math.max(0, Math.min(numericValue / numericMax, 1));
  const angle = -135 + pct * 270;
  const gaugePath = "M 26.06 93.94 A 48 48 0 1 1 93.94 93.94";
  return (
    <div className="rounded-xl bg-surface-container p-3 dark:bg-surface-container-low">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
        <span className="text-primary-container">{icon}</span>
      </div>
      <div className="relative mx-auto flex aspect-square max-h-28 min-h-24 items-center justify-center">
        <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
          <path
            d={gaugePath}
            fill="none"
            stroke="rgba(148,163,184,0.28)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <motion.path
            d={gaugePath}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            initial={{ strokeDashoffset: 1 }}
            animate={{ strokeDashoffset: 1 - pct }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <line
            x1="60"
            y1="60"
            x2="60"
            y2="22"
            stroke="currentColor"
            className="text-[#1A1B1F] dark:text-white"
            strokeWidth="4"
            strokeLinecap="round"
            transform={`rotate(${angle} 60 60)`}
          />
          <circle cx="60" cy="60" r="5" fill={color} />
        </svg>
        <div className="absolute bottom-4 text-center">
          <div className="text-xl font-black text-on-background">{value}</div>
          <div className="text-[9px] font-bold uppercase text-on-surface-variant">{unit}</div>
        </div>
      </div>
    </div>
  );
};

const NavigationPage = () => {
  const { t, language } = useLanguage();
  const { realtimeDataConfig, systemStatusConfig } = useNavigationConfig();

  const [realtimeModalOpen, setRealtimeModalOpen] = useState(false);
  const [systemModalOpen, setSystemModalOpen] = useState(false);

  // 连接到配置参数
  const vesselData = useVesselData(realtimeDataConfig.refreshRate, {
    smoothingFilter: realtimeDataConfig.smoothingFilter,
  });

  const engineData = useEngineData(2000, {
    rpmHighAlertLimit: 750,
    lubeOilPressureLowLimit: 2.5,
    faultInjectionEnabled: systemStatusConfig.faultInjectionEnabled,
  });

  const systemStatus = useSystemStatus(1500);
  const { alarms, resource: alarmsResource } = useAlarmsData(5000, language);
  const timestampValue = vesselData.timestamp || systemStatus.timestamp;
  const latestDataTimestamp = timestampValue ? new Date(timestampValue) : null;
  const nextRefreshAt = latestDataTimestamp ? new Date(latestDataTimestamp.getTime() + realtimeDataConfig.refreshRate) : null;
  const backendRoutePending = vesselData.backendRouteReady === false || systemStatus.backendRouteReady === false;
  const backendStateLabel = backendRoutePending
    ? language === "zh" ? "待接入" : "Pending"
    : language === "zh" ? "在线" : "Online";
  const rawDataSourceLabel = backendRoutePending
    ? language === "zh" ? "后端接口未接入" : "Backend route pending"
    : vesselData.source || systemStatus.source || "MODBUS/RS485";
  const dataSourceLabel = language === "zh" && rawDataSourceLabel === "DB" ? "数据库" : rawDataSourceLabel;
  const generatorCapacity = 10000;
  const totalGeneratorPower = Math.round((engineData.aux1?.power || 0) + (engineData.aux2?.power || 0));
  const powerStationLoadPct = Math.max(0, Math.min(Math.round((totalGeneratorPower / generatorCapacity) * 100), 100));
  const availablePower = Math.max(0, generatorCapacity - totalGeneratorPower);
  const generatorPowerLabel = totalGeneratorPower >= 1000 ? `${(totalGeneratorPower / 1000).toFixed(1)}MW` : `${totalGeneratorPower}kW`;
  const generatorPowerPct = Math.max(0, Math.min(totalGeneratorPower / generatorCapacity, 1));
  const rollValue = Number(vesselData.roll ?? 0);
  const windAngle = windDirectionAngle(vesselData.wind.direction);
  const windAngleLabel = windAngle === null ? "--" : `${windAngle.toFixed(windAngle % 1 === 0 ? 0 : 1)}°`;

  const subsystems = systemStatusConfig.subsystems;

  const visibleSubsystems = Object.entries(subsystems)
    .filter(([, visible]) => visible)
    .map(([key]) => key);
  const subsystemLabelByKey = SUBSYSTEM_CONFIG.reduce((labels, item) => ({
    ...labels,
    [item.key]: language === "zh" ? item.labelZh : item.labelEn,
  }), {});

  const navigationAlarms = [...(alarms.active || [])].slice(0, 5);

  const dataCards = [
    {
      key: "bow",
      icon: <Compass className="w-4 h-4 text-primary-container shrink-0" />,
      label: language === "zh" ? "船首信息" : "Bow Heading",
      value: `${vesselData.heading}°`,
      detail: language === "zh" ? "正北为 0°" : "North = 0°",
    },
    {
      key: "gps",
      icon: <MapPin className="w-4 h-4 text-primary-container shrink-0" />,
      label: "GPS",
      value: `${vesselData.position.lat.toFixed(3)}° N / ${vesselData.position.lon.toFixed(3)}° E`,
      detail: language === "zh" ? "经纬度同框显示" : "Latitude / Longitude",
    },
    {
      key: "wind",
      icon: <Wind className="w-4 h-4 text-primary-container shrink-0" />,
      label: language === "zh" ? "风速风向" : "Wind Speed / Direction",
      value: `${vesselData.wind.speed} ${t.knots} / ${windAngleLabel}`,
      detail: language === "zh" ? `来向 ${localizeDirection(vesselData.wind.direction, language)}` : `From ${vesselData.wind.direction}`,
    },
    {
      key: "attitude",
      icon: <Navigation className="w-4 h-4 text-primary-container shrink-0" />,
      label: t.vesselMotion,
      value: `${t.pitch} ${Number(vesselData.pitch || 0).toFixed(1)}° / ${t.roll} ${rollValue.toFixed(1)}°`,
      detail: language === "zh" ? "暂不显示升沉" : "Heave hidden for now",
    },
    {
      key: "alarms",
      icon: <AlertTriangle className="w-4 h-4 text-tertiary shrink-0" />,
      label: t.activeAlarms,
      custom: true,
    },
  ];

  const mainEngine = engineData.diesel1 || {};

  return (
    <div className="relative flex-1 min-h-0 h-full w-full px-2 sm:px-3 py-2 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 items-stretch">
      <DataStateOverlay resources={[vesselData.__resource, engineData.__resource, systemStatus.__resource, alarmsResource]} label={language === "zh" ? "导航监控数据" : "navigation data"} />
      {/* Column 1: Fleet / Power Station Summary */}
      <motion.section
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-3 flex flex-col gap-1.5 min-h-0 h-full overflow-hidden"
      >
        <div className="flex justify-between items-end shrink-0">
          <h2 className="font-headline font-black text-lg sm:text-xl tracking-tighter text-on-background dark:text-on-background">
            {t.vessel}
          </h2>
          <span className="font-label text-[10px] uppercase tracking-widest opacity-60 text-on-background dark:text-on-background">
            {language === "zh" ? "关键航行信息" : "Key Voyage Data"}
          </span>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-xl p-3 shadow-sm flex-1 min-h-0 flex flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-2">
            {[
              { label: "GPS", value: `${vesselData.position.lat.toFixed(3)}°N / ${vesselData.position.lon.toFixed(3)}°E`, icon: <MapPin className="h-4 w-4" /> },
              { label: language === "zh" ? "本地时间" : "Local Time", value: latestDataTimestamp?.toLocaleTimeString(language === "zh" ? "zh-CN" : "en-US", { hour12: false }) || "--", icon: <Navigation className="h-4 w-4" /> },
              { label: t.totalGeneratorPower, value: generatorPowerLabel, icon: <Gauge className="h-4 w-4" /> },
              { label: language === "zh" ? "船速" : "Speed", value: `${vesselData.sog.toFixed(1)} ${t.knots}`, icon: <Compass className="h-4 w-4" /> },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-surface-container-low">
                <div className="flex min-w-0 items-center gap-2 text-primary-container">
                  {item.icon}
                  <span className="truncate text-[10px] font-black uppercase tracking-wider text-on-surface-variant">{item.label}</span>
                </div>
                <span className="shrink-0 font-mono text-xs font-black text-on-background dark:text-on-surface">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Status Card */}
        <div className="bg-on-secondary-fixed dark:bg-surface-container-low text-white dark:text-surface-container rounded-xl p-4 shrink-0 text-center relative">
          {/* Settings Button */}
          <button
            onClick={() => setSystemModalOpen(true)}
            className="absolute top-2 right-2 p-1.5 hover:bg-white/10 rounded-lg transition-all group"
            title={language === "zh" ? "系统状态设置" : "System Status Settings"}
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <Settings className="w-4 h-4 text-white/60 group-hover:text-[#4CD7D0]" />
            </motion.div>
          </button>

          <h3 className="font-label text-[10px] uppercase tracking-widest text-primary-container mb-1 text-left">
            {t.systemStatus}
          </h3>
          <div className="flex justify-center items-start gap-10 sm:gap-12 py-3">
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="transparent"
                    stroke="#4CD7D0"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="201"
                    initial={{ strokeDashoffset: 201 }}
                    animate={{ strokeDashoffset: 201 - (powerStationLoadPct / 100) * 201 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-lg font-headline font-bold">{powerStationLoadPct}%</span>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-tighter mt-1 text-center max-w-[6.5rem] leading-tight">
                {t.powerStationLoad}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="transparent"
                    stroke="#4CD7D0"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="201"
                    initial={{ strokeDashoffset: 201 }}
                    animate={{ strokeDashoffset: 201 - generatorPowerPct * 201 }}
                    transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-sm font-headline font-bold">{generatorPowerLabel}</span>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-tighter mt-1 text-center max-w-[6.5rem] leading-tight">
                {t.totalGeneratorPower}
              </span>
            </div>
          </div>
          <div className="mt-1 flex items-center justify-center gap-4 border-t border-white/10 pt-2 text-[10px] font-bold uppercase tracking-wider text-white/65">
            <span>{t.availablePower}: {availablePower.toLocaleString()} kW</span>
            <span>{language === "zh" ? "系统健康" : "System Health"}: {systemStatus.systemHealth}%</span>
          </div>

          {/* Subsystem Status Grid */}
          {systemStatusConfig.displayMode === "grid" && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {visibleSubsystems.map((key) => (
                <div
                  key={key}
                  className="bg-white/5 rounded p-2 text-center"
                >
                  <div className="w-2 h-2 rounded-full bg-[#4CD7D0] mx-auto mb-0.5" />
                  <span className="text-[9px] text-white/70 block truncate">
                    {subsystemLabelByKey[key] || key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {systemStatusConfig.displayMode === "list" && (
            <div className="space-y-1 mt-2 text-left">
              {visibleSubsystems.map((key) => (
                <div key={key} className="flex items-center gap-1.5 text-[8px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4CD7D0]" />
                  <span className="text-white/70">
                    {subsystemLabelByKey[key] || key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* Column 2: Vessel Photo */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-6 flex flex-col h-full min-h-[200px] lg:min-h-0"
      >
        <div className="bg-surface-container-lowest dark:bg-surface-container-lowest rounded-2xl flex-1 min-h-0 p-3 sm:p-4 relative flex flex-col shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="mb-3 shrink-0 border-l-2 border-primary-container pl-3 z-20 pointer-events-none">
            <span className="block text-[9px] uppercase tracking-widest opacity-50 text-on-background dark:text-on-background">
              {language === "zh" ? "航行态势" : "Voyage Snapshot"}
            </span>
            <h2 className="text-xl sm:text-2xl font-headline font-extrabold tracking-tighter text-on-background dark:text-on-background">
              {language === "zh" ? "船队总览" : "Fleet Overview"}
            </h2>
          </div>
          <div className="min-h-0 flex-[1_1_auto] overflow-hidden rounded-xl bg-surface-container-high dark:bg-surface-container-high">
            <img
              src="/image/board.jpg"
              alt={language === "zh" ? "船舶照片" : "Vessel profile"}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-3 grid shrink-0 grid-cols-3 gap-3">
            <DialGauge
              label={t.speedSog}
              value={vesselData.sog.toFixed(1)}
              unit={t.knots}
              max={20}
              icon={<Gauge className="h-4 w-4" />}
              color="#4CD7D0"
            />
            <DialGauge
              label={language === "zh" ? "发动机转速" : "Engine RPM"}
              value={mainEngine.rpm || 0}
              unit="RPM"
              max={1200}
              icon={<RotateCw className="h-4 w-4" />}
              color="#0058bc"
            />
            <DialGauge
              label={language === "zh" ? "发动机温度" : "Engine Temp"}
              value={mainEngine.exhaustTemp?.toFixed(0) || 0}
              unit="°C"
              max={520}
              icon={<Thermometer className="h-4 w-4" />}
              color="#ef4444"
            />
          </div>
        </div>
      </motion.section>

      {/* Column 3: REAL-TIME DATA */}
      <motion.section
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-3 flex flex-col min-h-0 h-full overflow-hidden"
      >
        <div className="bg-on-secondary-fixed dark:bg-surface-container-low text-white dark:text-surface-container rounded-xl p-3 sm:p-4 h-full min-h-0 flex flex-col overflow-hidden relative">
          {/* Settings Button */}
          <button
            onClick={() => setRealtimeModalOpen(true)}
            className="absolute top-2 right-2 p-1.5 hover:bg-white/10 rounded-lg transition-all group z-10"
            title={language === "zh" ? "实时数据设置" : "Real-time Data Settings"}
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <Settings className="w-4 h-4 text-white/60 group-hover:text-[#4CD7D0]" />
            </motion.div>
          </button>

          <h2 className="font-headline font-black text-base sm:text-lg tracking-widest uppercase text-primary-container mb-2 shrink-0">
            {t.realTimeData}
          </h2>

          <div className="space-y-3 flex-1 min-h-0 flex flex-col overflow-y-auto">
            {dataCards.map((card, idx) => (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + idx * 0.08 }}
                className="rounded-lg bg-white/5 p-3"
              >
                <div className="mb-1 flex items-center gap-3">
                  {card.icon}
                  <span className="text-[10px] uppercase tracking-widest opacity-50">{card.label}</span>
                </div>
                {card.custom ? (
                  <div className="space-y-1.5">
                    {navigationAlarms.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-xs font-medium opacity-80 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                          {alert.message}
                        </span>
                        <span className="shrink-0 text-[9px] uppercase text-white/40">{alert.source || t.alarmActive}</span>
                      </div>
                    ))}
                    {navigationAlarms.length === 0 && (
                      <div className="text-xs font-bold text-white/45">{t.noActiveAlarms}</div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-lg font-headline font-black text-primary-container">{card.value}</div>
                    <div className="text-[10px] opacity-60">{card.detail}</div>
                  </>
                )}
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="rounded-lg border border-white/10 bg-white/5 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#4CD7D0] shadow-[0_0_8px_rgba(76,215,208,0.9)]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                    {language === "zh" ? "时间戳更新节点" : "Timestamp Node"}
                  </span>
                </div>
                <span className="rounded-full bg-[#4CD7D0]/15 px-2 py-0.5 text-[9px] font-black uppercase text-[#4CD7D0]">
                  {backendStateLabel}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded bg-black/10 p-2">
                  <div className="uppercase tracking-wider opacity-40">{language === "zh" ? "当前时间戳" : "Current TS"}</div>
                  <div className="mt-1 font-mono font-bold text-primary-container">
                    {latestDataTimestamp?.toLocaleString(language === "zh" ? "zh-CN" : "en-US", { hour12: false }) || "--"}
                  </div>
                </div>
                <div className="rounded bg-black/10 p-2">
                  <div className="uppercase tracking-wider opacity-40">{language === "zh" ? "刷新周期" : "Refresh"}</div>
                  <div className="mt-1 font-mono font-bold text-primary-container">
                    {(realtimeDataConfig.refreshRate / 1000).toFixed(1)}s
                  </div>
                </div>
                <div className="rounded bg-black/10 p-2">
                  <div className="uppercase tracking-wider opacity-40">{language === "zh" ? "下一节点" : "Next Node"}</div>
                  <div className="mt-1 font-mono font-bold text-primary-container">
                    {nextRefreshAt?.toLocaleTimeString(language === "zh" ? "zh-CN" : "en-US", { hour12: false }) || "--"}
                  </div>
                </div>
                <div className="rounded bg-black/10 p-2">
                  <div className="uppercase tracking-wider opacity-40">{language === "zh" ? "数据源" : "Source"}</div>
                  <div className="mt-1 font-mono font-bold text-primary-container">
                    {dataSourceLabel}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Modals */}
      <RealtimeDataConfigModal isOpen={realtimeModalOpen} onClose={() => setRealtimeModalOpen(false)} />
      <SystemStatusConfigModal isOpen={systemModalOpen} onClose={() => setSystemModalOpen(false)} />
    </div>
  );
};

export default NavigationPage;

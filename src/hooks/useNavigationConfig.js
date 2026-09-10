import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// 默认配置值
const defaultRealtimeDataConfig = {
  refreshRate: 1000, // 200ms, 500ms, 1s, 2s 对应 200, 500, 1000, 2000
  smoothingFilter: 0.3, // 0.0-0.9
};

const defaultSystemStatusConfig = {
  subsystems: {
    lubeOilSystem: true,
    coolingWaterSystem: true,
    fuelSystem: true,
    airIntakeSystem: true,
    fireSafetySystem: true,
  },
  displayMode: "grid", // "grid" | "list"
  faultInjectionEnabled: false,
};

// 从 localStorage 加载配置
const loadConfig = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// 保存配置到 localStorage
const saveConfig = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Failed to save config to localStorage:", e);
  }
};

const NavigationConfigContext = createContext(null);

export const NavigationConfigProvider = ({ children }) => {
  // 实时数据配置
  const [realtimeDataConfig, setRealtimeDataConfig] = useState(() =>
    loadConfig("navigation_realtime_config", defaultRealtimeDataConfig)
  );

  // 系统状态配置
  const [systemStatusConfig, setSystemStatusConfig] = useState(() =>
    loadConfig("navigation_system_config", defaultSystemStatusConfig)
  );

  // 持久化配置到 localStorage
  useEffect(() => {
    saveConfig("navigation_realtime_config", realtimeDataConfig);
  }, [realtimeDataConfig]);

  useEffect(() => {
    saveConfig("navigation_system_config", systemStatusConfig);
  }, [systemStatusConfig]);

  // 更新实时数据配置
  const updateRealtimeDataConfig = useCallback((updates) => {
    setRealtimeDataConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  // 更新系统状态配置
  const updateSystemStatusConfig = useCallback((updates) => {
    setSystemStatusConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  // 重置为默认配置
  const resetRealtimeDataConfig = useCallback(() => {
    setRealtimeDataConfig(defaultRealtimeDataConfig);
  }, []);

  const resetSystemStatusConfig = useCallback(() => {
    setSystemStatusConfig(defaultSystemStatusConfig);
  }, []);

  const value = {
    realtimeDataConfig,
    systemStatusConfig,
    updateRealtimeDataConfig,
    updateSystemStatusConfig,
    resetRealtimeDataConfig,
    resetSystemStatusConfig,
  };

  return (
    <NavigationConfigContext.Provider value={value}>
      {children}
    </NavigationConfigContext.Provider>
  );
};

export const useNavigationConfig = () => {
  const context = useContext(NavigationConfigContext);
  if (!context) {
    throw new Error(
      "useNavigationConfig must be used within NavigationConfigProvider"
    );
  }
  return context;
};

// 刷新率选项
export const REFRESH_RATE_OPTIONS = [
  { label: "200ms", value: 200 },
  { label: "500ms", value: 500 },
  { label: "1s", value: 1000 },
  { label: "2s", value: 2000 },
];

// 子系统配置
export const SUBSYSTEM_CONFIG = [
  { key: "lubeOilSystem", labelEn: "Lube Oil System", labelZh: "滑油系统" },
  { key: "coolingWaterSystem", labelEn: "Cooling Water System", labelZh: "冷却水系统" },
  { key: "fuelSystem", labelEn: "Fuel Oil System", labelZh: "燃油系统" },
  { key: "airIntakeSystem", labelEn: "Air Intake System", labelZh: "进排气系统" },
  { key: "fireSafetySystem", labelEn: "Fire & Safety System", labelZh: "安全损管系统" },
];

export { defaultRealtimeDataConfig, defaultSystemStatusConfig };

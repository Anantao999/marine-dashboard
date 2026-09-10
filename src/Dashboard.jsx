import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  CircleUserRound,
  Maximize2,
  Minimize2,
  Power,
  RotateCcw,
  Search,
  Settings,
} from "lucide-react";
import MainEngine from "./MainEngine";
import NauticalCharts from "./NauticalCharts";
import Alarms from "./Alarms";
import Trend from "./trend";
import EngineSystems from "./EngineSystems";
import ConfigPage from "./ConfigPage";
import NavigationPage from "./NavigationPage";
import { useFullscreen } from "./hooks/useFullscreen";
import { LanguageProvider, useLanguage } from "./hooks/useLanguage";
import { NavigationConfigProvider } from "./hooks/useNavigationConfig";
import { UnitSystemProvider } from "./hooks/useUnitSystem";
import { FocusModeProvider, useFocusMode } from "./hooks/useFocusMode";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import GlobalAlarmBanner from "./components/GlobalAlarmBanner";
import LoginPage from "./components/LoginPage";
import AccessManagement from "./components/AccessManagement";
import ChangePasswordModal from "./components/ChangePasswordModal";
import { PERMISSIONS } from "./auth/permissions";

const AUTH_REQUIRED = (process.env.REACT_APP_AUTH_REQUIRED || "true").toLowerCase() === "true";

// Search Modal Component
const SearchModal = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState("");
  const recentSearches = language === "zh"
    ? ["发动机温度", "报警历史", "电站负荷"]
    : ["Engine Temperature", "Alarm History", "Power Station Load"];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-[#1A1B1F] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-gray-400">search</span>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400"
                autoFocus
              />
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-gray-400">close</span>
              </button>
            </div>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            {query === "" ? (
              <>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t.recentSearches}
                </h3>
                <div className="space-y-2">
                  {recentSearches.map((item, idx) => (
                    <button
                      key={idx}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-gray-400 text-sm">history</span>
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                {t.noResults}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Settings Modal Component
const SettingsModal = ({ isOpen, onClose, theme, setTheme }) => {
  const { t, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState("general");

  if (!isOpen) return null;

  const tabs = [
    { id: "general", label: t.general, icon: "settings" },
    { id: "display", label: t.display, icon: "palette" },
    { id: "notifications", label: t.notifications, icon: "notifications" },
    { id: "about", label: t.about, icon: "info" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-[#1A1B1F] rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.settings}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-gray-400">close</span>
            </button>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-40 border-r border-gray-200 dark:border-gray-700 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                    activeTab === tab.id
                      ? "bg-[#4CD7D0] text-[#00201e] font-bold"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-4">
              {activeTab === "general" && (
                <div className="space-y-4">
                  {/* Language Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {t.language}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLanguage("en")}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                          language === "en"
                            ? "bg-[#4CD7D0] text-[#00201e]"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {t.english}
                      </button>
                      <button
                        onClick={() => setLanguage("zh")}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                          language === "zh"
                            ? "bg-[#4CD7D0] text-[#00201e]"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {t.chinese}
                      </button>
                    </div>
                  </div>

                  {/* Theme Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {t.theme}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setTheme("light")}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors border-2 ${
                          theme === "light"
                            ? "border-[#4CD7D0] bg-[#4CD7D0]/10 text-[#00201e] dark:text-[#4CD7D0] dark:bg-[#4CD7D0]/10"
                            : "border-transparent bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {t.lightMode}
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors border-2 ${
                          theme === "dark"
                            ? "border-[#4CD7D0] bg-[#4CD7D0]/10 text-[#00201e] dark:text-[#4CD7D0] dark:bg-[#4CD7D0]/10"
                            : "border-transparent bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {t.darkMode}
                      </button>
                      <button
                        onClick={() => setTheme("system")}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors border-2 ${
                          theme === "system"
                            ? "border-[#4CD7D0] bg-[#4CD7D0]/10 text-[#00201e] dark:text-[#4CD7D0] dark:bg-[#4CD7D0]/10"
                            : "border-transparent bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {t.systemDefault}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "display" && (
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  {language === "zh" ? "显示设置功能待接入。" : "Display settings coming soon."}
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  {language === "zh" ? "通知设置功能待接入。" : "Notification settings coming soon."}
                </div>
              )}

              {activeTab === "about" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#4CD7D0] to-[#0058bc] rounded-2xl flex items-center justify-center">
                      <span className="text-white font-black text-xl">AM</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Livewell</h3>
                      <p className="text-sm text-gray-500">{t.version} 1.0.0</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {language === "zh" ? "船舶综合监测系统" : "Advanced Marine Vessel Monitoring System"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Account Modal Component
const AccountModal = ({ isOpen, onClose, user, onLogout, onChangePassword, onAccessManagement, canManageAccess }) => {
  const { t, language } = useLanguage();
  if (!isOpen) return null;
  const isZh = language === "zh";

  const displayName = user?.displayName || user?.username || t.userName;
  const roleText = user?.roles?.join(" / ") || t.userRole;
  const userId = user?.userId || t.userId;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-[#1A1B1F] rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-[#4CD7D0] to-[#0058bc] p-6 text-center">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-black text-[#0058bc]">{initials || "AM"}</span>
            </div>
            <h3 className="text-xl font-bold text-white">{displayName}</h3>
            <p className="text-white/80 text-sm">{roleText}</p>
            <p className="text-white/60 text-xs mt-1">{userId}</p>
          </div>

          {/* Menu Items */}
          <div className="p-4 space-y-2">
            <button onClick={() => { onClose(); onChangePassword(); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined text-[#4CD7D0]">key</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{isZh ? "修改密码" : "Change Password"}</span>
            </button>
            {canManageAccess && (
              <button onClick={() => { onClose(); onAccessManagement(); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined text-[#4CD7D0]">admin_panel_settings</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{isZh ? "用户与权限管理" : "Users & Permissions"}</span>
              </button>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
            >
              <span className="material-symbols-outlined text-red-500">logout</span>
              <span className="text-red-500 font-medium">{t.logout}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const SystemPowerConfirmModal = ({ action, onClose, onConfirm }) => {
  const { language } = useLanguage();
  const [confirmed, setConfirmed] = useState(false);
  if (!action) return null;

  const isZh = language === "zh";
  const isShutdown = action === "shutdown";
  const copy = {
    title: isShutdown ? (isZh ? "确认关机" : "Confirm Shutdown") : (isZh ? "确认重启" : "Confirm Restart"),
    actionLabel: isShutdown ? (isZh ? "关机" : "Shutdown") : (isZh ? "重启" : "Restart"),
    description: isShutdown
      ? (isZh ? "该操作用于关闭船端监控主机。请确认当前没有正在进行的维护操作。" : "This action is intended to shut down the vessel monitoring host. Confirm that no maintenance task is in progress.")
      : (isZh ? "该操作用于重启船端监控主机。重启期间前端页面和数据刷新可能会短暂中断。" : "This action is intended to restart the vessel monitoring host. The dashboard and data refresh may be briefly interrupted."),
    placeholder: isZh ? "当前仅完成前端二次确认入口，后端维护接口接入后会发送真实指令。" : "This is the front-end confirmation entry. A real command will be sent after the backend maintenance API is connected.",
    confirmText: isZh ? "我已了解影响，继续执行" : "I understand the impact and want to continue",
    cancel: isZh ? "取消" : "Cancel",
    confirm: isShutdown ? (isZh ? "确认关机" : "Confirm Shutdown") : (isZh ? "确认重启" : "Confirm Restart"),
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-md overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1A1B1F]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className={`p-5 text-white ${isShutdown ? "bg-red-600" : "bg-amber-500"}`}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl">{isShutdown ? "power_settings_new" : "restart_alt"}</span>
              <div>
                <h2 className="text-lg font-black">{copy.title}</h2>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">{copy.actionLabel}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <p className="text-sm leading-6 text-slate-700 dark:text-on-surface">{copy.description}</p>
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-on-surface-variant">
              {copy.placeholder}
            </p>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:text-on-surface">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#0058bc]"
              />
              <span>{copy.confirmText}</span>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-lg px-4 text-xs font-black text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/10"
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                disabled={!confirmed}
                onClick={() => onConfirm(action)}
                className={`h-10 rounded-lg px-5 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isShutdown ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {copy.confirm}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const InnerDashboard = () => {
  const { t, language } = useLanguage();
  const { focusMode, toggleFocusMode } = useFocusMode();
  const { user, logout, hasPermission } = useAuth();
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);

    root.classList.toggle("dark", shouldUseDark);
    root.style.colorScheme = shouldUseDark ? "dark" : "light";
  }, [theme]);
  const [activeView, setActiveView] = useState("navigation");
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [systemPowerAction, setSystemPowerAction] = useState(null);
  const [systemPowerNotice, setSystemPowerNotice] = useState("");
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  // Keyboard shortcut for fullscreen (F11)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullscreen]);

  const navButtons = useMemo(
    () => [
      { key: "main-engine", label: t.mainEngine, permission: PERMISSIONS.ENGINE_MAIN_READ },
      { key: "engine-systems", label: t.engineSystems, permission: PERMISSIONS.ENGINE_SYSTEM_READ },
      { key: "navigation", label: t.navigation, permission: PERMISSIONS.NAVIGATION_READ },
      { key: "alarms", label: t.alarms, permission: PERMISSIONS.ALARM_EVENT_READ },
      { key: "trend", label: t.trend, permission: PERMISSIONS.TREND_READ },
      { key: "nautical-charts", label: t.nauticalCharts, permission: PERMISSIONS.CHART_READ },
      { key: "config", label: t.configParameters, permission: PERMISSIONS.CONFIG_POINT_TABLE_READ },
    ].filter((item) => !item.permission || hasPermission(item.permission)),
    [hasPermission, t]
  );

  useEffect(() => {
    if (activeView === "access-management" && !hasPermission(PERMISSIONS.USER_READ)) {
      setActiveView(navButtons[0]?.key || "navigation");
      return;
    }
    if (activeView !== "access-management" && !navButtons.some((item) => item.key === activeView)) {
      setActiveView(navButtons[0]?.key || "navigation");
    }
  }, [activeView, hasPermission, navButtons]);

  useEffect(() => {
    if (!systemPowerNotice) return undefined;
    const timer = window.setTimeout(() => setSystemPowerNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [systemPowerNotice]);

  const handleSystemPowerConfirm = (action) => {
    const isShutdown = action === "shutdown";
    setSystemPowerAction(null);
    setSystemPowerNotice(
      language === "zh"
        ? `${isShutdown ? "关机" : "重启"}请求已确认：当前为前端确认入口，等待后端维护接口接入。`
        : `${isShutdown ? "Shutdown" : "Restart"} request confirmed. This front-end entry is waiting for the backend maintenance API.`
    );
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden bg-[#F1F3F5] bg-[radial-gradient(#d1d5db_0.5px,transparent_0.5px)] [background-size:24px_24px] dark:bg-grid font-body">
        {/* TopNavBar */}
        <header className="w-full shrink-0 pt-2 px-2 relative z-50">
          <nav className="bg-[#F2F4F6] dark:bg-surface-container rounded-full mx-2 shadow-[0_16px_32px_rgba(25,28,30,0.06)] dark:shadow-[0_16px_32px_rgba(0,0,0,0.3)] flex justify-between items-center max-w-[1400px] lg:mx-auto px-4 h-12 sm:h-14">
            <div className="flex items-center h-full">
              <img
                src="/image/logo.png"
                alt={language === "zh" ? "标志" : "Logo"}
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </div>
            <div className="hidden md:flex items-center gap-2">
              {navButtons.map((btn) => (
                <button
                  key={btn.key}
                  className={`${
                    activeView === btn.key
                      ? "bg-[#1A1B1F] dark:bg-[#4CD7D0] text-white dark:text-[#00201e] rounded-full"
                      : "text-[#1A1B1F] dark:text-[#F8F9FB] opacity-70 rounded-full"
                  } px-3 sm:px-6 py-1.5 text-xs sm:text-sm transition-all font-bold tracking-wider uppercase scale-100 active:scale-95 duration-150 hover:opacity-100 hover:scale-105`}
                  onClick={() => setActiveView(btn.key)}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[#4CD7D0]">
              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
                title={isFullscreen ? (language === "zh" ? "退出全屏" : "Exit Fullscreen") : (language === "zh" ? "全屏" : "Fullscreen")}
                aria-label={isFullscreen ? (language === "zh" ? "退出全屏" : "Exit Fullscreen") : (language === "zh" ? "全屏" : "Fullscreen")}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </button>
              <button
                onClick={toggleFocusMode}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 ${
                  focusMode ? "text-blue-600 dark:text-blue-300" : ""
                }`}
                title={language === "zh" ? "专注模式" : "Focus Mode"}
                aria-label={language === "zh" ? "专注模式" : "Focus Mode"}
              >
                {focusMode ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setSystemPowerAction("restart")}
                className="flex h-8 w-8 items-center justify-center rounded-full text-amber-500 transition-transform hover:scale-110"
                title={language === "zh" ? "系统重启" : "System Restart"}
                aria-label={language === "zh" ? "系统重启" : "System Restart"}
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                onClick={() => setSystemPowerAction("shutdown")}
                className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition-transform hover:scale-110"
                title={language === "zh" ? "系统关机" : "System Shutdown"}
                aria-label={language === "zh" ? "系统关机" : "System Shutdown"}
              >
                <Power className="h-5 w-5" />
              </button>
              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
                title={t.search}
                aria-label={t.search}
              >
                <Search className="h-5 w-5" />
              </button>
              {/* Settings Button */}
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
                title={t.settings}
                aria-label={t.settings}
              >
                <Settings className="h-5 w-5" />
              </button>
              {/* Account Button */}
              <button
                onClick={() => setAccountOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
                title={t.account}
                aria-label={t.account}
              >
                <CircleUserRound className="h-5 w-5" />
              </button>
            </div>
          </nav>
        </header>

        {/* Modals */}
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          theme={theme}
          setTheme={setTheme}
        />
        <AccountModal
          isOpen={accountOpen}
          onClose={() => setAccountOpen(false)}
          user={user}
          onLogout={logout}
          onChangePassword={() => setPasswordOpen(true)}
          onAccessManagement={() => setActiveView("access-management")}
          canManageAccess={hasPermission(PERMISSIONS.USER_READ)}
        />
        <SystemPowerConfirmModal
          action={systemPowerAction}
          onClose={() => setSystemPowerAction(null)}
          onConfirm={handleSystemPowerConfirm}
        />
        <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} onChanged={logout} />
        <GlobalAlarmBanner onOpenAlarms={() => setActiveView("alarms")} />
        {systemPowerNotice && (
          <div className="fixed right-4 top-20 z-[75] max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900 shadow-xl dark:border-amber-400/20 dark:bg-amber-950/80 dark:text-amber-100">
            {systemPowerNotice}
          </div>
        )}

        {/* Main Content */}
        {activeView === "access-management" ? (
          <AccessManagement onExit={() => setActiveView("navigation")} />
        ) : activeView === "main-engine" ? (
          <MainEngine />
        ) : activeView === "nautical-charts" ? (
          <NauticalCharts />
        ) : activeView === "alarms" ? (
          <Alarms />
        ) : activeView === "trend" ? (
          <Trend />
        ) : activeView === "engine-systems" ? (
          <EngineSystems />
        ) : activeView === "config" ? (
          <ConfigPage theme={theme} setTheme={setTheme} />
        ) : (
          <NavigationPage />
        )}

        {/* Bottom Nav Bar */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="shrink-0 w-full z-10 bg-[#F2F4F6] dark:bg-surface-container border-t border-black/5 dark:border-white/5 h-2 px-2"
        />
      </div>
  );
};

const AuthenticatedDashboard = () => {
  const { isAuthenticated, status } = useAuth();

  if (AUTH_REQUIRED && status === "validating") {
    return <div className="flex h-[100dvh] items-center justify-center bg-[#f1f3f5] text-sm font-bold text-slate-500">正在验证登录状态...</div>;
  }

  if (AUTH_REQUIRED && !isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <UnitSystemProvider>
      <FocusModeProvider>
        <NavigationConfigProvider>
          <InnerDashboard />
        </NavigationConfigProvider>
      </FocusModeProvider>
    </UnitSystemProvider>
  );
};

const Dashboard = () => {
  const [language, setLanguage] = useState("en");
  return (
    <LanguageProvider language={language} setLanguage={setLanguage}>
      <AuthProvider>
        <AuthenticatedDashboard />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default Dashboard;

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, RotateCcw, Check, AlertTriangle } from "lucide-react";
import {
  useNavigationConfig,
  SUBSYSTEM_CONFIG,
  defaultSystemStatusConfig,
} from "../hooks/useNavigationConfig";
import { useLanguage } from "../hooks/useLanguage";

const SystemStatusConfigModal = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const {
    systemStatusConfig,
    updateSystemStatusConfig,
  } = useNavigationConfig();

  const [localConfig, setLocalConfig] = useState(systemStatusConfig);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFaultWarning, setShowFaultWarning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(systemStatusConfig);
    }
  }, [isOpen, systemStatusConfig]);

  useEffect(() => {
    if (localConfig.faultInjectionEnabled) {
      setShowFaultWarning(true);
      const timer = setTimeout(() => setShowFaultWarning(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [localConfig.faultInjectionEnabled]);

  const handleApply = () => {
    updateSystemStatusConfig(localConfig);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setLocalConfig(defaultSystemStatusConfig);
  };

  const handleCancel = () => {
    setLocalConfig(systemStatusConfig);
    onClose();
  };

  const toggleSubsystem = (key) => {
    setLocalConfig({
      ...localConfig,
      subsystems: {
        ...localConfig.subsystems,
        [key]: !localConfig.subsystems[key],
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0a1628] border border-[#1e3a5f] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1B365D] to-[#0d2137] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4CD7D0]/20 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#4CD7D0]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {language === "zh" ? "系统状态配置" : "SYSTEM STATUS CONFIG"}
                  </h2>
                  <p className="text-xs text-white/60">
                    {language === "zh" ? "子系统显示与布局设置" : "Subsystem Display & Layout Settings"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* 子系统可见性开关 */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#4CD7D0]">
                  <span className="material-symbols-outlined text-base">visibility</span>
                  {language === "zh" ? "子系统显示配置" : "Sub-System Visibility"}
                </label>
                <div className="bg-[#0f2744] rounded-xl p-4 border border-[#1e3a5f] space-y-3">
                  {SUBSYSTEM_CONFIG.map((subsystem) => (
                    <div
                      key={subsystem.key}
                      className="flex items-center justify-between py-2 border-b border-[#1e3a5f] last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/90">
                          {language === "zh" ? subsystem.labelZh : subsystem.labelEn}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleSubsystem(subsystem.key)}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                          localConfig.subsystems[subsystem.key]
                            ? "bg-[#4CD7D0]"
                            : "bg-[#2a4066]"
                        }`}
                      >
                        <motion.div
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                          animate={{ left: localConfig.subsystems[subsystem.key] ? 26 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 布局模式切换 */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#4CD7D0]">
                  <span className="material-symbols-outlined text-base">grid_view</span>
                  {language === "zh" ? "排版模式切换" : "Display Layout Mode"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLocalConfig({ ...localConfig, displayMode: "grid" })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      localConfig.displayMode === "grid"
                        ? "border-[#4CD7D0] bg-[#4CD7D0]/10"
                        : "border-[#1e3a5f] bg-[#0f2744] hover:border-[#4CD7D0]/50"
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      <div className="h-8 bg-[#4CD7D0]/30 rounded" />
                      <div className="h-8 bg-[#4CD7D0]/30 rounded" />
                      <div className="h-8 bg-[#4CD7D0]/30 rounded" />
                      <div className="h-8 bg-[#4CD7D0]/30 rounded" />
                    </div>
                    <span className={`text-xs font-medium ${
                      localConfig.displayMode === "grid" ? "text-[#4CD7D0]" : "text-white/70"
                    }`}>
                      {language === "zh" ? "网格矩阵视图" : "Grid Array View"}
                    </span>
                  </button>
                  <button
                    onClick={() => setLocalConfig({ ...localConfig, displayMode: "list" })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      localConfig.displayMode === "list"
                        ? "border-[#4CD7D0] bg-[#4CD7D0]/10"
                        : "border-[#1e3a5f] bg-[#0f2744] hover:border-[#4CD7D0]/50"
                    }`}
                  >
                    <div className="space-y-1.5 mb-2">
                      <div className="h-3 bg-[#4CD7D0]/30 rounded w-full" />
                      <div className="h-3 bg-[#4CD7D0]/30 rounded w-full" />
                      <div className="h-3 bg-[#4CD7D0]/30 rounded w-full" />
                      <div className="h-3 bg-[#4CD7D0]/30 rounded w-full" />
                    </div>
                    <span className={`text-xs font-medium ${
                      localConfig.displayMode === "list" ? "text-[#4CD7D0]" : "text-white/70"
                    }`}>
                      {language === "zh" ? "紧凑列表视图" : "Compact List View"}
                    </span>
                  </button>
                </div>
              </div>

              {/* 故障模拟总开关 */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#FFB020]">
                  <AlertTriangle className="w-4 h-4" />
                  {language === "zh" ? "演示故障模拟总开关" : "Demo Fault Injection Switch"}
                </label>
                <div className="bg-[#0f2744] rounded-xl p-4 border border-[#1e3a5f]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/90 mb-1">
                        {language === "zh" ? "启用故障注入模拟" : "Enable Fault Injection Simulation"}
                      </p>
                      <p className="text-xs text-white/50">
                        {language === "zh"
                          ? "开启后将模拟生成紧急故障报警"
                          : "Enabling will simulate emergency fault alarms"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setLocalConfig({
                          ...localConfig,
                          faultInjectionEnabled: !localConfig.faultInjectionEnabled,
                        })
                      }
                      className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                        localConfig.faultInjectionEnabled
                          ? "bg-[#FF4444]"
                          : "bg-[#2a4066]"
                      }`}
                    >
                      <motion.div
                        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                        animate={{ left: localConfig.faultInjectionEnabled ? 30 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* 警告提示 */}
                  <AnimatePresence>
                    {showFaultWarning && localConfig.faultInjectionEnabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-2 bg-[#FF4444]/20 border border-[#FF4444]/50 rounded-lg overflow-hidden"
                      >
                        <p className="text-xs text-[#FF6B6B] flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3" />
                          {language === "zh"
                            ? "警告: 故障模拟已启用! 系统将生成测试报警"
                            : "Warning: Fault simulation enabled! Test alarms will be generated"}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-[#0f2744] px-5 py-4 flex items-center justify-between border-t border-[#1e3a5f]">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                {language === "zh" ? "恢复默认" : "Reset"}
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {language === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  onClick={handleApply}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-[#4CD7D0] text-[#00201e] hover:bg-[#5de0d8] transition-colors shadow-[0_0_15px_rgba(76,215,208,0.3)]"
                >
                  <Check className="w-4 h-4" />
                  {language === "zh" ? "应用并保存" : "Apply & Save"}
                </button>
              </div>
            </div>

            {/* Success Toast */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-0 flex items-center justify-center bg-[#0a1628]/90"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-[#4CD7D0]/20 flex items-center justify-center">
                      <Check className="w-8 h-8 text-[#4CD7D0]" />
                    </div>
                    <span className="text-white font-medium">
                      {language === "zh" ? "配置已保存!" : "Settings Saved!"}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SystemStatusConfigModal;

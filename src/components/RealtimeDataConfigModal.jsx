import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, RotateCcw, Check } from "lucide-react";
import { useNavigationConfig, REFRESH_RATE_OPTIONS, defaultRealtimeDataConfig } from "../hooks/useNavigationConfig";
import { useLanguage } from "../hooks/useLanguage";

const RealtimeDataConfigModal = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const {
    realtimeDataConfig,
    updateRealtimeDataConfig,
  } = useNavigationConfig();

  const [localConfig, setLocalConfig] = useState(realtimeDataConfig);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(realtimeDataConfig);
    }
  }, [isOpen, realtimeDataConfig]);

  const handleApply = () => {
    updateRealtimeDataConfig(localConfig);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setLocalConfig(defaultRealtimeDataConfig);
  };

  const handleCancel = () => {
    setLocalConfig(realtimeDataConfig);
    onClose();
  };

  const refreshRateLabels = {
    "200ms": language === "zh" ? "200毫秒" : "200ms",
    "500ms": language === "zh" ? "500毫秒" : "500ms",
    "1s": language === "zh" ? "1秒" : "1s",
    "2s": language === "zh" ? "2秒" : "2s",
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
                    {language === "zh" ? "常用参数配置" : "COMMON PARAMETERS"}
                  </h2>
                  <p className="text-xs text-white/60">
                    {language === "zh" ? "船舶运行常用监测参数设置" : "Common Marine Monitoring Parameters"}
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
              {/* 刷新频率 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#4CD7D0]">
                  <span className="material-symbols-outlined text-base">timer</span>
                  {language === "zh" ? "数据刷新频率" : "Refresh Rate"}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {REFRESH_RATE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLocalConfig({ ...localConfig, refreshRate: option.value })}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all border ${
                        localConfig.refreshRate === option.value
                          ? "bg-[#4CD7D0] text-[#00201e] border-[#4CD7D0] shadow-[0_0_12px_rgba(76,215,208,0.3)]"
                          : "bg-[#0f2744] text-white/70 border-[#1e3a5f] hover:border-[#4CD7D0]/50"
                      }`}
                    >
                      {refreshRateLabels[option.label]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 平滑滤波系数 */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-[#4CD7D0]">
                  <span className="material-symbols-outlined text-base">blur_on</span>
                  {language === "zh" ? "时序数据平滑滤波" : "Smoothing Filter"}
                </label>
                <div className="bg-[#0f2744] rounded-xl p-3 border border-[#1e3a5f]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/50">
                      {language === "zh" ? "0.0=原始数据, 0.9=高度平滑" : "0.0=Raw, 0.9=Highly Smoothed"}
                    </span>
                    <span className="text-lg font-mono font-bold text-[#4CD7D0]">
                      {localConfig.smoothingFilter.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.9}
                    step={0.1}
                    value={localConfig.smoothingFilter}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, smoothingFilter: Number(e.target.value) })
                    }
                    className="w-full h-2 bg-[#1e3a5f] rounded-full appearance-none cursor-pointer accent-[#4CD7D0]
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#4CD7D0]
                      [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(76,215,208,0.5)] [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>{language === "zh" ? "原始" : "Raw"}</span>
                    <span>{language === "zh" ? "高度平滑" : "Smoothed"}</span>
                  </div>
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

export default RealtimeDataConfigModal;

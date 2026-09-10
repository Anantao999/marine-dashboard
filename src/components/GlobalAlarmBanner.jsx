import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bell, BellOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlarmsData } from "../hooks/useRealTimeData";
import { useLanguage } from "../hooks/useLanguage";
import { useFocusMode } from "../hooks/useFocusMode";

const playAlarmTone = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  oscillator.frequency.setValueAtTime(660, context.currentTime + 0.12);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.05, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.28);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.3);
  oscillator.onended = () => context.close();
};

const GlobalAlarmBanner = ({ onOpenAlarms }) => {
  const { t, language } = useLanguage();
  const { focusMode, alarmMuted, toggleFocusMode } = useFocusMode();
  const { alarms, resource } = useAlarmsData(5000, language);
  const previousCountRef = useRef(0);
  const [expandedCount, setExpandedCount] = useState(3);

  const activeAlarms = useMemo(
    () =>
      alarms.active
        .filter((alarm) => !alarm.acknowledged)
        .sort((a, b) => {
          const aTime = new Date(a.timestamp || a.occurredAt || a.time || 0).getTime();
          const bTime = new Date(b.timestamp || b.occurredAt || b.time || 0).getTime();
          if (Number.isFinite(aTime) && Number.isFinite(bTime)) return bTime - aTime;
          return 0;
        }),
    [alarms.active]
  );

  const topAlarms = activeAlarms.slice(0, expandedCount);
  const hasAlarms = topAlarms.length > 0;
  const nextExpandedCount = expandedCount === 3 ? 5 : expandedCount === 5 ? 10 : 3;

  useEffect(() => {
    if (!alarmMuted && activeAlarms.length > previousCountRef.current && activeAlarms.length > 0) {
      try {
        playAlarmTone();
      } catch {
        // Browser autoplay policies can block synthetic tones until interaction.
      }
    }
    previousCountRef.current = activeAlarms.length;
  }, [activeAlarms.length, alarmMuted]);

  if (resource.status === "error") {
    return (
      <div className="mx-auto mt-2 w-[calc(100%-2rem)] max-w-[1400px] shrink-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
        {language === "zh" ? "报警接口连接失败，当前报警状态不可用。" : "Alarm service unavailable. Current alarm state is unknown."}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {hasAlarms && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mx-auto mt-2 w-[calc(100%-2rem)] max-w-[1400px] shrink-0 rounded-lg border border-red-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur dark:border-red-500/40 dark:bg-[#15171b]/95"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {language === "zh" ? "简易报警" : "Alarm"}
              </span>
              <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold dark:bg-[#3b1f25] dark:text-red-100">
                {activeAlarms.length}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {topAlarms.map((alarm) => (
                <button
                  key={alarm.id}
                  type="button"
                  onClick={onOpenAlarms}
                  className="max-w-full min-w-0 rounded bg-red-50 px-2 py-1 text-left text-[11px] transition hover:bg-red-100 dark:bg-[#3b1f25] dark:hover:bg-[#4a242d] sm:max-w-[20rem]"
                >
                  <span className="font-bold text-red-700 dark:text-red-100">{alarm.source}</span>
                  <span className="mx-1 text-red-300 dark:text-red-200">/</span>
                  <span className="text-red-600 dark:text-red-100">{alarm.message}</span>
                </button>
              ))}
            </div>

            {activeAlarms.length > 3 && (
              <button
                type="button"
                onClick={() => setExpandedCount(nextExpandedCount)}
                className="rounded-full border border-red-200 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-700 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-200 dark:hover:bg-red-900/20"
                title={language === "zh" ? "切换报警条显示数量" : "Change alarm count"}
              >
                {expandedCount === 10 ? "3" : `+${nextExpandedCount}`}
              </button>
            )}

            <button
              onClick={toggleFocusMode}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                focusMode
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-surface-container-high dark:text-on-surface"
              }`}
              title={language === "zh" ? "专注模式静音" : "Focus mode mutes alarms"}
            >
              {focusMode ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
              {focusMode ? (language === "zh" ? "已静音" : "Muted") : (language === "zh" ? "有声" : "Sound")}
            </button>
            {onOpenAlarms && (
              <button
                onClick={onOpenAlarms}
                className="rounded-full bg-[#1A1B1F] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-[#0058bc] dark:bg-[#4CD7D0] dark:text-[#00201e]"
              >
                {t.openAlarmCenter}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalAlarmBanner;

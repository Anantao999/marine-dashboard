import React from "react";
import { motion } from "framer-motion";
import { useAlarmState, ALARM_STATUS, ALARM_COLORS } from "../hooks/useAlarmState";
import { useLanguage } from "../hooks/useLanguage";

/**
 * AlarmBadge — unified alarm indicator using state machine colors
 *
 * Props:
 *   alarm       — alarm object { type, priority, acknowledged, resolved, status }
 *   size        — 'sm' | 'md' | 'lg' (default 'md')
 *   showLabel   — boolean, show text label (default false)
 *   pulse       — override pulse behavior
 *   onClick     — optional click handler
 */
export const AlarmBadge = ({
  alarm,
  size = "md",
  showLabel = false,
  pulse,
  onClick,
  className = "",
}) => {
  const { language } = useLanguage();
  const { color, bgColor, borderColor, glowColor, isPulsing, status } = useAlarmState(alarm);
  const zh = language === "zh";

  const shouldPulse = pulse !== undefined ? pulse : isPulsing;

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const labelSize = {
    sm: "text-[8px]",
    md: "text-[9px]",
    lg: "text-[10px]",
  };

  const statusLabels = {
    [ALARM_STATUS.UNCONFIRMED]: zh ? "报警" : "ALARM",
    [ALARM_STATUS.WARNING]: zh ? "预警" : "WARN",
    [ALARM_STATUS.ACKNOWLEDGED]: zh ? "已确认" : "ACK",
    [ALARM_STATUS.RESOLVED]: zh ? "正常" : "OK",
  };

  const badge = (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {shouldPulse ? (
        <motion.div
          className="rounded-full shrink-0"
          style={{
            width: size === "sm" ? 8 : size === "md" ? 12 : 16,
            height: size === "sm" ? 8 : size === "md" ? 12 : 16,
            backgroundColor: color,
            boxShadow: `0 0 0 0 ${glowColor}`,
          }}
          animate={{
            boxShadow: [
              `0 0 0 0 ${glowColor}`,
              `0 0 0 6px transparent`,
              `0 0 0 0 ${glowColor}`,
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ) : (
        <div
          className={`rounded-full shrink-0 ${sizeClasses[size]}`}
          style={{ backgroundColor: color }}
        />
      )}
      {showLabel && (
        <span
          className={`font-bold uppercase tracking-wider ${labelSize[size]}`}
          style={{ color }}
        >
          {statusLabels[status]}
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`cursor-pointer hover:opacity-80 transition-opacity ${shouldPulse ? "animate-pulse" : ""}`}
      >
        {badge}
      </button>
    );
  }

  return badge;
};

/**
 * AlarmDot — simple pulsing dot for inline use
 */
export const AlarmDot = ({ alarm, className = "" }) => (
  <AlarmBadge alarm={alarm} size="sm" className={className} />
);

/**
 * AlarmPill — colored pill badge with label
 */
export const AlarmPill = ({ alarm, className = "" }) => {
  const { language } = useLanguage();
  const { color, bgColor, borderColor, status, isPulsing } = useAlarmState(alarm);
  const zh = language === "zh";

  const statusLabels = {
    [ALARM_STATUS.UNCONFIRMED]: zh ? "报警" : "ALARM",
    [ALARM_STATUS.WARNING]: zh ? "预警" : "WARNING",
    [ALARM_STATUS.ACKNOWLEDGED]: zh ? "已确认" : "ACK",
    [ALARM_STATUS.RESOLVED]: zh ? "正常" : "NORMAL",
  };

  return (
    <motion.div
      initial={isPulsing ? { scale: 1.05 } : { scale: 1 }}
      animate={isPulsing ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={isPulsing ? { duration: 1.5, repeat: Infinity } : {}}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border font-bold uppercase tracking-wider text-[9px] ${className}`}
      style={{
        backgroundColor: bgColor,
        borderColor: color,
        color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {statusLabels[status]}
    </motion.div>
  );
};

/**
 * AlarmRow — full alarm list row with state machine styling
 */
export const AlarmRow = ({ alarm, onAcknowledge, onResolve }) => {
  const { language } = useLanguage();
  const { color, bgColor, borderColor, textColor, glowColor, isPulsing, status, isResolved } =
    useAlarmState(alarm);
  const zh = language === "zh";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:opacity-90 ${
        isPulsing ? "animate-pulse" : ""
      }`}
      style={{
        backgroundColor: bgColor,
        borderColor: isPulsing ? color : "transparent",
        borderWidth: isPulsing ? "2px" : "1px",
      }}
      onClick={() => !isResolved && onAcknowledge && onAcknowledge(alarm.id)}
    >
      {/* Status indicator dot */}
      <motion.div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        animate={
          isPulsing
            ? {
                boxShadow: [
                  `0 0 0 0 ${glowColor}`,
                  `0 0 0 6px transparent`,
                  `0 0 0 0 ${glowColor}`,
                ],
              }
            : {}
        }
        transition={
          isPulsing
            ? { duration: 1.5, repeat: Infinity, ease: "easeOut" }
            : {}
        }
      />

      {/* Alarm info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: textColor }}>
          {alarm.message}
        </p>
        <p className="text-[11px] text-gray-500 dark:text-on-surface-variant mt-0.5">
          {alarm.source} · {alarm.time}
        </p>
      </div>

      {/* Status pill */}
      <AlarmPill alarm={alarm} />

      {/* Action buttons */}
      {!isResolved && (
        <div className="flex gap-1 shrink-0">
          {!alarm.acknowledged && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge && onAcknowledge(alarm.id);
              }}
              className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase border transition-colors"
              style={{ borderColor: color, color }}
            >
              {zh ? "确认" : "ACK"}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResolve && onResolve(alarm.id);
            }}
            className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase border border-green-500 text-green-600 transition-colors hover:bg-green-50"
          >
            {zh ? "清除" : "CLR"}
          </button>
        </div>
      )}
    </motion.div>
  );
};

/**
 * AlarmStateMachine Hook
 *
 * Unified alarm state machine with the following color coding:
 *
 * [Unconfirmed Alarm]     -> RED    (#ba1a1a) - Pulse flash
 * [Warning]              -> YELLOW (#f59e0b) - Solid
 * [Muted & Acknowledged]  -> BLUE   (#0058bc) - Solid
 * [Resolved / Normal]     -> GREEN  (#16a34a) - Solid
 *
 * Usage:
 *   const alarmState = useAlarmState(alarm);
 *   // alarmState.status  -> 'unconfirmed' | 'warning' | 'acknowledged' | 'resolved'
 *   // alarmState.color    -> CSS color string
 *   // alarmState.bgColor  -> CSS background color
 *   // alarmState.isActive -> boolean (is it flashing)
 *   // alarmState.isResolved -> boolean
 */

import { useState, useEffect, useCallback } from "react";

export const ALARM_STATUS = {
  UNCONFIRMED: "unconfirmed",   // Red + pulse (highest priority, unacknowledged)
  WARNING: "warning",            // Yellow + solid
  ACKNOWLEDGED: "acknowledged",  // Blue + solid (muted/acknowledged)
  RESOLVED: "resolved",          // Green + solid (normal)
};

// Priority order: unconfirmed > warning > acknowledged > resolved
const PRIORITY_ORDER = {
  [ALARM_STATUS.UNCONFIRMED]: 3,
  [ALARM_STATUS.WARNING]: 2,
  [ALARM_STATUS.ACKNOWLEDGED]: 1,
  [ALARM_STATUS.RESOLVED]: 0,
};

export const ALARM_COLORS = {
  [ALARM_STATUS.UNCONFIRMED]: {
    color: "#ba1a1a",
    bg: "rgba(186, 26, 26, 0.1)",
    border: "#ba1a1a",
    text: "#ba1a1a",
    glow: "rgba(186, 26, 26, 0.6)",
    pulseKeyframes: "alarmPulse-red",
  },
  [ALARM_STATUS.WARNING]: {
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "#f59e0b",
    text: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.4)",
    pulseKeyframes: null,
  },
  [ALARM_STATUS.ACKNOWLEDGED]: {
    color: "#0058bc",
    bg: "rgba(0, 88, 188, 0.1)",
    border: "#0058bc",
    text: "#0058bc",
    glow: "rgba(0, 88, 188, 0.4)",
    pulseKeyframes: null,
  },
  [ALARM_STATUS.RESOLVED]: {
    color: "#16a34a",
    bg: "rgba(22, 163, 74, 0.1)",
    border: "#16a34a",
    text: "#16a34a",
    glow: "rgba(22, 163, 74, 0.4)",
    pulseKeyframes: null,
  },
};

/**
 * Determine alarm status from alarm object properties
 * Priority: resolved > unconfirmed > acknowledged > warning
 */
export const getAlarmStatus = (alarm) => {
  if (!alarm) return ALARM_STATUS.ACKNOWLEDGED;

  // If resolved or no longer active, show green
  if (alarm.resolved || alarm.status === "normal" || alarm.status === "resolved") {
    return ALARM_STATUS.RESOLVED;
  }

  // If unacknowledged alarm or critical, show red pulsing
  if (!alarm.acknowledged && (alarm.type === "alarm" || alarm.priority === "critical" || alarm.priority === "high")) {
    return ALARM_STATUS.UNCONFIRMED;
  }

  // If unacknowledged warning, show yellow
  if (!alarm.acknowledged && (alarm.type === "warning" || alarm.priority === "medium")) {
    return ALARM_STATUS.WARNING;
  }

  // If acknowledged but still active, show blue
  if (alarm.acknowledged) {
    return ALARM_STATUS.ACKNOWLEDGED;
  }

  return ALARM_STATUS.RESOLVED;
};

/**
 * useAlarmState — returns reactive alarm state with color info
 */
export const useAlarmState = (alarm) => {
  const [status, setStatus] = useState(() => getAlarmStatus(alarm));
  const [prevAlarm, setPrevAlarm] = useState(alarm);

  useEffect(() => {
    const newStatus = getAlarmStatus(alarm);
    if (newStatus !== status) {
      setStatus(newStatus);
    }
    setPrevAlarm(alarm);
  }, [alarm]);

  const colors = ALARM_COLORS[status];

  return {
    status,
    color: colors.color,
    bgColor: colors.bg,
    borderColor: colors.border,
    textColor: colors.text,
    glowColor: colors.glow,
    isPulsing: status === ALARM_STATUS.UNCONFIRMED,
    isResolved: status === ALARM_STATUS.RESOLVED,
    isWarning: status === ALARM_STATUS.WARNING,
    isAcknowledged: status === ALARM_STATUS.ACKNOWLEDGED,
    isUnconfirmed: status === ALARM_STATUS.UNCONFIRMED,
    priority: PRIORITY_ORDER[status],
  };
};

/**
 * useAlarmList — manages list of alarms with acknowledgement & resolution
 */
export const useAlarmList = (initialAlarms = []) => {
  const [alarms, setAlarms] = useState(initialAlarms);

  const acknowledgeAlarm = useCallback((id) => {
    setAlarms((prev) =>
      prev.map((alarm) =>
        alarm.id === id ? { ...alarm, acknowledged: true, acknowledgedAt: new Date().toISOString() } : alarm
      )
    );
  }, []);

  const resolveAlarm = useCallback((id) => {
    setAlarms((prev) =>
      prev.map((alarm) =>
        alarm.id === id ? { ...alarm, resolved: true, resolvedAt: new Date().toISOString() } : alarm
      )
    );
  }, []);

  const addAlarm = useCallback((alarm) => {
    setAlarms((prev) => [{ ...alarm, id: Date.now(), acknowledged: false }, ...prev]);
  }, []);

  // Sort alarms by priority (highest first)
  const sortedAlarms = [...alarms].sort((a, b) => {
    const statusA = getAlarmStatus(a);
    const statusB = getAlarmStatus(b);
    return PRIORITY_ORDER[statusB] - PRIORITY_ORDER[statusA];
  });

  const activeAlarms = alarms.filter((a) => !a.resolved);
  const unacknowledgedCount = alarms.filter((a) => !a.acknowledged && !a.resolved).length;

  return {
    alarms: sortedAlarms,
    activeAlarms,
    unacknowledgedCount,
    acknowledgeAlarm,
    resolveAlarm,
    addAlarm,
  };
};

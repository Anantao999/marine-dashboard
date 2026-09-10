import React, { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "./hooks/useLanguage";
import { useFullscreen } from "./hooks/useFullscreen";
import { useUnitSystem } from "./hooks/useUnitSystem";
import { useAuth } from "./hooks/useAuth";
import { PERMISSIONS } from "./auth/permissions";

const DEFAULT_MODBUS_CONFIG = {
  protocol: "MODBUS_RTU",
  transport: "rtu",
  serialPort: "RS485-1",
  tcpHost: "192.168.1.20",
  tcpPort: "502",
  baudRate: "9600",
  dataBits: "8",
  parity: "N",
  stopBits: "2",
  unitId: "1",
  pollIntervalMs: "1000",
  timeoutMs: "2000",
  retryCount: "2",
  defaultByteOrder: "ABCD",
  addressMode: "reference",
  maxRegistersPerRequest: "64",
  maxAddressGap: "4",
};

const DEFAULT_SIGNAL_ROWS = [
  {
    id: "engine-speed",
    enabled: true,
    sourceNo: "1",
    pointCode: "GENSET_ENGINE_SPEED",
    variableKey: "genset.engineSpeed",
    pointName: "Engine Speed",
    displayNameZh: "发动机转速",
    deviceGroup: "MAIN_GENSET_1",
    pointType: "ANALOG",
    functionCode: "3",
    registerAddress: "40262",
    bitIndex: "",
    dataType: "UINT16",
    registerCount: "1",
    scale: "0.125",
    offset: "0",
    unit: "rpm",
    byteOrder: "ABCD",
    rangeText: "0-3000",
    pagePath: "Main Engine / Engine System",
    status: "active",
    lastValue: "849 rpm",
    quality: "GOOD",
  },
  {
    id: "coolant-temp",
    enabled: true,
    sourceNo: "2",
    pointCode: "GENSET_COOLANT_TEMP",
    variableKey: "genset.coolantTemperature",
    pointName: "Coolant Temperature",
    displayNameZh: "冷却水温度",
    deviceGroup: "MAIN_GENSET_1",
    pointType: "ANALOG",
    functionCode: "3",
    registerAddress: "40263",
    bitIndex: "",
    dataType: "UINT16",
    registerCount: "1",
    scale: "1",
    offset: "0",
    unit: "degC",
    byteOrder: "ABCD",
    rangeText: "0-150",
    pagePath: "Engine System",
    status: "active",
    lastValue: "83 degC",
    quality: "GOOD",
  },
  {
    id: "oil-pressure",
    enabled: true,
    sourceNo: "4",
    pointCode: "GENSET_OIL_PRESSURE",
    variableKey: "genset.oilPressure",
    pointName: "Oil Pressure",
    displayNameZh: "滑油压力",
    deviceGroup: "MAIN_GENSET_1",
    pointType: "ANALOG",
    functionCode: "3",
    registerAddress: "40267",
    bitIndex: "",
    dataType: "UINT16",
    registerCount: "1",
    scale: "1",
    offset: "0",
    unit: "kPa",
    byteOrder: "ABCD",
    rangeText: "0-1000",
    pagePath: "Main Engine / Engine System",
    status: "active",
    lastValue: "390 kPa",
    quality: "GOOD",
  },
  {
    id: "local-mode",
    enabled: true,
    sourceNo: "42",
    pointCode: "GENSET_LOCAL_MODE",
    variableKey: "genset.localMode",
    pointName: "Local Mode",
    displayNameZh: "本地模式",
    deviceGroup: "MAIN_GENSET_1",
    pointType: "DIGITAL",
    functionCode: "3",
    registerAddress: "40001",
    bitIndex: "8",
    dataType: "BIT",
    registerCount: "1",
    scale: "1",
    offset: "0",
    unit: "",
    byteOrder: "ABCD",
    rangeText: "0/1",
    pagePath: "Engine System",
    status: "active",
    lastValue: "0",
    quality: "GOOD",
  },
];

const DEFAULT_ALARM_ROWS = [
  {
    id: "common-alarm",
    enabled: true,
    sourceNo: "1",
    pointCode: "GENSET_COMMON_ALARM",
    variableKey: "genset.commonAlarm",
    pointName: "Common Alarm",
    displayNameZh: "综合报警",
    functionCode: "3",
    registerAddress: "40001",
    bitIndex: "0",
    dataType: "BIT",
    registerCount: "1",
    scale: "1",
    offset: "0",
    unit: "",
    byteOrder: "ABCD",
    triggerState: "1",
    display: "Global Banner / Alarm Page",
    sound: true,
    status: "Active",
    note: "船端已完成报警判断，UI 只显示该 bit 状态",
  },
  {
    id: "common-shutdown",
    enabled: true,
    sourceNo: "2",
    pointCode: "GENSET_COMMON_SHUTDOWN_ALARM",
    variableKey: "genset.commonShutdownAlarm",
    pointName: "Common Shutdown Alarm",
    displayNameZh: "综合停机报警",
    functionCode: "3",
    registerAddress: "40001",
    bitIndex: "1",
    dataType: "BIT",
    registerCount: "1",
    scale: "1",
    offset: "0",
    unit: "",
    byteOrder: "ABCD",
    triggerState: "1",
    display: "Global Banner / Alarm Page",
    sound: true,
    status: "Normal",
    note: "不在 UI 端做停机逻辑判断",
  },
  {
    id: "coolant-level-low",
    enabled: true,
    sourceNo: "29",
    pointCode: "GENSET_COOLANT_LEVEL_LOW_ALARM",
    variableKey: "genset.coolantLevelLowAlarm",
    pointName: "Coolant Level Low Alarm",
    displayNameZh: "冷却液位低报警",
    functionCode: "3",
    registerAddress: "40034",
    bitIndex: "12",
    dataType: "BIT",
    registerCount: "1",
    scale: "1",
    offset: "0",
    unit: "",
    byteOrder: "ABCD",
    triggerState: "1",
    display: "Alarm Page",
    sound: true,
    status: "Normal",
    note: "数字报警",
  },
  {
    id: "fuel-leakage",
    enabled: true,
    sourceNo: "30",
    pointCode: "GENSET_FUEL_LEAKAGE_ALARM",
    variableKey: "genset.fuelLeakageAlarm",
    pointName: "Fuel leakage alarm",
    displayNameZh: "燃油泄漏报警",
    functionCode: "3",
    registerAddress: "40034",
    bitIndex: "11",
    dataType: "BIT",
    registerCount: "1",
    scale: "1",
    offset: "0",
    unit: "",
    byteOrder: "ABCD",
    triggerState: "1",
    display: "Global Banner / Alarm Page",
    sound: true,
    status: "Normal",
    note: "数字报警",
  },
];

const POINT_TABLE_VERSIONS = [
  { version: "v1", status: "active", pointCount: 74, createdAt: "2026-06-24 10:00", activatedAt: "2026-06-24 10:05" },
  { version: "v2", status: "draft", pointCount: 78, createdAt: "2026-06-25 09:30", activatedAt: "-" },
];

const STATUS_STEPS = ["draft", "validating", "validated", "applying", "active"];

const statusText = {
  zh: {
    draft: "草稿",
    validating: "校验中",
    validated: "已校验",
    applying: "应用中",
    active: "生效",
    failed: "失败",
    rolled_back: "已回滚",
  },
  en: {
    draft: "Draft",
    validating: "Validating",
    validated: "Validated",
    applying: "Applying",
    active: "Active",
    failed: "Failed",
    rolled_back: "Rolled Back",
  },
};

const alarmStatusText = {
  zh: {
    Active: "活动",
    Normal: "正常",
  },
  en: {
    Active: "Active",
    Normal: "Normal",
  },
};

const alarmDisplayText = {
  zh: {
    "Global Banner / Alarm Page": "全局报警条 / 报警页面",
    "Alarm Page": "报警页面",
  },
  en: {
    "Global Banner / Alarm Page": "Global Banner / Alarm Page",
    "Alarm Page": "Alarm Page",
  },
};

const pointTypeText = {
  zh: {
    ANALOG: "模拟量",
    DIGITAL: "数字量",
  },
  en: {
    ANALOG: "ANALOG",
    DIGITAL: "DIGITAL",
  },
};

const qualityText = {
  zh: {
    GOOD: "正常",
    BAD: "异常",
    STALE: "超时",
  },
  en: {
    GOOD: "GOOD",
    BAD: "BAD",
    STALE: "STALE",
  },
};

const formatPagePath = (value, language) => {
  if (language !== "zh") return value;
  return String(value)
    .replace(/Main Engine/g, "主机")
    .replace(/Engine System/g, "发动机系统")
    .replace(/Navigation/g, "导航")
    .replace(/Trend/g, "趋势")
    .replace(/Alarm/g, "报警")
    .replace(/Configuration/g, "配置参数");
};

const RUNTIME_FIELDS = [
  "pointCode",
  "pointName",
  "pointType",
  "functionCode",
  "registerAddress",
  "bitIndex",
  "dataType",
  "registerCount",
  "scale",
  "offset",
  "unit",
  "byteOrder",
];

const csvEscape = (value) => {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toRuntimeRow = (point) => ({
  pointCode: point.pointCode,
  pointName: point.pointName,
  pointType: point.pointType,
  functionCode: point.functionCode,
  registerAddress: point.registerAddress,
  bitIndex: point.bitIndex || "",
  dataType: point.dataType,
  registerCount: point.registerCount,
  scale: point.scale,
  offset: point.offset,
  unit: point.unit || "",
  byteOrder: point.byteOrder,
});

const parseCsvRows = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((item) => item.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((item) => item.trim() !== "")) rows.push(row);
  return rows;
};

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[：:]/g, "")
    .replace(/[\s_\-./()（）]+/g, "");

const FIELD_ALIASES = {
  sourceNo: ["no", "序号", "sourceNo"],
  pointCode: ["pointcode", "变量key", "variablekey", "code", "tag"],
  variableKey: ["variablekey", "变量key", "key"],
  pointName: ["pointname", "signalcontent", "signalname", "name", "description", "信号名称", "信号内容"],
  displayNameZh: ["displaynamezh", "中文名称", "中文名"],
  pointType: ["pointtype", "type", "类型"],
  functionCode: ["functioncode", "function", "fc", "功能码"],
  registerAddress: ["registeraddress", "address", "dataaddress", "modbusaddress", "寄存器地址", "地址"],
  bitIndex: ["bitindex", "bit", "位"],
  dataType: ["datatype", "数据类型"],
  registerCount: ["registercount", "寄存器数", "寄存器数量"],
  scale: ["scale", "scaling", "比例", "缩放"],
  offset: ["offset", "偏移"],
  unit: ["unit", "单位"],
  byteOrder: ["byteorder", "字节序"],
  rangeText: ["range", "rangetext", "范围", "量程"],
  pagePath: ["page", "pagepath", "页面"],
};

const findFieldForHeader = (header) => {
  const normalized = normalizeHeader(header);
  return Object.entries(FIELD_ALIASES).find(([, aliases]) =>
    aliases.map(normalizeHeader).includes(normalized)
  )?.[0];
};

const makePointCode = (name, index) => {
  const base = String(name || `POINT_${index + 1}`)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  return base ? `GENSET_${base}`.replace(/^GENSET_GENSET_/, "GENSET_") : `GENSET_POINT_${index + 1}`;
};

const rowsToRuntimePoints = (rows) => {
  if (!rows.length) return [];
  const headerIndex = rows.findIndex((row) => {
    const normalizedCells = row.map(normalizeHeader);
    return normalizedCells.some((cell) =>
      ["pointcode", "signalcontent", "pointname", "registeraddress", "address", "dataaddress"].includes(cell)
    );
  });
  const headers = rows[headerIndex >= 0 ? headerIndex : 0] || [];
  const dataRows = rows.slice((headerIndex >= 0 ? headerIndex : 0) + 1);
  const mappedHeaders = headers.map(findFieldForHeader);

  return dataRows
    .map((row, index) => {
      const point = {};
      mappedHeaders.forEach((field, columnIndex) => {
        if (field) point[field] = row[columnIndex] ?? "";
      });
      const pointName = point.pointName || point.displayNameZh || point.pointCode;
      const dataType = String(point.dataType || (point.bitIndex !== "" && point.bitIndex != null ? "BIT" : "UINT16")).toUpperCase();
      const pointType = point.pointType || (dataType === "BIT" ? "DIGITAL" : "ANALOG");
      return {
        ...point,
        pointCode: point.pointCode || makePointCode(pointName, index),
        variableKey: point.variableKey || "",
        pointName: pointName || "",
        pointType: String(pointType).toUpperCase(),
        functionCode: String(point.functionCode || "3").replace(/^0+/, "") || "3",
        registerAddress: String(point.registerAddress || ""),
        bitIndex: point.bitIndex == null ? "" : String(point.bitIndex),
        dataType,
        registerCount: String(point.registerCount || (["UINT32", "INT32", "FLOAT32"].includes(dataType) ? "2" : "1")),
        scale: String(point.scale || "1"),
        offset: String(point.offset || "0"),
        unit: point.unit || "",
        byteOrder: point.byteOrder || "ABCD",
      };
    })
    .filter((point) => point.pointName || point.registerAddress || point.pointCode);
};

const runtimePointToSignalRow = (point, index) => ({
  id: `${point.pointCode || `point-${index}`}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  enabled: true,
  sourceNo: String(index + 1),
  pointCode: point.pointCode || "",
  variableKey: point.variableKey || "",
  pointName: point.pointName || point.pointCode || "",
  displayNameZh: point.displayNameZh || point.pointName || point.pointCode || "",
  deviceGroup: point.deviceGroup || "MAIN_GENSET_1",
  pointType: point.pointType || "ANALOG",
  functionCode: String(point.functionCode ?? "3"),
  registerAddress: String(point.registerAddress ?? ""),
  bitIndex: point.bitIndex == null ? "" : String(point.bitIndex),
  dataType: point.dataType || "UINT16",
  registerCount: String(point.registerCount ?? "1"),
  scale: String(point.scale ?? "1"),
  offset: String(point.offset ?? "0"),
  unit: point.unit || "",
  byteOrder: point.byteOrder || "ABCD",
  rangeText: point.rangeText || "",
  pagePath: point.pagePath || "Imported",
  status: "draft",
  lastValue: "-",
  quality: "UNKNOWN",
});

const ConfigPage = ({ theme: controlledTheme, setTheme: setControlledTheme }) => {
  const { t, language, setLanguage } = useLanguage();
  const { hasPermission } = useAuth();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { unitSystem, setUnitSystem } = useUnitSystem();
  const importInputRef = useRef(null);
  const [activeSection, setActiveSection] = useState("display");
  const [signalTab, setSignalTab] = useState("signals");
  const [signalSearch, setSignalSearch] = useState("");
  const [pointRows, setPointRows] = useState(DEFAULT_SIGNAL_ROWS);
  const [selectedSignalId, setSelectedSignalId] = useState(DEFAULT_SIGNAL_ROWS[0].id);
  const [modbusConfig, setModbusConfig] = useState(DEFAULT_MODBUS_CONFIG);
  const [pointTableStatus, setPointTableStatus] = useState("draft");
  const [importMessage, setImportMessage] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [validationResult, setValidationResult] = useState({
    success: true,
    pointCount: 78,
    goodCount: 76,
    badCount: 2,
    readGroupCount: 10,
    failedPoints: ["GENSET_FUEL_LEAKAGE_ALARM", "GENSET_COOLANT_LEVEL_LOW_ALARM"],
  });
  const [localTheme, setLocalTheme] = useState("system");
  const [syncMode, setSyncMode] = useState("local");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(new Date());
  const isZh = language === "zh";
  const theme = controlledTheme ?? localTheme;
  const setTheme = useCallback(
    (nextTheme) => {
      if (setControlledTheme) {
        setControlledTheme(nextTheme);
        return;
      }

      setLocalTheme(nextTheme);
      const root = document.documentElement;
      const prefersDark =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldUseDark = nextTheme === "dark" || (nextTheme === "system" && prefersDark);
      root.classList.toggle("dark", shouldUseDark);
      root.style.colorScheme = shouldUseDark ? "dark" : "light";
    },
    [setControlledTheme]
  );
  const canUpdatePointTable = hasPermission(PERMISSIONS.CONFIG_POINT_TABLE_UPDATE);
  const canImportPointTable = hasPermission(PERMISSIONS.CONFIG_POINT_TABLE_IMPORT);
  const canExportPointTable = hasPermission(PERMISSIONS.CONFIG_POINT_TABLE_EXPORT);
  const canValidatePointTable = hasPermission(PERMISSIONS.CONFIG_POINT_TABLE_VALIDATE);
  const canApplyPointTable = hasPermission(PERMISSIONS.CONFIG_POINT_TABLE_APPLY);
  const canRollbackPointTable = hasPermission(PERMISSIONS.CONFIG_POINT_TABLE_ROLLBACK);
  const disabledTitle = isZh ? "当前账号没有该操作权限" : "Current account has no permission for this action";

  const sections = [
    { id: "display", label: t.displaySettings, icon: "palette" },
    { id: "signals", label: language === "zh" ? "通信映射" : "Signal Mapping", icon: "hub" },
    { id: "sync", label: t.envSync, icon: "cloud_sync" },
    { id: "about", label: t.about, icon: "info" },
  ];

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setLastSynced(new Date());
      setIsSyncing(false);
    }, 2000);
  };

  const handlePointTest = () => {
    if (!canValidatePointTable) return;
    setTestResult({
      success: true,
      pointCode: selectedSignal.pointCode,
      rawValue: selectedSignal.pointCode === "GENSET_ENGINE_SPEED" ? "6792" : selectedSignal.lastValue.replace(/\s.+$/, ""),
      value: selectedSignal.lastValue,
      quality: "GOOD",
      responseTimeMs: 38,
      error: "",
    });
  };

  const handleValidateTable = () => {
    if (!canValidatePointTable) return;
    setPointTableStatus("validating");
    setTimeout(() => {
      setPointTableStatus("validated");
      setValidationResult((prev) => ({ ...prev, success: prev.badCount === 0 }));
    }, 800);
  };

  const handleApplyVersion = () => {
    if (!canApplyPointTable) return;
    setPointTableStatus("applying");
    setTimeout(() => setPointTableStatus("active"), 900);
  };

  const handleExportRuntimeCsv = () => {
    if (!canExportPointTable) return;
    const runtimeRows = [
      ...pointRows.filter((point) => point.enabled).map(toRuntimeRow),
      ...DEFAULT_ALARM_ROWS.filter((alarm) => alarm.enabled).map(toRuntimeRow),
    ];
    const csv = [
      RUNTIME_FIELDS.join(","),
      ...runtimeRows.map((row) => RUNTIME_FIELDS.map((field) => csvEscape(row[field])).join(",")),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `modbus-points-main-genset-v2-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setImportMessage({
      type: "success",
      text: isZh ? `已导出 ${runtimeRows.length} 个启用点位的运行 CSV。` : `Exported runtime CSV with ${runtimeRows.length} enabled points.`,
    });
  };

  const applyImportedPoints = (points, fileName) => {
    const nextRows = points.map(runtimePointToSignalRow);
    if (!nextRows.length) {
      setImportMessage({ type: "error", text: isZh ? "未识别到可导入点位。" : "No importable points found." });
      return;
    }
    setPointRows(nextRows);
    setSelectedSignalId(nextRows[0].id);
    setPointTableStatus("draft");
    setValidationResult((prev) => ({
      ...prev,
      pointCount: nextRows.length + DEFAULT_ALARM_ROWS.length,
      goodCount: nextRows.length + DEFAULT_ALARM_ROWS.length,
      badCount: 0,
      failedPoints: [],
    }));
    setImportMessage({
      type: "success",
      text: isZh ? `已从 ${fileName} 导入 ${nextRows.length} 个点位，当前版本保持为草稿。` : `Imported ${nextRows.length} points from ${fileName}. Version remains draft.`,
    });
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!canImportPointTable) {
      setImportMessage({ type: "error", text: disabledTitle });
      return;
    }

    const lowerName = file.name.toLowerCase();

    try {
      if (lowerName.endsWith(".xls") || lowerName.endsWith(".xlsx")) {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
        applyImportedPoints(rowsToRuntimePoints(rows), file.name);
        return;
      }

      const text = await file.text();
      if (lowerName.endsWith(".json")) {
        const data = JSON.parse(text);
        const points = Array.isArray(data) ? data : data.points;
        applyImportedPoints(points || [], file.name);
        return;
      }

      applyImportedPoints(rowsToRuntimePoints(parseCsvRows(text)), file.name);
    } catch (error) {
      setImportMessage({
        type: "error",
        text: isZh ? `导入失败：${error.message}` : `Import failed: ${error.message}`,
      });
    }
  };

  const signalTabs = [
    { key: "comm", label: language === "zh" ? "通信参数" : "Communication", icon: "settings_ethernet" },
    { key: "signals", label: language === "zh" ? "信号点表" : "Signal Table", icon: "table_rows" },
    { key: "alarms", label: language === "zh" ? "报警映射" : "Alarm Mapping", icon: "notifications_active" },
    { key: "debug", label: language === "zh" ? "实时调试" : "Live Debug", icon: "bug_report" },
  ];

  const visibleSignals = pointRows.filter((signal) => {
    const term = signalSearch.trim().toLowerCase();
    if (!term) return true;
    return [signal.pointName, signal.displayNameZh, signal.pointCode, signal.variableKey, signal.registerAddress, signal.deviceGroup]
      .some((item) => String(item).toLowerCase().includes(term));
  });
  const selectedSignal =
    pointRows.find((signal) => signal.id === selectedSignalId) || pointRows[0] || DEFAULT_SIGNAL_ROWS[0];
  const activeAlarmCount = DEFAULT_ALARM_ROWS.filter((alarm) => alarm.status === "Active").length;
  const enabledPointCount = pointRows.filter((signal) => signal.enabled).length + DEFAULT_ALARM_ROWS.filter((alarm) => alarm.enabled).length;
  const runtimeCsvHeader = "pointCode,pointName,pointType,functionCode,registerAddress,bitIndex,dataType,registerCount,scale,offset,unit,byteOrder";

  return (
    <div className="config-page flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-4 pt-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <span className="material-symbols-outlined text-[#4cd7d0] text-2xl">settings</span>
        <h1 className="text-xl font-headline font-black tracking-tight">{t.configParameters}</h1>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 min-h-0 gap-4">
        {/* Sidebar */}
        <aside className="w-48 xl:w-52 shrink-0 flex flex-col gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeSection === section.id
                  ? "bg-white dark:bg-surface-container-low shadow-md"
                  : "hover:bg-white/50 dark:hover:bg-dark-surface-container-low"
              }`}
            >
              {activeSection === section.id && (
                <motion.div
                  layoutId="activeSection"
                  className="absolute left-0 w-1 h-8 bg-[#4cd7d0] rounded-r-full"
                />
              )}
              <span
                className={`material-symbols-outlined text-lg ${
                  activeSection === section.id ? "text-[#4cd7d0]" : "text-gray-400"
                }`}
              >
                {section.icon}
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                activeSection === section.id ? "text-[#1A1B1F] dark:text-white" : "text-gray-500"
                }`}
              >
                {section.label}
              </span>
            </button>
          ))}
        </aside>

        {/* Content */}
        <section className="flex-1 bg-white dark:bg-surface-container-lowest rounded-2xl p-6 shadow-sm min-h-0 overflow-y-auto">
          {/* Display Settings */}
          {activeSection === "display" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t.displaySettings}</h2>

              {/* Fullscreen Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl dark:bg-[#1d2027]">
                <div>
                  <p className="font-bold text-sm text-gray-800 dark:text-white">{t.fullscreenMode}</p>
                  <p className="text-xs text-gray-500 mt-1 dark:text-slate-300">{isZh ? "开启全屏显示" : "Enable fullscreen display"}</p>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                    isFullscreen ? "bg-[#4cd7d0]" : "bg-gray-300 dark:bg-[#383d47]"
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                    animate={{ left: isFullscreen ? 26 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Theme Selection */}
              <div>
                <p className="font-bold text-sm text-gray-800 mb-3 dark:text-white">{t.dayNightMode}</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "light", label: t.lightMode, icon: "light_mode", color: "#f59e0b" },
                    { key: "dark", label: t.darkMode, icon: "dark_mode", color: "#4b5563" },
                    { key: "system", label: t.systemDefault, icon: "settings_suggest", color: "#6b7280" },
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      onClick={() => setTheme(mode.key)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        theme === mode.key
                          ? "border-[#4cd7d0] bg-[#f0fffe] text-[#1A1B1F] shadow-md dark:bg-[#10282d] dark:text-[#4cd7d0] dark:shadow-[0_0_0_1px_rgba(76,215,208,0.12)]"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 dark:border-white/12 dark:bg-[#1d2027] dark:text-slate-300 dark:hover:border-[#4cd7d0]/50 dark:hover:bg-[#232832]"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-2xl"
                        style={{ color: theme === mode.key ? "#4cd7d0" : mode.color }}
                      >
                        {mode.icon}
                      </span>
                      <span className="text-xs font-bold">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <p className="font-bold text-sm text-gray-800 mb-3 dark:text-white">{t.language}</p>
                <div className="flex gap-3">
                  {[
                    { key: "en", label: "English" },
                    { key: "zh", label: "Chinese" },
                  ].map((lang) => (
                    <button
                      key={lang.key}
                      onClick={() => setLanguage(lang.key)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                        language === lang.key
                          ? "border-[#4cd7d0] bg-[#f0fffe] text-[#1A1B1F] dark:bg-[#10282d] dark:text-[#4cd7d0]"
                          : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 dark:border-white/12 dark:bg-[#1d2027] dark:text-slate-300 dark:hover:border-[#4cd7d0]/50 dark:hover:bg-[#232832]"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-bold text-sm text-gray-800 mb-3 dark:text-white">
                  {language === "zh" ? "单位制" : "Unit System"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "metric", label: language === "zh" ? "公制" : "Metric", detail: "°C / bar / kW / L/h" },
                    { key: "imperial", label: language === "zh" ? "英制" : "Imperial", detail: "°F / psi / hp / gal/h" },
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      onClick={() => setUnitSystem(mode.key)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        unitSystem === mode.key
                          ? "border-[#4cd7d0] bg-[#f0fffe] text-[#1A1B1F] shadow-md dark:bg-[#10282d] dark:text-[#4cd7d0]"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 dark:border-white/12 dark:bg-[#1d2027] dark:text-slate-300 dark:hover:border-[#4cd7d0]/50 dark:hover:bg-[#232832]"
                      }`}
                    >
                      <span className="block text-sm font-bold">{mode.label}</span>
                      <span className="mt-1 block text-[11px] text-gray-500 dark:text-slate-300">{mode.detail}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-slate-300">
                  {language === "zh" ? "切换后主要页面会统一换算温度、压力、功率、流量和距离单位。" : "Switching applies conversion to temperature, pressure, power, flow, and distance displays across the dashboard."}
                </p>
              </div>
            </motion.div>
          )}

          {/* Communication & Signal Mapping */}
          {activeSection === "signals" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex h-full min-h-[620px] flex-col gap-4"
            >
              <div className="flex shrink-0 items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {isZh ? "船端采集配置管理" : "Vessel Acquisition Config"}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    {isZh ? "按船舶、设备、通道和点表版本管理采集运行配置。" : "Manage runtime point tables by vessel, device, channel, and version."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".csv,.json,.xls,.xlsx"
                    className="hidden"
                    onChange={handleImportFile}
                  />
                  {[
                    { label: isZh ? "导入 Excel" : "Import Excel", icon: "upload_file", onClick: () => importInputRef.current?.click(), enabled: canImportPointTable },
                    { label: isZh ? "导出运行点表" : "Export Runtime CSV", icon: "download", onClick: handleExportRuntimeCsv, enabled: canExportPointTable },
                    { label: isZh ? "整表校验" : "Validate Table", icon: "fact_check", onClick: handleValidateTable, enabled: canValidatePointTable },
                    { label: isZh ? "保存并应用" : "Save & Apply", icon: "save", onClick: handleApplyVersion, enabled: canApplyPointTable },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      disabled={!action.enabled}
                      title={!action.enabled ? disabledTitle : ""}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                        action.icon === "save"
                          ? "bg-[#4cd7d0] text-[#00201e] hover:bg-[#3bc4bc]"
                          : "border border-gray-200 bg-gray-50 text-gray-600 hover:border-[#4cd7d0]/60 hover:bg-[#f0fffe]"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <span className="material-symbols-outlined text-sm">{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              {importMessage && (
                <div
                  className={`shrink-0 rounded-xl border px-4 py-2 text-xs font-bold ${
                    importMessage.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : importMessage.type === "warning"
                      ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {importMessage.text}
                </div>
              )}

              <div className="grid shrink-0 grid-cols-4 gap-3">
                {[
                  [isZh ? "船舶" : "Vessel", "MHM-TierIII-Demo", "directions_boat"],
                  [isZh ? "设备" : "Device", "MAIN_GENSET_1", "precision_manufacturing"],
                  [isZh ? "采集通道" : "Channel", `${modbusConfig.protocol} / ${modbusConfig.transport.toUpperCase()}`, "hub"],
                  [isZh ? "当前版本" : "Version", `v2 · ${statusText[language][pointTableStatus]}`, "deployed_code"],
                ].map(([label, value, icon]) => (
                  <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                      <span className="material-symbols-outlined text-sm text-[#4cd7d0]">{icon}</span>
                      {label}
                    </div>
                    <div className="mt-1 truncate text-base font-black text-gray-800">{value}</div>
                  </div>
                ))}
              </div>

              <div className="grid shrink-0 grid-cols-5 gap-3">
                {[
                  { label: isZh ? "运行字段" : "Runtime Fields", value: 12, tone: "text-blue-600" },
                  { label: isZh ? "启用点位" : "Enabled Points", value: enabledPointCount, tone: "text-emerald-600" },
                  { label: isZh ? "读取分组" : "Read Groups", value: validationResult.readGroupCount, tone: "text-slate-800" },
                  { label: isZh ? "失败点位" : "Failed Points", value: validationResult.badCount, tone: validationResult.badCount ? "text-red-600" : "text-emerald-600" },
                  { label: isZh ? "活动报警" : "Active Alarms", value: activeAlarmCount, tone: activeAlarmCount ? "text-red-600" : "text-emerald-600" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">{item.label}</div>
                    <div className={`mt-1 text-lg font-black ${item.tone}`}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid shrink-0 grid-cols-5 gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-2">
                {STATUS_STEPS.map((step, index) => {
                  const activeIndex = STATUS_STEPS.indexOf(pointTableStatus);
                  const isCurrent = pointTableStatus === step;
                  const isDone = activeIndex > index || pointTableStatus === "active";
                  return (
                    <div
                      key={step}
                      className={`rounded-xl px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider ${
                        isCurrent
                          ? "bg-[#4cd7d0] text-[#00201e]"
                          : isDone
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-white text-gray-400"
                      }`}
                    >
                      {statusText[language][step]}
                    </div>
                  );
                })}
              </div>

              <div className="flex shrink-0 gap-2 rounded-full bg-gray-100 p-1">
                {signalTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSignalTab(tab.key)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      signalTab === tab.key ? "bg-white text-[#1A1B1F] shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {signalTab === "comm" && (
                <div className="min-h-0 flex-1">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-black text-gray-800">
                        {isZh ? "采集通道通信参数" : "Acquisition Channel"}
                      </h3>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                        {isZh ? "生成点表版本时进入 connection" : "Saved into connection"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        ["protocol", isZh ? "协议" : "Protocol", ["MODBUS_RTU", "MODBUS_TCP", "RTU_OVER_TCP", "OPC_UA", "NMEA"]],
                        ["transport", isZh ? "传输方式" : "Transport", ["rtu", "tcp", "rtu-over-tcp"]],
                        ["serialPort", isZh ? "串口" : "Serial Port", ["RS485-1", "RS485-2", "COM1", "/dev/ttyUSB0"]],
                        ["baudRate", isZh ? "波特率" : "Baud Rate", ["9600", "19200", "38400", "115200"]],
                        ["dataBits", isZh ? "数据位" : "Data Bits", ["8", "7"]],
                        ["parity", isZh ? "校验位" : "Parity", ["N", "E", "O"]],
                        ["stopBits", isZh ? "停止位" : "Stop Bits", ["1", "2"]],
                        ["defaultByteOrder", isZh ? "默认字节序" : "Default Byte Order", ["ABCD", "BADC", "CDAB", "DCBA"]],
                        ["addressMode", isZh ? "地址基准" : "Address Mode", ["reference", "zero_based"]],
                      ].map(([key, label, options]) => (
                        <label key={key} className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</span>
                          <select
                            value={modbusConfig[key]}
                            onChange={(event) => setModbusConfig((prev) => ({ ...prev, [key]: event.target.value }))}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-[#4cd7d0]"
                          >
                            {options.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </label>
                      ))}
                      {[
                        ["tcpHost", isZh ? "TCP 主机" : "TCP Host"],
                        ["tcpPort", isZh ? "TCP 端口" : "TCP Port"],
                        ["unitId", isZh ? "Unit ID / 从站地址" : "Unit ID"],
                        ["pollIntervalMs", isZh ? "采样周期 ms" : "Poll ms"],
                        ["timeoutMs", isZh ? "超时时间 ms" : "Timeout ms"],
                        ["retryCount", isZh ? "重试次数" : "Retries"],
                        ["maxRegistersPerRequest", isZh ? "最大连续寄存器数" : "Max Registers"],
                        ["maxAddressGap", isZh ? "最大地址间隔" : "Max Address Gap"],
                      ].map(([key, label]) => (
                        <label key={key} className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</span>
                          <input
                            value={modbusConfig[key]}
                            onChange={(event) => setModbusConfig((prev) => ({ ...prev, [key]: event.target.value }))}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-800 outline-none focus:border-[#4cd7d0]"
                          />
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl bg-white p-3 font-mono text-[11px] text-gray-600">
                      <div className="mb-1 font-sans text-[10px] font-black uppercase tracking-wider text-gray-400">
                        {isZh ? "后端保存草稿请求体中的 connection 预览" : "Connection Preview"}
                      </div>
                      {`transport=${modbusConfig.transport}, unitId=${modbusConfig.unitId}, timeoutMs=${modbusConfig.timeoutMs}, retryCount=${modbusConfig.retryCount}, addressMode=${modbusConfig.addressMode}`}
                    </div>
                  </div>
                </div>
              )}

              {signalTab === "signals" && (
                <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_320px] gap-4">
                  <div className="flex min-h-0 flex-col rounded-2xl border border-gray-100 bg-gray-50">
                    <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 p-3">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-400">search</span>
                        <input
                          value={signalSearch}
                          onChange={(event) => setSignalSearch(event.target.value)}
                          placeholder={isZh ? "搜索 pointCode、信号名、地址、变量 Key..." : "Search pointCode, signal, address, variable key..."}
                          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#4cd7d0]"
                        />
                      </div>
                      <button disabled={!canUpdatePointTable} title={!canUpdatePointTable ? disabledTitle : ""} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black uppercase text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">
                        {isZh ? "新增点位" : "Add Point"}
                      </button>
                      <button disabled={!canUpdatePointTable} title={!canUpdatePointTable ? disabledTitle : ""} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black uppercase text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">
                        {isZh ? "批量编辑" : "Batch Edit"}
                      </button>
                    </div>
                    <div className="min-h-0 overflow-auto">
                      <table className="w-full min-w-[1320px] text-left text-xs">
                        <thead className="sticky top-0 bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                          <tr>
                            {(isZh
                              ? ["启用", "序号", "点位编码", "信号内容", "变量 Key", "类型", "功能码", "地址", "Bit", "数据类型", "寄存器数", "scale", "offset", "单位", "字节序", "范围", "当前值", "质量"]
                              : ["Enabled", "NO.", "pointCode", "Signal Content", "Variable Key", "Type", "Function", "Address", "Bit", "Data Type", "Registers", "scale", "offset", "Unit", "Byte Order", "Range", "Current Value", "Quality"]
                            ).map((head) => (
                              <th key={head} className="border-b border-gray-200 px-3 py-2 font-black">{head}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {visibleSignals.map((signal) => (
                            <tr
                              key={signal.id}
                              onClick={() => setSelectedSignalId(signal.id)}
                              className={`cursor-pointer border-b border-gray-100 transition-colors ${
                                selectedSignalId === signal.id ? "bg-[#edfffd]" : "bg-white hover:bg-gray-50"
                              }`}
                            >
                              <td className="px-3 py-2"><input type="checkbox" checked={signal.enabled} readOnly /></td>
                              <td className="px-3 py-2 font-bold">{signal.sourceNo}</td>
                              <td className="px-3 py-2 font-mono text-[11px] font-black text-blue-700">{signal.pointCode}</td>
                              <td className="px-3 py-2">
                                <div className="font-black text-gray-800">{isZh ? signal.displayNameZh : signal.pointName}</div>
                                <div className="text-[10px] text-gray-400">{isZh ? signal.pointName : signal.displayNameZh}</div>
                              </td>
                              <td className="px-3 py-2 font-mono text-[11px] text-gray-600">{signal.variableKey}</td>
                              <td className="px-3 py-2">{pointTypeText[language][signal.pointType] || signal.pointType}</td>
                              <td className="px-3 py-2">{signal.functionCode}</td>
                              <td className="px-3 py-2 font-mono font-bold">{signal.registerAddress}</td>
                              <td className="px-3 py-2">{signal.bitIndex || "-"}</td>
                              <td className="px-3 py-2">{signal.dataType}</td>
                              <td className="px-3 py-2">{signal.registerCount}</td>
                              <td className="px-3 py-2">{signal.scale}</td>
                              <td className="px-3 py-2">{signal.offset}</td>
                              <td className="px-3 py-2">{signal.unit || "-"}</td>
                              <td className="px-3 py-2">{signal.byteOrder}</td>
                              <td className="px-3 py-2">{signal.rangeText}</td>
                              <td className="px-3 py-2 font-black text-gray-800">{signal.lastValue}</td>
                              <td className="px-3 py-2"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">{qualityText[language][signal.quality] || signal.quality}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <aside className="min-h-0 overflow-auto rounded-2xl border border-gray-100 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-gray-800">{isZh ? "点位详情" : "Point Detail"}</h3>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700">{pointTypeText[language][selectedSignal.pointType] || selectedSignal.pointType}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button onClick={handlePointTest} disabled={!canValidatePointTable} title={!canValidatePointTable ? disabledTitle : ""} className="rounded-lg bg-[#4cd7d0] px-3 py-2 text-xs font-black uppercase text-[#00201e] disabled:cursor-not-allowed disabled:opacity-40">
                        {isZh ? "单点测试" : "Point Test"}
                      </button>
                      <button disabled={!canUpdatePointTable} title={!canUpdatePointTable ? disabledTitle : ""} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-black uppercase text-gray-600 disabled:cursor-not-allowed disabled:opacity-40">
                        {isZh ? "停用点位" : "Disable"}
                      </button>
                    </div>

                    <div className="mt-4 rounded-xl bg-gray-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        {isZh ? "前端展示字段" : "Display Fields"}
                      </div>
                      <div className="mt-3 space-y-3">
                        {[
                          [isZh ? "英文名称" : "Name", selectedSignal.pointName],
                          [isZh ? "中文名称" : "Chinese Name", selectedSignal.displayNameZh],
                          [isZh ? "变量 Key" : "Variable Key", selectedSignal.variableKey],
                          [isZh ? "设备分组" : "Device Group", selectedSignal.deviceGroup],
                          [isZh ? "页面绑定" : "Page Binding", formatPagePath(selectedSignal.pagePath, language)],
                          [isZh ? "量程显示" : "Range Text", selectedSignal.rangeText],
                        ].map(([label, value]) => (
                          <label key={label} className="block">
                            <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</span>
                            <input readOnly value={value} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800" />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-gray-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        {isZh ? "采集端运行字段" : "Runtime Fields"}
                      </div>
                      <div className="mt-3 space-y-3">
                      {[
                        ["pointCode", selectedSignal.pointCode],
                        ["pointType", selectedSignal.pointType],
                        ["functionCode", selectedSignal.functionCode],
                        ["registerAddress", selectedSignal.bitIndex ? `${selectedSignal.registerAddress}.${selectedSignal.bitIndex}` : selectedSignal.registerAddress],
                        ["dataType / registerCount", `${selectedSignal.dataType} / ${selectedSignal.registerCount}`],
                        ["scale / offset", `${selectedSignal.scale} / ${selectedSignal.offset}`],
                        ["unit / byteOrder", `${selectedSignal.unit || "-"} / ${selectedSignal.byteOrder}`],
                      ].map(([label, value]) => (
                        <label key={label} className="block">
                          <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</span>
                          <input readOnly value={value} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800" />
                        </label>
                      ))}
                      </div>
                    </div>

                    {testResult && (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                          {isZh ? "单点测试结果" : "Point Test Result"}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div><b>{isZh ? "原始值" : "raw"}</b><br />{testResult.rawValue}</div>
                          <div><b>{isZh ? "换算值" : "value"}</b><br />{testResult.value}</div>
                          <div><b>{isZh ? "质量" : "quality"}</b><br />{qualityText[language][testResult.quality] || testResult.quality}</div>
                          <div><b>time</b><br />{testResult.responseTimeMs} ms</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 rounded-xl bg-[#0f172a] p-3 font-mono text-[10px] leading-relaxed text-white/75">
                      <div className="mb-2 font-sans font-black uppercase tracking-wider text-white">{isZh ? "运行 CSV 字段" : "Runtime CSV"}</div>
                      <div>{runtimeCsvHeader}</div>
                    </div>
                  </aside>
                </div>
              )}

              {signalTab === "alarms" && (
                <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-100 bg-gray-50">
                  <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-3">
                    <div>
                      <h3 className="text-sm font-black text-gray-800">{isZh ? "船端报警 bit 映射" : "Vessel-Side Alarm Bit Mapping"}</h3>
                      <p className="mt-1 text-xs text-gray-500">
                        {isZh ? "报警作为 DIGITAL/BIT 点位进入点表；这里只映射船端已判断的报警 bit，不配置阈值。" : "Alarms are DIGITAL/BIT points. UI maps vessel-side alarm bits only."}
                      </p>
                    </div>
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                      {isZh ? `${activeAlarmCount} 个活动报警` : `${activeAlarmCount} active`}
                    </span>
                  </div>
                  <div className="min-h-0 overflow-auto">
                    <table className="w-full min-w-[1220px] text-left text-xs">
                      <thead className="sticky top-0 bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                        <tr>
                          {(isZh
                            ? ["启用", "序号", "点位编码", "报警名称", "变量 Key", "功能码", "地址", "Bit", "数据类型", "触发状态", "当前状态", "声音", "显示位置", "备注"]
                            : ["Enabled", "NO.", "pointCode", "Alarm Name", "Variable Key", "Function", "Address", "Bit", "Data Type", "Trigger State", "Current State", "Sound", "Display Area", "Note"]
                          ).map((head) => (
                            <th key={head} className="border-b border-gray-200 px-3 py-2 font-black">{head}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DEFAULT_ALARM_ROWS.map((alarm) => (
                          <tr key={alarm.id} className="border-b border-gray-100 bg-white hover:bg-gray-50">
                            <td className="px-3 py-2"><input type="checkbox" checked={alarm.enabled} readOnly /></td>
                            <td className="px-3 py-2 font-bold">{alarm.sourceNo}</td>
                            <td className="px-3 py-2 font-mono text-[11px] font-black text-blue-700">{alarm.pointCode}</td>
                            <td className="px-3 py-2">
                              <div className="font-black text-gray-800">{isZh ? alarm.displayNameZh : alarm.pointName}</div>
                              <div className="text-[10px] text-gray-400">{isZh ? alarm.pointName : alarm.displayNameZh}</div>
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-gray-600">{alarm.variableKey}</td>
                            <td className="px-3 py-2">{alarm.functionCode}</td>
                            <td className="px-3 py-2 font-mono font-bold">{alarm.registerAddress}</td>
                            <td className="px-3 py-2">{alarm.bitIndex}</td>
                            <td className="px-3 py-2">{alarm.dataType}</td>
                            <td className="px-3 py-2">bit = {alarm.triggerState}</td>
                            <td className="px-3 py-2">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                alarm.status === "Active" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {alarmStatusText[language][alarm.status] || alarm.status}
                              </span>
                            </td>
                            <td className="px-3 py-2">{alarm.sound ? (isZh ? "开启" : "ON") : (isZh ? "关闭" : "OFF")}</td>
                            <td className="px-3 py-2 text-gray-500">{alarmDisplayText[language][alarm.display] || alarm.display}</td>
                            <td className="px-3 py-2 text-gray-500">{alarm.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {signalTab === "debug" && (
                <div className="grid min-h-0 flex-1 grid-cols-[1.15fr_.85fr] gap-4">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <h3 className="text-sm font-black text-gray-800">{isZh ? "整表校验与生效反馈" : "Validation & Apply Feedback"}</h3>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        [isZh ? "版本状态" : "Version Status", statusText[language][pointTableStatus], "text-blue-600"],
                        [isZh ? "点位数量" : "Point Count", validationResult.pointCount, "text-slate-800"],
                        [isZh ? "正常点位" : "GOOD Points", validationResult.goodCount, "text-emerald-600"],
                        [isZh ? "失败点位" : "Failed Points", validationResult.badCount, validationResult.badCount ? "text-red-600" : "text-emerald-600"],
                        [isZh ? "读取分组" : "Read Groups", validationResult.readGroupCount, "text-slate-800"],
                        [isZh ? "最后采集" : "Last Poll", isZh ? "2 秒前" : "2s ago", "text-slate-800"],
                      ].map(([label, value, color]) => (
                        <div key={label} className="rounded-xl bg-white p-3">
                          <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</div>
                          <div className={`mt-1 text-lg font-black ${color}`}>{value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-xl bg-white p-3">
                      <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                        {isZh ? "失败点位" : "Failed Points"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {validationResult.failedPoints.map((pointCode) => (
                          <span key={pointCode} className="rounded-full bg-red-50 px-2.5 py-1 font-mono text-[10px] font-black text-red-700">
                            {pointCode}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button onClick={handleValidateTable} disabled={!canValidatePointTable} title={!canValidatePointTable ? disabledTitle : ""} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black uppercase text-gray-700 disabled:cursor-not-allowed disabled:opacity-40">
                        {isZh ? "整表校验" : "Validate"}
                      </button>
                      <button onClick={handleApplyVersion} disabled={!canApplyPointTable} title={!canApplyPointTable ? disabledTitle : ""} className="rounded-lg bg-[#4cd7d0] px-3 py-2 text-xs font-black uppercase text-[#00201e] disabled:cursor-not-allowed disabled:opacity-40">
                        {isZh ? "应用版本" : "Apply"}
                      </button>
                      <button onClick={() => canRollbackPointTable && setPointTableStatus("rolled_back")} disabled={!canRollbackPointTable} title={!canRollbackPointTable ? disabledTitle : ""} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-black uppercase text-gray-700 disabled:cursor-not-allowed disabled:opacity-40">
                        {isZh ? "回滚" : "Rollback"}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-[#0f172a] p-4 text-white">
                    <h3 className="text-sm font-black">{isZh ? "点表版本历史" : "Point Table Versions"}</h3>
                    <div className="mt-4 space-y-2">
                      {POINT_TABLE_VERSIONS.map((item) => (
                        <div key={item.version} className="rounded-lg bg-white/5 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-black">{item.version}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                              item.status === "active" ? "bg-emerald-400/20 text-emerald-200" : "bg-yellow-400/20 text-yellow-200"
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-white/60">
                            <span>{isZh ? "点位" : "Points"}: {item.pointCount}</span>
                            <span>{isZh ? "创建" : "Created"}: {item.createdAt}</span>
                            <span className="col-span-2">{isZh ? "生效" : "Activated"}: {item.activatedAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-lg bg-white/5 p-3 font-mono text-[10px] leading-relaxed text-white/60">
                      POST /api/vessels/MHM-TierIII-Demo/devices/MAIN_GENSET_1/point-tables/v2/apply
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Environment & Sync */}
          {activeSection === "sync" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-bold text-gray-800">{t.envSync}</h2>

              {/* Sync Mode Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-full">
                {[
                  { key: "local", label: t.localConfig, icon: "memory" },
                  { key: "cloud", label: t.cloudConfig, icon: "cloud" },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setSyncMode(mode.key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                      syncMode === mode.key
                        ? "bg-white text-[#1A1B1F] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {mode.icon}
                    </span>
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Last Synced */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-bold text-sm text-gray-800">{t.lastSynced}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {lastSynced.toLocaleString(language === "zh" ? "zh-CN" : "en-US")}
                  </p>
                </div>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    isSyncing
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#4cd7d0] text-[#00201e] hover:bg-[#3bc4bc]"
                  }`}
                >
                  {isSyncing ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="material-symbols-outlined text-sm"
                      >
                        progress_activity
                      </motion.span>
                      {isZh ? "同步中..." : "Syncing..."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">sync</span>
                      {t.syncNow}
                    </span>
                  )}
                </button>
              </div>

              {/* Sync Status */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: isZh ? "设置" : "Settings", status: "synced", icon: "settings" },
                  { label: isZh ? "报警" : "Alarms", status: "pending", icon: "notifications" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`p-4 rounded-xl border ${
                      item.status === "synced"
                        ? "bg-green-50 border-green-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-lg ${
                      item.status === "synced" ? "text-green-500" : "text-yellow-500"
                    }`}>
                      {item.icon}
                    </span>
                    <p className="text-xs font-bold text-gray-700 mt-2">{item.label}</p>
                    <p className={`text-[10px] font-bold uppercase ${
                      item.status === "synced" ? "text-green-600" : "text-yellow-600"
                    }`}>
                      {item.status === "synced" ? (isZh ? "已同步" : "Synced") : (isZh ? "待同步" : "Pending")}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* About */}
          {activeSection === "about" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#4CD7D0] to-[#0058bc] rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-2xl">AM</span>
                </div>
                <div>
                  <h2 className="text-2xl font-headline font-black tracking-tight">Livewell</h2>
                  <p className="text-sm text-gray-500">{t.version} 1.0.0</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {isZh
                  ? "船舶数字孪生与模块化监测系统，覆盖发动机监控、实时遥测、趋势分析与智能辅助优化。"
                  : "Advanced Marine Vessel Digital Twin & Modular Monitoring System. Engine monitoring, real-time telemetry, trend analysis, and AI-powered optimization."}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "React", version: "18.x" },
                  { label: "Tailwind CSS", version: "3.x" },
                  { label: "Three.js", version: "0.160+" },
                ].map((dep) => (
                  <div key={dep.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
                    <p className="text-xs font-bold text-gray-700">{dep.label}</p>
                    <p className="text-[10px] text-gray-400">{dep.version}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ConfigPage;

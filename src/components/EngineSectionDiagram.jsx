import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";
import { useUnitSystem } from "../hooks/useUnitSystem";
import useDarkMode from "../hooks/useDarkMode";

const formatPlain = (value, digits = 1) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const positiveNumberOr = (value, fallback) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
};

const SvgGauge = ({ x, y, label, value, unit, max, rawValue, color, palette }) => {
  const numeric = Number(String(rawValue ?? value).replace(/,/g, "")) || 0;
  const pct = Math.max(0, Math.min(numeric / max, 1));
  const theta = Math.PI * (1 - pct);
  const needleLength = 44;
  const needleEndX = 122 + Math.cos(theta) * needleLength;
  const needleEndY = 80 - Math.sin(theta) * needleLength;
  const gaugePath = "M 73 80 A 49 49 0 0 1 171 80";
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width="244" height="124" fill={palette.lightFill} stroke={palette.softStroke} strokeWidth="1.5" />
      <line x1="0" y1="34" x2="244" y2="34" stroke={palette.softStroke} strokeWidth="1" />
      <text x="14" y="22" fontSize="11" fontWeight="900" letterSpacing="1.3" fill={palette.text}>
        {label}
      </text>
      <path d={gaugePath} fill="none" stroke={palette.gaugeTrack} strokeWidth="8" strokeLinecap="butt" />
      <path
        d={gaugePath}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="butt"
        pathLength="100"
        strokeDasharray={`${pct * 100} 100`}
      />
      <line x1="122" y1="80" x2={needleEndX} y2={needleEndY} stroke={palette.text} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="122" cy="80" r="4.5" fill={color} />
      <text x="122" y="103" textAnchor="middle" fontSize="22" fontWeight="900" fill={palette.text}>
          {value}
      </text>
      {unit && (
        <text x="122" y="118" textAnchor="middle" fontSize="11" fontWeight="900" fill={palette.text}>
          {unit}
        </text>
      )}
    </g>
  );
};

const SvgMeter = ({ x, y, label, metric, color, palette, height = 58 }) => {
  const fill = Math.max(0, Math.min(metric?.pct || 0, 1)) * height;
  const muted = metric?.muted;
  return (
    <g>
      <text x={x + 12} y={y - 6} textAnchor="middle" fontSize="8" fontWeight="900" fill={palette.text}>
        {label}
      </text>
      <rect x={x} y={y} width="24" height={height} fill={palette.lightFill} stroke={palette.softStroke} strokeWidth="1" />
      <rect
        x={x + 4}
        y={y + height - fill}
        width="16"
        height={Math.max(0, fill)}
        fill={muted ? palette.mutedFill : color}
        opacity={muted ? "0.45" : "0.9"}
      />
      <text x={x + 12} y={y + height + 13} textAnchor="middle" fontSize="8" fontWeight="900" fill={palette.text}>
        {metric?.text || "--"}
      </text>
      {metric?.unit && (
        <text x={x + 12} y={y + height + 24} textAnchor="middle" fontSize="7" fontWeight="800" fill={palette.text}>
          {metric.unit}
        </text>
      )}
    </g>
  );
};

const SvgControlCell = ({ x, y, width, height = 56, label, value, unit, state, language, palette }) => {
  const zh = language === "zh";
  const stateColor = state === "alarm" ? palette.alarm : state === "active" ? palette.accent : palette.mutedFill;
  const stateLabel = state === "alarm" ? (zh ? "报警" : "ALARM") : state === "active" ? (zh ? "运行" : "RUN") : (zh ? "正常" : "NORMAL");
  const labelY = y + 18;
  const valueY = y + height * 0.66;
  const statusY = y + height * 0.6;
  const valueFontSize = Math.min(22, 17 + Math.max(0, height - 56) * 0.055);
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={palette.lightFill} stroke={palette.softStroke} strokeWidth="1" />
      <text x={x + 8} y={labelY} fontSize="7.5" fontWeight="900" letterSpacing="0.7" fill={palette.text}>
        {label}
      </text>
      {state ? (
        <>
          <circle cx={x + 13} cy={statusY - 4} r="5" fill={stateColor} />
          <text x={x + 25} y={statusY} fontSize="10" fontWeight="900" fill={palette.text}>
            {stateLabel}
          </text>
        </>
      ) : (
        <>
          <text x={x + 8} y={valueY} fontSize={valueFontSize} fontWeight="900" fill={palette.text}>
            {value}
          </text>
          {unit && (
            <text x={x + width - 8} y={valueY - 1} textAnchor="end" fontSize="8.5" fontWeight="900" fill={palette.text}>
              {unit}
            </text>
          )}
        </>
      )}
    </g>
  );
};

const EngineSectionMap = ({ standard, cylinders, formatUnit, language, gauges, diagramHeight, isDark }) => {
  const leftBank = cylinders.slice(0, 8);
  const rightBank = cylinders.slice(8, 16);
  const zh = language === "zh";
  const palette = isDark
    ? {
        background: "#15181d",
        text: "#f8fafc",
        accent: "#5b8def",
        stroke: "#64748b",
        softStroke: "#334155",
        fill: "#20252d",
        lightFill: "#1b2027",
        gaugeTrack: "#3a4655",
        mutedFill: "#64748b",
        alarm: "#fb7185",
      }
    : {
        background: "#ffffff",
        text: "#111827",
        accent: "#1e3a8a",
        stroke: "#8f9aa3",
        softStroke: "#cbd5e1",
        fill: "#edf2f6",
        lightFill: "#f8fafc",
        gaugeTrack: "#d7dee4",
        mutedFill: "#cbd5e1",
        alarm: "#b91c1c",
      };
  const labels = {
    title: zh ? "16 缸柴油发电机组横剖面" : "16-CYL DIESEL GENERATOR SECTION",
    generator: zh ? "发电机" : "GENERATOR",
    diesel: zh ? "柴油机横剖面" : "DIESEL ENGINE SECTION",
    driveEnd: zh ? "驱动端 / 连接发电机" : "DRIVE END / GENERATOR SIDE",
    nonDriveEnd: zh ? "非驱动端" : "NON-DRIVE END",
    exhaust: zh ? "排气温度" : "EXHAUST GAS TEMP",
    liner: zh ? "缸套温度" : "CYLINDER LINER TEMP",
    fuel: zh ? "燃油" : "FUEL OIL",
    lube: zh ? "滑油" : "LUBE OIL",
    chargeAir: zh ? "增压空气" : "CHARGE AIR",
    airPress: zh ? "空气压力" : "AIR PRESS",
    htWater: zh ? "高温水" : "HT WATER",
    ltWater: zh ? "低温水 / 海水" : "LT WATER",
    tc: zh ? "涡轮增压器" : "TURBOCHARGER",
    turbine: zh ? "涡轮" : "TURBINE",
    compressor: zh ? "压气机" : "COMP.",
    out: zh ? "出" : "OUT",
    in: zh ? "进" : "IN",
    unavailable: zh ? "未映射" : "UNMAPPED",
  };
  const pressureMetric = (raw, max = 8, digits = 1) => {
    if (raw === null || raw === undefined) return { text: "--", unit: formatUnit("pressure", 0, digits).unit, pct: 0, muted: true };
    const formatted = formatUnit("pressure", raw, digits);
    return { text: formatted.value, unit: formatted.unit, pct: Math.max(0, Math.min(Number(raw || 0) / max, 1)), muted: raw === null || raw === undefined };
  };
  const tempMetric = (raw, max = 120, digits = 0) => {
    if (raw === null || raw === undefined) return { text: "--", unit: formatUnit("temperature", 0, digits).unit, pct: 0, muted: true };
    const formatted = formatUnit("temperature", raw, digits);
    return { text: formatted.value, unit: formatted.unit, pct: Math.max(0, Math.min(Number(raw || 0) / max, 1)), muted: false };
  };
  const plainMetric = (raw, unit, max, digits = 1) => ({
    text: raw === null || raw === undefined ? "--" : formatPlain(raw, digits),
    unit,
    pct: raw === null || raw === undefined ? 0 : Math.max(0, Math.min(Number(raw || 0) / max, 1)),
    muted: raw === null || raw === undefined,
  });
  const cylinderPairs = Array.from({ length: 8 }, (_, index) => {
    const upper = leftBank[index];
    const lower = rightBank[index];
    const avgTemp = ((upper?.temp || 0) + (lower?.temp || 0)) / 2;
    return { upper, lower, avgTemp };
  });
  const systemGroups = [
    {
      title: labels.fuel,
      x: 372,
      color: palette.accent,
      items: [
        { label: zh ? "压力" : "PRESS", metric: pressureMetric(standard.fuelDeliveryPressure, 8, 1) },
        { label: zh ? "油温" : "TEMP", metric: tempMetric(standard.fuelTemperature, 100, 0) },
        { label: zh ? "共轨" : "RAIL", metric: pressureMetric(standard.fuelRailPressure, 10, 1) },
      ],
    },
    {
      title: labels.lube,
      x: 532,
      color: palette.accent,
      items: [
        { label: zh ? "压力" : "PRESS", metric: pressureMetric(standard.lubeOilPress, 8, 1) },
        { label: zh ? "温度" : "TEMP", metric: tempMetric(standard.lubricatingOilTemperature, 120, 0) },
        { label: zh ? "压差" : "FILTER", metric: pressureMetric(standard.lubeOilFilterDifferentialPressure, 1.2, 2) },
      ],
    },
    {
      title: labels.chargeAir,
      x: 700,
      color: palette.accent,
      items: [
        { label: zh ? "左压" : "P-LB", metric: pressureMetric(standard.intakeManifoldPressureLB, 4, 1) },
        { label: zh ? "右压" : "P-RB", metric: pressureMetric(standard.intakeManifoldPressureRB, 4, 1) },
        { label: zh ? "温度" : "TEMP", metric: tempMetric(standard.intakeManifoldTemperatureLBF, 90, 0) },
      ],
    },
    {
      title: labels.airPress,
      x: 865,
      color: palette.accent,
      items: [
        { label: zh ? "大气" : "BARO", metric: pressureMetric(standard.barometricPressure, 2, 1) },
        { label: zh ? "曲轴箱" : "CRANK", metric: plainMetric(standard.crankcasePressure, "mmH2O", 25, 1) },
      ],
    },
    {
      title: labels.htWater,
      x: 1000,
      color: palette.accent,
      items: [
        { label: zh ? "压力" : "PRESS", metric: pressureMetric(standard.coolantPressure, 6, 1) },
        { label: zh ? "入口" : "IN", metric: tempMetric(standard.coolantTemperature - 6, 120, 0) },
        { label: zh ? "出口" : "OUT", metric: tempMetric(standard.coolantTemperature, 120, 0) },
      ],
    },
    {
      title: labels.ltWater,
      x: 1160,
      color: palette.accent,
      items: [
        { label: zh ? "压力" : "PRESS", metric: pressureMetric(standard.seaWaterPressure, 6, 1) },
        { label: zh ? "入口" : "IN", metric: tempMetric(standard.seaWaterTemperatureIn, 70, 0) },
        { label: zh ? "出口" : "OUT", metric: tempMetric(standard.seaWaterTemperatureOut, 70, 0) },
      ],
    },
  ];

  const controlItems = [
    { label: zh ? "发电功率" : "GEN POWER", value: formatPlain(standard.generatorPower, 0), unit: "kW", accent: palette.accent },
    { label: zh ? "电压" : "VOLTAGE", value: formatPlain(standard.generatorVoltage, 0), unit: "V", accent: palette.accent },
    { label: zh ? "电流" : "CURRENT", value: formatPlain(standard.generatorCurrent, 0), unit: "A", accent: palette.accent },
    { label: zh ? "功率因数" : "POWER FACTOR", value: formatPlain(standard.generatorPowerFactor, 2), accent: palette.accent },
    { label: zh ? "主控制电源" : "MAIN CONTROL", value: formatPlain(standard.mainControlPower, 0), unit: "V", accent: palette.accent },
    { label: zh ? "备用控制电源" : "BACKUP CONTROL", value: formatPlain(standard.backupControlPower, 0), unit: "V", accent: palette.accent },
    { label: zh ? "低油压停机 <1500" : "LO SD <1500", state: standard.lowLubOilShutdownBelow1500 ? "alarm" : "normal" },
    { label: zh ? "低油压停机 >1500" : "LO SD >1500", state: standard.lowLubOilShutdownAbove1500 ? "alarm" : "normal" },
    { label: zh ? "高水温停机" : "COOLANT SD", state: standard.highCoolantTemperatureShutdown ? "alarm" : "normal" },
    { label: zh ? "超速停机" : "OVERSPEED SD", state: standard.overspeedShutdown ? "alarm" : "normal" },
    { label: zh ? "本地急停" : "LOCAL E-STOP", state: standard.localEmergencyStop ? "alarm" : "normal" },
    { label: zh ? "远程急停" : "REMOTE E-STOP", state: standard.remoteEmergencyStop ? "alarm" : "normal" },
    { label: zh ? "发动机运行" : "ENGINE RUN", state: "active" },
  ];
  const lowerExpansion = Math.max(0, diagramHeight - 800);
  const systemsDividerY = 550 + lowerExpansion * 0.28;
  const systemsTitleY = systemsDividerY + 22;
  const systemsMeterY = systemsDividerY + 42;
  const systemsMeterHeight = 36 + Math.min(56, lowerExpansion * 0.48);
  const systemsDividerEndY = systemsMeterY + systemsMeterHeight + 44;
  const controlsCellHeight = 56 + Math.min(80, lowerExpansion * 0.25);
  const controlsDividerY = Math.min(
    systemsDividerEndY + Math.max(26, lowerExpansion * 0.18),
    diagramHeight - controlsCellHeight - 46
  );
  const controlsCellY = controlsDividerY + 26;

  return (
    <svg
      viewBox={`0 0 1600 ${diagramHeight}`}
      className="block h-full min-h-0 w-full"
      preserveAspectRatio="xMidYMin meet"
      role="img"
      aria-label={labels.title}
    >
      <rect x="0" y="0" width="1600" height={diagramHeight} fill={palette.background} />
      {gauges.map((gauge, index) => (
        <SvgGauge key={gauge.label} x={20 + index * 262} y={18} {...gauge} color={palette.accent} palette={palette} />
      ))}

      <text x="26" y="176" fontSize="17" fontWeight="900" fill={palette.text}>
        {labels.title}
      </text>
      <line x1="26" y1="188" x2="1574" y2="188" stroke={palette.softStroke} strokeWidth="1.4" />
      <text x="42" y="218" fontSize="10" fontWeight="900" letterSpacing="1" fill={palette.text}>
        {labels.driveEnd}
      </text>
      <text x="1560" y="218" textAnchor="end" fontSize="10" fontWeight="900" letterSpacing="1" fill={palette.text}>
        {labels.nonDriveEnd}
      </text>

      <g transform="translate(-40 -22) scale(1.065)">
      <g>
        <rect x="40" y="264" width="282" height="226" fill={palette.fill} stroke={palette.stroke} strokeWidth="2" />
        <rect x="62" y="298" width="238" height="92" fill={palette.lightFill} stroke={palette.stroke} strokeWidth="1.2" />
        {Array.from({ length: 8 }, (_, index) => (
          <line key={index} x1={78 + index * 28} y1="304" x2={78 + index * 28} y2="384" stroke={palette.softStroke} strokeWidth="5" />
        ))}
        <rect x="87" y="330" width="188" height="28" fill={isDark ? "#314052" : "#c9dbe1"} stroke={palette.stroke} strokeWidth="1" />
        <line x1="48" y1="404" x2="314" y2="404" stroke={palette.stroke} strokeWidth="2" />
        <text x="181" y="286" textAnchor="middle" fontSize="12" fontWeight="900" fill={palette.text}>
          DG4 · {labels.generator}
        </text>
        <text x="181" y="349" textAnchor="middle" fontSize="20" fontWeight="900" fill={palette.text}>{labels.generator}</text>
        {[
          { label: "NDE", metric: tempMetric(standard.generatorBearingNDETemperature, 120, 0) },
          { label: "U", metric: tempMetric(standard.generatorWindingTemperatureU, 120, 0) },
          { label: "V", metric: tempMetric(standard.generatorWindingTemperatureV, 120, 0) },
          { label: "W", metric: tempMetric(standard.generatorWindingTemperatureW, 120, 0) },
          { label: "DE", metric: tempMetric(standard.generatorBearingDETemperature, 120, 0) },
        ].map((item, index) => (
          <g key={item.label}>
            <rect x={54 + index * 53} y="426" width="46" height="44" fill={palette.lightFill} stroke={palette.softStroke} strokeWidth="1" />
            <text x={77 + index * 53} y="441" textAnchor="middle" fontSize="7.5" fontWeight="900" fill={palette.text}>{item.label}</text>
            <text x={77 + index * 53} y="460" textAnchor="middle" fontSize="11" fontWeight="900" fill={palette.text}>
              {item.metric.text}{item.metric.unit}
            </text>
          </g>
        ))}
      </g>

      <g>
        <rect x="322" y="350" width="78" height="52" fill={isDark ? "#2c3745" : "#d5e2e8"} stroke={palette.stroke} strokeWidth="2" />
        <rect x="340" y="365" width="42" height="22" fill={palette.lightFill} stroke={palette.stroke} strokeWidth="1" />
        <line x1="322" y1="376" x2="420" y2="376" stroke={palette.stroke} strokeWidth="4" />
        <text x="361" y="428" textAnchor="middle" fontSize="9" fontWeight="900" fill={palette.text}>
          {zh ? "联轴器" : "COUPLING"}
        </text>
      </g>

      <g>
        <rect x="420" y="258" width="830" height="268" fill={palette.fill} stroke={palette.stroke} strokeWidth="2" />
        <rect x="420" y="258" width="830" height="36" fill={isDark ? "#2c3745" : "#d7e6ec"} stroke={palette.stroke} strokeWidth="1.4" />
        <line x1="438" y1="400" x2="1232" y2="400" stroke={palette.stroke} strokeWidth="1.5" />
        <line x1="438" y1="507" x2="1232" y2="507" stroke={palette.stroke} strokeWidth="1.5" />
        <text x="835" y="282" textAnchor="middle" fontSize="13" fontWeight="900" fill={palette.text}>
          {labels.diesel}
        </text>
        <text x="835" y="222" textAnchor="middle" fontSize="10" fontWeight="900" letterSpacing="1" fill={palette.text}>{labels.exhaust}</text>
        <text x="438" y="418" fontSize="10" fontWeight="900" letterSpacing="1" fill={palette.text}>{labels.liner}</text>

        {cylinderPairs.map((pair, index) => {
          const x = 445 + index * 99;
          const upperTemp = formatUnit("temperature", pair.upper?.temp || 0, 0);
          const lowerTemp = formatUnit("temperature", pair.lower?.temp || 0, 0);
          const avgTemp = formatUnit("temperature", pair.avgTemp, 0);
          return (
            <g key={index}>
              <path d={`M ${x + 4} 230 L ${x + 76} 230 L ${x + 84} 248 L ${x - 4} 248 Z`} fill={isDark ? "#2c3745" : "#e7eff2"} stroke={palette.stroke} strokeWidth="1.2" />
              <text x={x + 40} y="244" textAnchor="middle" fontSize="8.5" fontWeight="900" fill={palette.text}>
                {avgTemp.value}{avgTemp.unit}
              </text>
              {[
                { item: pair.upper, temp: upperTemp, y: 316 },
                { item: pair.lower, temp: lowerTemp, y: 424 },
              ].map((cylinder) => (
                <g key={`${cylinder.item?.id}-${cylinder.y}`}>
                  <rect x={x} y={cylinder.y} width="80" height="66" fill={palette.lightFill} stroke={palette.stroke} strokeWidth="1.3" />
                  <rect x={x + 8} y={cylinder.y + 12} width="64" height="8" fill={isDark ? "#314052" : "#c9dbe1"} />
                  <text x={x + 40} y={cylinder.y + 39} textAnchor="middle" fontSize="9" fontWeight="900" fill={palette.text}>
                    {zh ? `${cylinder.item?.id} 缸` : `CYL ${cylinder.item?.id}`}
                  </text>
                  <text x={x + 40} y={cylinder.y + 57} textAnchor="middle" fontSize="11" fontWeight="900" fill={palette.text}>
                    {cylinder.temp.value}{cylinder.temp.unit}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
      </g>

      <g>
        <rect x="1302" y="325" width="230" height="126" fill={palette.fill} stroke={palette.stroke} strokeWidth="2" />
        <rect x="1331" y="351" width="82" height="72" fill={isDark ? "#2c3745" : "#e7eff2"} stroke={palette.stroke} strokeWidth="1.2" />
        <rect x="1422" y="351" width="82" height="72" fill={palette.lightFill} stroke={palette.stroke} strokeWidth="1.2" />
        <line x1="1250" y1="338" x2="1302" y2="338" stroke={palette.stroke} strokeWidth="3" />
        <line x1="1250" y1="430" x2="1302" y2="430" stroke={palette.stroke} strokeWidth="3" />
        <text x="1417" y="304" textAnchor="middle" fontSize="11" fontWeight="900" fill={palette.text}>{labels.tc}</text>
        <text x="1372" y="391" textAnchor="middle" fontSize="13" fontWeight="900" fill={palette.text}>{labels.turbine}</text>
        <text x="1463" y="391" textAnchor="middle" fontSize="13" fontWeight="900" fill={palette.text}>{labels.compressor}</text>
        <text x="1417" y="472" textAnchor="middle" fontSize="9" fontWeight="900" fill={palette.text}>
          {labels.out} {formatUnit("temperature", standard.exhaustTempRB, 0).value}{formatUnit("temperature", standard.exhaustTempRB, 0).unit}
          {" · "}
          {labels.in} {formatUnit("temperature", standard.exhaustTempLB, 0).value}{formatUnit("temperature", standard.exhaustTempLB, 0).unit}
        </text>
      </g>
      </g>

      <g>
        <line x1="26" y1={systemsDividerY} x2="1574" y2={systemsDividerY} stroke={palette.softStroke} strokeWidth="1.4" />
        {systemGroups.map((group, groupIndex) => {
          const x = 38 + groupIndex * 258;
          return (
            <g key={group.title}>
              <line x1={x - 12} y1={systemsDividerY + 18} x2={x - 12} y2={systemsDividerEndY} stroke={palette.accent} strokeWidth="3" />
              <text x={x} y={systemsTitleY} fontSize="10" fontWeight="900" fill={palette.text}>{group.title}</text>
              {group.items.map((item, index) => (
                <SvgMeter key={item.label} x={x + index * 38} y={systemsMeterY} label={item.label} metric={item.metric} color={palette.accent} palette={palette} height={systemsMeterHeight} />
              ))}
            </g>
          );
        })}
      </g>

      <g>
        <line x1="26" y1={controlsDividerY} x2="1574" y2={controlsDividerY} stroke={palette.softStroke} strokeWidth="1.4" />
        {controlItems.map((item, index) => (
          <SvgControlCell key={item.label} x={20 + index * 120} y={controlsCellY} width={112} height={controlsCellHeight} language={language} palette={palette} {...item} />
        ))}
      </g>
    </svg>
  );
};

const EngineSectionDiagram = ({ engine }) => {
  const { language } = useLanguage();
  const { formatUnit } = useUnitSystem();
  const isDark = useDarkMode();
  const containerRef = useRef(null);
  const [diagramHeight, setDiagramHeight] = useState(800);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return undefined;

    const updateDiagramHeight = (width, height) => {
      if (!width || !height) return;
      const nextHeight = Math.round((height / width) * 1600);
      setDiagramHeight(Math.max(800, Math.min(1120, nextHeight)));
    };

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      updateDiagramHeight(width, height);
    });

    observer.observe(container);
    updateDiagramHeight(container.clientWidth, container.clientHeight);
    return () => observer.disconnect();
  }, []);

  const standard = useMemo(() => {
    const cylinderTemps = engine?.cylinders?.length
      ? engine.cylinders.slice(0, 16)
      : Array.from({ length: 16 }, (_, index) => 405 + index * 3);
    while (cylinderTemps.length < 16) {
      cylinderTemps.push(cylinderTemps[cylinderTemps.length - 1] || 410);
    }

    const lbTemps = cylinderTemps.slice(0, 8);
    const rbTemps = cylinderTemps.slice(8, 16);
    const avg = (items) => items.reduce((sum, item) => sum + item, 0) / items.length;
    const oilPress = engine?.oilPressure || 4.2;
    const coolantTemp = engine?.coolantTemp || 78;
    const lubeOilTemp = engine?.lubeOilTemp ?? engine?.lubricatingOilTemperature ?? coolantTemp + 7;
    const fuelDeliveryPress = engine?.fuelDeliveryPressure ?? engine?.fuelPressure ?? 4.5;
    const generatorDefaults = {
      power: 12450,
      voltage: 400,
      current: 462,
      powerFactor: 0.85,
      frequency: 50.0,
      windingU: 92,
      windingV: 94,
      windingW: 91,
      bearingNDE: 68,
      bearingDE: 72,
      inlet: 35,
    };

    return {
      lubeOilPress: oilPress,
      coolantTemperature: coolantTemp,
      lubricatingOilTemperature: lubeOilTemp,
      coolantPressure: engine?.coolantPressure ?? 3.2,
      seaWaterPressure: engine?.seaWaterPressure ?? 2.8,
      seaWaterTemperatureIn: engine?.seaWaterTemperatureIn ?? engine?.ltWaterTemperatureIn ?? null,
      seaWaterTemperatureOut: engine?.seaWaterTemperatureOut ?? engine?.ltWaterTemperatureOut ?? null,
      expansionTankLowAlarm: engine?.expansionTankLowAlarm ?? false,
      exhaustCylinders: cylinderTemps.map((temp, index) => ({ id: index + 1, temp })),
      fuelRailPressure: engine?.fuelRailPressure ?? 7.6,
      fuelDeliveryPressure: fuelDeliveryPress,
      intakeManifoldPressureLB: engine?.intakeManifoldPressureLB ?? 2.4,
      intakeManifoldPressureRB: engine?.intakeManifoldPressureRB ?? 2.6,
      intakeManifoldTemperatureLBF: engine?.intakeManifoldTemperatureLBF ?? 45,
      intakeManifoldTemperatureLBR: engine?.intakeManifoldTemperatureLBR ?? 47,
      intakeManifoldTemperatureRBF: engine?.intakeManifoldTemperatureRBF ?? 46,
      intakeManifoldTemperatureRBR: engine?.intakeManifoldTemperatureRBR ?? 48,
      exhaustTempLB: engine?.exhaustTempLB ?? avg(lbTemps),
      exhaustTempRB: engine?.exhaustTempRB ?? avg(rbTemps),
      crankcasePressure: engine?.crankcasePressure ?? 12.1,
      fuelTemperature: engine?.fuelTemperature ?? engine?.fuelTemp ?? 38,
      barometricPressure: engine?.barometricPressure ?? 1.0,
      lubeOilFilterDifferentialPressure: engine?.lubeOilFilterDifferentialPressure ?? 0.52,
      mainControlPower: engine?.mainControlPower ?? 24,
      backupControlPower: engine?.backupControlPower ?? 24,
      load: engine?.load ?? 0,
      generatorPower: positiveNumberOr(engine?.power, generatorDefaults.power),
      generatorVoltage: positiveNumberOr(engine?.voltage, generatorDefaults.voltage),
      generatorCurrent: positiveNumberOr(engine?.current, generatorDefaults.current),
      generatorPowerFactor: positiveNumberOr(engine?.powerFactor, generatorDefaults.powerFactor),
      generatorFrequency: positiveNumberOr(engine?.frequency, generatorDefaults.frequency),
      generatorWindingTemperature: positiveNumberOr(
        engine?.generatorWindingTemperature ?? engine?.windingTemperature,
        (generatorDefaults.windingU + generatorDefaults.windingV + generatorDefaults.windingW) / 3
      ),
      generatorWindingTemperatureU: positiveNumberOr(engine?.generatorWindingTemperatureU ?? engine?.windingTemperatureU, generatorDefaults.windingU),
      generatorWindingTemperatureV: positiveNumberOr(engine?.generatorWindingTemperatureV ?? engine?.windingTemperatureV, generatorDefaults.windingV),
      generatorWindingTemperatureW: positiveNumberOr(engine?.generatorWindingTemperatureW ?? engine?.windingTemperatureW, generatorDefaults.windingW),
      generatorBearingNDETemperature: positiveNumberOr(engine?.generatorBearingNDETemperature ?? engine?.bearingNDETemperature, generatorDefaults.bearingNDE),
      generatorBearingDETemperature: positiveNumberOr(engine?.generatorBearingDETemperature ?? engine?.bearingDETemperature, generatorDefaults.bearingDE),
      generatorInletTemperature: positiveNumberOr(engine?.generatorInletTemperature ?? engine?.alternatorInletTemperature, generatorDefaults.inlet),
      lowLubOilShutdownBelow1500: engine?.lowLubOilShutdownBelow1500 ?? oilPress < 2.1,
      lowLubOilShutdownAbove1500: engine?.lowLubOilShutdownAbove1500 ?? oilPress < 2.8,
      highCoolantTemperatureShutdown: engine?.highCoolantTemperatureShutdown ?? coolantTemp > 95,
      fuelLeakageAlarm: engine?.fuelLeakageAlarm ?? false,
      engineSpeed: engine?.rpm || 850,
      overspeedShutdown: engine?.overspeedShutdown ?? (engine?.rpm || 850) > 1100,
      localEmergencyStop: engine?.localEmergencyStop ?? false,
      remoteEmergencyStop: engine?.remoteEmergencyStop ?? false,
    };
  }, [engine]);

  const zh = language === "zh";
  const paramLabels = {
    lubeOilPress: zh ? "滑油压力" : "Lube Oil Press",
    coolantTemp: zh ? "冷却水温度" : "Coolant Temp",
    lubeOilTemp: zh ? "滑油温度" : "Lube Oil Temp",
    coolantPress: zh ? "冷却水压力" : "Coolant Press",
    seaWaterPress: zh ? "海水压力" : "Sea Water Press",
    engineSpeed: zh ? "发动机转速" : "Engine Speed",
    lubOilTemp: zh ? "滑油温度" : "Lub. Oil Temp",
    filterDiffPress: zh ? "滤器压差" : "Filter Diff Press",
    crankcasePress: zh ? "曲轴箱压力" : "Crankcase Press",
    expansionTankLow: zh ? "膨胀水箱液位低" : "Expansion Tank Level Low",
    exhaustTempLB: zh ? "左列排气温度" : "Exhaust Temp. LB",
    exhaustTempRB: zh ? "右列排气温度" : "Exhaust Temp. RB",
    fuelRailPress: zh ? "燃油共轨压力" : "Fuel Rail Press",
    fuelDeliveryPress: zh ? "燃油供给压力" : "Fuel Delivery Press",
    fuelTemp: zh ? "燃油温度" : "Fuel Temp",
    fuelLeakageAlarm: zh ? "燃油泄漏报警" : "Fuel Leakage Alarm",
    manifoldPressLB: zh ? "左列歧管压力" : "Manifold Press LB",
    manifoldPressRB: zh ? "右列歧管压力" : "Manifold Press RB",
    tempLBF: zh ? "左列前端温度" : "Temp LBF",
    tempLBR: zh ? "左列后端温度" : "Temp LBR",
    tempRBF: zh ? "右列前端温度" : "Temp RBF",
    tempRBR: zh ? "右列后端温度" : "Temp RBR",
    barometricPress: zh ? "大气压力" : "Barometric Press",
    mainControlPower: zh ? "主控制电源" : "Main Control Power",
    backupControlPower: zh ? "备用控制电源" : "Backup Control Power",
    lowLOPressBelow1500: zh ? "低滑油压力停机 <1500" : "Low LO Press SD <1500",
    lowLOPressAbove1500: zh ? "低滑油压力停机 >1500" : "Low LO Press SD >1500",
    highCoolantTempSD: zh ? "高冷却水温停机" : "High Coolant Temp SD",
    overspeedShutdown: zh ? "超速停机" : "Overspeed Shutdown",
    localEmergencyStop: zh ? "本地急停" : "Local Emergency Stop",
    remoteEmergencyStop: zh ? "远程急停" : "Remote Emergency Stop",
    engineRunning: zh ? "发动机运行" : "Engine Running",
    generatorPower: zh ? "发电机功率" : "Generator Power",
    generatorVoltage: zh ? "电压" : "Voltage",
    generatorCurrent: zh ? "电流" : "Current",
    generatorFrequency: zh ? "频率" : "Frequency",
    generatorPowerFactor: zh ? "功率因数" : "Power Factor",
    generatorWindingTemp: zh ? "发电机绕组温度" : "Generator Winding Temp",
    generatorInletTemp: zh ? "发电机进口温度" : "Generator Inlet Temp",
  };
  const gauges = [
    { label: paramLabels.generatorVoltage, value: formatPlain(standard.generatorVoltage, 0), rawValue: standard.generatorVoltage, unit: "V", max: 500 },
    { label: paramLabels.generatorCurrent, value: formatPlain(standard.generatorCurrent, 0), rawValue: standard.generatorCurrent, unit: "A", max: 650 },
    { label: paramLabels.generatorPowerFactor, value: formatPlain(standard.generatorPowerFactor, 2), rawValue: standard.generatorPowerFactor, unit: "", max: 1 },
    { label: paramLabels.generatorPower, value: formatPlain(standard.generatorPower, 0), rawValue: standard.generatorPower, unit: "kW", max: 15000 },
    { label: zh ? "负荷" : "Load", value: formatPlain(standard.load, 0), rawValue: standard.load, unit: "%", max: 100 },
    { label: paramLabels.engineSpeed, value: standard.engineSpeed, rawValue: standard.engineSpeed, unit: zh ? "r/min" : "RPM", max: 1600 },
  ];

  return (
    <div ref={containerRef} className="h-full min-h-[300px] w-full overflow-hidden bg-transparent p-0 shadow-none">
      <EngineSectionMap
        standard={standard}
        cylinders={standard.exhaustCylinders}
        formatUnit={formatUnit}
        language={language}
        gauges={gauges}
        diagramHeight={diagramHeight}
        isDark={isDark}
      />
    </div>
  );
};

export default EngineSectionDiagram;

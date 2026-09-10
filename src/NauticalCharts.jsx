import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import { useLanguage } from "./hooks/useLanguage";
import { useAlarmsData } from "./hooks/useRealTimeData";

const vessels = [
  {
    id: "MAYO-002",
    name: "MAYO-002",
    status: "En route: Singapore",
    statusZh: "航行中: 新加坡",
    statusColor: "#2ae500",
    lat: 31.23,
    lon: 122.10,
    time: "14:23:02",
    sog: "18.4 kn",
  },
  {
    id: "KARMIN-1131",
    name: "KARMIN 1131",
    status: "At Anchor: Shanghai",
    statusZh: "锚泊中: 上海",
    statusColor: "#2ae500",
    lat: 31.45,
    lon: 121.85,
    time: "14:20:15",
    sog: "0.0 kn",
  },
  {
    id: "RIVERBOSS-521",
    name: "RIVERBOSS 521",
    status: "System: Maintenance",
    statusZh: "系统: 维护中",
    statusColor: "#ba1a1a",
    lat: 31.10,
    lon: 122.30,
    time: "14:18:44",
    sog: "0.0 kn",
  },
  {
    id: "OCEANIC-PRIDE",
    name: "OCEANIC PRIDE",
    status: "En route: Busan",
    statusZh: "航行中: 釜山",
    statusColor: "#2ae500",
    lat: 31.60,
    lon: 122.50,
    time: "14:22:01",
    sog: "22.1 kn",
  },
];

const routeTrack = [
  [31.23, 122.10],
  [25.00, 120.00],
  [18.00, 115.00],
  [8.00, 108.00],
  [1.50, 104.00],
  [1.29, 103.85],
];

const vesselPositions = vessels.map((v) => [v.lat, v.lon]);
const transparentTile =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
const tileLayerOptions = {
  detectRetina: false,
  updateWhenIdle: false,
  updateWhenZooming: false,
  keepBuffer: 6,
  crossOrigin: true,
  errorTileUrl: transparentTile,
};

function MapViewportController({ positions }) {
  const map = useMap();
  useEffect(() => {
    const refreshMap = () => {
      map.invalidateSize({ animate: false });
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          layer.redraw();
        }
      });
    };

    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, {
        paddingTopLeft: [320, 120],
        paddingBottomRight: [320, 190],
        maxZoom: 9,
        animate: false,
      });
    }

    const timers = [0, 120, 350, 800, 1400].map((delay) =>
      window.setTimeout(refreshMap, delay)
    );
    window.addEventListener("resize", refreshMap);

    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener("resize", refreshMap);
    };
  }, [map, positions]);
  return null;
}

const createVesselIcon = (color, isSelected) => {
  const size = isSelected ? 18 : 12;
  const ring = isSelected ? `<div style="width:${size + 8}px;height:${size + 8}px;border-radius:50%;border:2px solid #0058bc;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);box-shadow:0 0 12px rgba(0,160,233,0.6);"></div>` : "";
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;box-shadow:0 0 15px ${color}80,0 0 30px ${color}40;border:1.5px solid #ffffff40;"></div>
        ${ring}
      </div>
    `,
    iconSize: [size + (isSelected ? 8 : 0), size + (isSelected ? 8 : 0)],
    iconAnchor: [size / 2 + (isSelected ? 4 : 0), size / 2 + (isSelected ? 4 : 0)],
  });
};

const bottomCards = [
  { id: 0, type: "voyage" },
  { id: 1, type: "power" },
];

const NauticalCharts = () => {
  const { t, language } = useLanguage();
  const { alarms } = useAlarmsData(5000, language);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const mapRef = useRef(null);
  const activeVessel = selectedVessel || vessels[0];
  const totalGeneratorPower = "6.0 MW";
  const nauticalAlarms = (alarms.active || []).filter((alarm) => !alarm.acknowledged).slice(0, 3);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize({ animate: false });
      }
      window.dispatchEvent(new Event("resize"));
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleVesselClick = (vessel) => {
    setSelectedVessel(vessel);
    if (mapRef.current) {
      mapRef.current.setView([vessel.lat, vessel.lon], 8, { animate: true });
    }
  };

  const handleClose = () => {
    setSelectedVessel(null);
    if (mapRef.current) {
      mapRef.current.setView([25, 122], 6, { animate: true });
    }
  };

  const getStatusText = (vessel) => {
    return language === "zh" ? vessel.statusZh : vessel.status;
  };

  const formatCoord = (val, isLat) => {
    const dir = isLat ? (val >= 0 ? "N" : "S") : val >= 0 ? "E" : "W";
    return `${Math.abs(val).toFixed(4)}° ${dir}`;
  };

  return (
    <main className="flex-1 min-h-0 relative overflow-hidden bg-[#c7e5eb]">
      {/* Leaflet Map Layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <MapContainer
          center={[25, 122]}
          zoom={6}
          style={{
            width: "100%",
            height: "100%",
            background: "#c7e5eb",
            pointerEvents: "auto",
          }}
          worldCopyJump={true}
          maxBounds={[[-85, -180], [85, 180]]}
          ref={mapRef}
          zoomControl={false}
          preferCanvas={true}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri, GEBCO, NOAA, Garmin, HERE, and other contributors'
            maxZoom={13}
            zIndex={1}
            {...tileLayerOptions}
          />

          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}"
            attribution=""
            maxZoom={13}
            opacity={0.92}
            zIndex={2}
            {...tileLayerOptions}
          />

          <MapViewportController positions={vesselPositions} />

          <Polyline
            positions={routeTrack}
            pathOptions={{
              color: "#00ffcc",
              weight: 2,
              opacity: 0.7,
              dashArray: "8, 10",
            }}
          />

          {vessels.map((vessel) => (
            <Marker
              key={vessel.id}
              position={[vessel.lat, vessel.lon]}
              icon={createVesselIcon(vessel.statusColor, selectedVessel?.id === vessel.id)}
              eventHandlers={{
                click: () => handleVesselClick(vessel),
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Left Sidebar: Vessel List */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed bottom-4 left-4 top-44 z-20 flex w-56 flex-col overflow-hidden rounded-2xl bg-[#2e3132]/95 p-4 shadow-xl backdrop-blur-md"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-black text-sm">{t.vesselA}</h2>
            <p className="text-[#717786] text-[10px]">{t.systemOnline}</p>
          </div>
          <span className="material-symbols-outlined text-[#2ae500]" style={{ fontVariationSettings: "'FILL' 1" }}>
            sailing
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {vessels.map((vessel, idx) => (
            <motion.div
              key={vessel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              onClick={() => handleVesselClick(vessel)}
              className={`flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer border-l-4 ${
                selectedVessel?.id === vessel.id
                  ? "bg-white/15 border-white/50"
                  : "bg-white/5 hover:bg-white/10"
              }`}
              style={{ borderLeftColor: selectedVessel?.id === vessel.id ? "#0058bc" : vessel.statusColor }}
            >
              <div>
                <p className="text-white text-[10px] font-bold uppercase tracking-wider">{vessel.name}</p>
                <p className="text-[#717786] text-[9px]">{getStatusText(vessel)}</p>
              </div>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: vessel.statusColor }} />
            </motion.div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold leading-5 text-white/55">
          {language === "zh" ? "船队列表仅用于选择当前展示船舶。" : "Fleet list selects the vessel shown on the chart."}
        </div>
      </motion.aside>

      {/* Right Sidebar: Real-time Telemetry & Alarms */}
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed bottom-4 right-4 top-44 z-20 flex w-64 flex-col overflow-hidden rounded-2xl bg-[#2e3132]/95 shadow-xl backdrop-blur-md"
      >
        <div className="p-4 border-b border-white/10 bg-[#191c1e]/30">
          <h3 className="text-white font-bold text-[10px] uppercase tracking-widest mb-3">{t.realTimeDataLabel}</h3>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: "GPS", value: `${formatCoord(activeVessel.lat, true)} / ${formatCoord(activeVessel.lon, false)}` },
              { label: t.localTime, value: activeVessel.time },
              { label: t.totalGeneratorPower, value: totalGeneratorPower },
              { label: t.speedOverGround, value: activeVessel.sog },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-white/5 p-3">
                <p className="text-[#717786] text-[9px] uppercase font-bold tracking-wider">{item.label}</p>
                <p className="mt-1 truncate text-[#2ae500] font-mono text-[14px] font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <section>
            <h4 className="text-white/40 font-bold text-[10px] uppercase tracking-widest mb-4">{t.vitals}</h4>
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex justify-between items-center group"
              >
                <span className="text-[#717786] text-[13px] group-hover:text-white transition-colors">{t.currentDraft}</span>
                <span className="text-[#2ae500] font-mono text-[13px]">14.8 m</span>
              </motion.div>
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-white/40 font-bold text-[10px] uppercase tracking-widest">{t.activeAlarmsLabel}</h4>
              <span className="text-[#ba1a1a] bg-[#ba1a1a]/10 px-2 py-0.5 rounded text-[10px] font-bold">{nauticalAlarms.length}</span>
            </div>
            <div className="space-y-3">
              {nauticalAlarms.map((alarm, index) => (
                <motion.div
                  key={alarm.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.08 }}
                  className="bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 p-3 rounded-xl flex items-start gap-3"
                >
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">notification_important</span>
                  <div className="min-w-0">
                    <p className="truncate text-white text-[12px] font-bold">{alarm.message}</p>
                    <p className="truncate text-[#ba1a1a] text-[10px]">{alarm.source || "--"} • {alarm.time || alarm.timestamp || "--"}</p>
                  </div>
                </motion.div>
              ))}
              {nauticalAlarms.length === 0 && (
                <div className="rounded-xl bg-white/5 p-3 text-[12px] font-bold text-white/45">{t.noActiveAlarms}</div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white/5 p-3 rounded-xl flex items-start gap-3 opacity-60"
              >
                <span className="material-symbols-outlined text-[#717786] text-[18px]">history</span>
                  <div>
                    <p className="text-white/60 text-[12px] font-bold">{t.filterMaintenance}</p>
                  <p className="text-white/30 text-[10px]">{language === "zh" ? "日志 ID" : "Log ID"}: #9921 • {t.scheduled}</p>
                  </div>
                </motion.div>
            </div>
          </section>
        </div>
      </motion.aside>

      {/* Center: Position Pop-up */}
      {selectedVessel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="pointer-events-none absolute left-4 right-4 top-4 z-30 flex items-start justify-center sm:left-64 sm:right-72 sm:top-5"
        >
          <div className="pointer-events-auto w-full max-w-[420px] overflow-y-auto rounded-xl border border-white/10 bg-[#2e3132]/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedVessel.statusColor }} />
                <h2 className="text-lg font-black text-white">{selectedVessel.name}</h2>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{t.updatedAgo}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-[#0058bc]/20 p-2">
                <span className="material-symbols-outlined text-[24px] text-[#0058bc]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  radar
                </span>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="mb-1 text-[9px] font-bold uppercase text-white/40">{t.latitude}</p>
                <p className="font-mono text-base text-white">{formatCoord(selectedVessel.lat, true)}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="mb-1 text-[9px] font-bold uppercase text-white/40">{t.longitude}</p>
                <p className="font-mono text-base text-white">{formatCoord(selectedVessel.lon, false)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="mb-1 text-[9px] font-bold uppercase text-white/40">{t.localTime}</p>
                <p className="font-mono text-base text-white">{selectedVessel.time}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="mb-1 text-[9px] font-bold uppercase text-white/40">{t.speedOverGround}</p>
                <p className="font-mono text-base text-[#2ae500]">{selectedVessel.sog}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 rounded-xl bg-[#0058bc] py-2.5 text-sm font-bold text-white transition-transform active:scale-95">
              {t.openChartDetails}
            </button>
            <button className="flex w-10 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20">
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
          </div>
        </motion.div>
      )}

      {!selectedVessel && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="bg-[#2e3132]/60 backdrop-blur-sm border border-white/10 px-6 py-3 rounded-full">
            <p className="text-white/60 text-xs font-medium">{t.clickVessel}</p>
          </div>
        </div>
      )}

      {/* Bottom: Voyage Statistics Cards */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-20">
        {bottomCards.map((card, idx) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            className="w-[320px] bg-[#2e3132]/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/5"
          >
            {card.type === "voyage" ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold text-[10px] uppercase tracking-wider">{t.voyageProgress}</h3>
                  <span className="text-[#2ae500] text-[10px] font-bold">84%</span>
                </div>

                <div className="h-16 flex items-end justify-between gap-1 mb-3">
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "50%" }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="w-full bg-white/5 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "66%" }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="w-full bg-white/5 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "75%" }}
                    transition={{ delay: 1.0, duration: 0.5 }}
                    className="w-full bg-[#0058bc]/40 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "80%" }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                    className="w-full bg-[#0058bc]/60 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "100%" }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    className="w-full bg-[#0058bc] rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "75%" }}
                    transition={{ delay: 1.3, duration: 0.5 }}
                    className="w-full bg-[#0058bc]/80 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "50%" }}
                    transition={{ delay: 1.4, duration: 0.5 }}
                    className="w-full bg-white/5 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "33%" }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                    className="w-full bg-white/5 rounded-t"
                  />
                  <motion.div
                    initial={{ height: "10%" }}
                    animate={{ height: "25%" }}
                    transition={{ delay: 1.6, duration: 0.5 }}
                    className="w-full bg-white/5 rounded-t"
                  />
                </div>

                <div className="flex justify-between text-[10px] text-white/40 uppercase font-bold">
                  <span>{t.departure}</span>
                  <span>{t.eta}: 4h 12m</span>
                  <span>{t.arrival}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold text-[10px] uppercase tracking-wider">{language === "zh" ? "功率" : "POWER"}</h3>
                  <span className="text-[#2ae500] text-[10px] font-bold">+3.8% {t.optimalLabel}</span>
                </div>

                <div className="relative h-16 mb-3 overflow-hidden rounded-xl bg-white/5">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 100">
                    <motion.path
                      d="M0,70 Q45,46 95,58 T190,30 T300,44 T400,24"
                      fill="none"
                      stroke="#79ff5b"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 0.8 }}
                    />
                    <path d="M0,70 Q45,46 95,58 T190,30 T300,44 T400,24 L400,100 L0,100 Z" fill="url(#gradient-green)" opacity="0.1" />
                    <defs>
                      <linearGradient id="gradient-green" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#79ff5b', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#79ff5b', stopOpacity: 0 }} />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white/40 text-[10px] font-bold uppercase">{language === "zh" ? "平均功率" : "AVG POWER"}</p>
                    <p className="text-white text-[16px] font-bold">12,450 <span className="text-[10px]">kW</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40 text-[10px] font-bold uppercase">{t.efficiency}</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#2ae500]" />
                      <p className="text-white text-[16px] font-bold">98.2%</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>

      <style>{`
        .leaflet-container {
          font-family: inherit;
          background: #c7e5eb;
        }
        .leaflet-tile-pane {
          background: transparent;
        }
        .leaflet-tile-pane img {
          background: transparent;
        }
        img.leaflet-tile {
          background: transparent !important;
        }
        .leaflet-popup.twin-popup .leaflet-popup-content-wrapper {
          background: #111c24;
          color: #ffffff;
          border: 1px solid #00a0e9;
          border-radius: 4px;
          box-shadow: 0 0 12px rgba(0,160,233,0.5);
        }
        .leaflet-popup.twin-popup .leaflet-popup-tip {
          background: #111c24;
        }
        .leaflet-popup.twin-popup .leaflet-popup-content {
          margin: 10px 12px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </main>
  );
};

export default NauticalCharts;

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TrainSchedule } from '../../types';
import { AffectedTrainDetail } from '../../utils/simulation';
import { AlertTriangle, Train as TrainIcon, Navigation, Info } from 'lucide-react';
import { useThemedTileLayer } from '../../hooks/useThemedTileLayer';

interface EmergencyCorridorMapProps {
  corridorId: string;
  failureType: string;
  location: string;
  affectedTrains: AffectedTrainDetail[];
}

type CorridorTrack = {
  id: string;
  name: string;
  code: string;
  type: 'Passenger' | 'Freight';
  coordinates: [number, number][]; // [lng, lat] GeoJSON format
};

const corridorTracks: CorridorTrack[] = [
  {
    id: 'COR-01',
    name: 'BSP-DURG Main Line (UP)',
    code: 'BSP-DURG-UP',
    type: 'Passenger',
    coordinates: [
      [82.1409, 22.0797], // BSP
      [81.9360, 21.7371], // BYT
      [81.6296, 21.2514], // R
      [81.3824, 21.2137], // BPHB
      [81.2849, 21.1904]  // DURG
    ]
  },
  {
    id: 'COR-02',
    name: 'BSP-DURG Main Line (DOWN)',
    code: 'BSP-DURG-DN',
    type: 'Passenger',
    coordinates: [
      [81.2849, 21.1984],
      [81.3824, 21.2217],
      [81.6296, 21.2594],
      [81.9360, 21.7451],
      [82.1409, 22.0877]
    ]
  },
  {
    id: 'COR-03',
    name: 'RAIPUR-MANDIR HASAUD Line',
    code: 'R-MNDH',
    type: 'Passenger',
    coordinates: [
      [81.6296, 21.2514],
      [81.7766, 21.2227]
    ]
  },
  {
    id: 'COR-04',
    name: 'RAIPUR-LAKHOLI Line',
    code: 'R-LAE',
    type: 'Freight',
    coordinates: [
      [81.6296, 21.2514],
      [81.7766, 21.2227],
      [81.8210, 21.1610]
    ]
  },
  {
    id: 'COR-05',
    name: 'RAIPUR-ABHANPUR Branch Line',
    code: 'R-AVP',
    type: 'Passenger',
    coordinates: [
      [81.6296, 21.2514],
      [81.6850, 21.1250],
      [81.7180, 21.0535]
    ]
  },
  {
    id: 'COR-06',
    name: 'ABHANPUR-RAJIM Branch Line',
    code: 'AVP-RIM',
    type: 'Passenger',
    coordinates: [
      [81.7180, 21.0535],
      [81.8797, 20.9634]
    ]
  }
];

export const EmergencyCorridorMap: React.FC<EmergencyCorridorMapProps> = ({
  corridorId,
  failureType,
  location,
  affectedTrains
}) => {
  const { theme, initThemedTileLayer, tileLayerRef } = useThemedTileLayer();
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);

  useEffect(() => {
    if (!mapElementRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(mapElementRef.current, {
      zoomControl: false,
      attributionControl: true
    });
    mapRef.current = map;

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initialize themed tile layer (swaps in place on theme change)
    initThemedTileLayer(map);

    const layerGroup = L.featureGroup();

    // Determine alternate corridor (e.g., if COR-01 is affected, alternate is COR-02, and vice versa)
    const alternateCorridorId = corridorId === 'COR-01' ? 'COR-02' : corridorId === 'COR-02' ? 'COR-01' : null;

    // Draw all corridor tracks
    corridorTracks.forEach((track) => {
      const isAffected = track.id === corridorId;
      const isAlternate = track.id === alternateCorridorId;

      let color = '#475569'; // Muted slate default
      let weight = 3;
      let opacity = 0.6;
      let dashArray: string | undefined = undefined;

      if (isAffected) {
        color = '#F97316'; // Warning orange for entire affected corridor
        weight = 5;
        opacity = 0.95;
      } else if (isAlternate) {
        color = '#06B6D4'; // Cyan/blue for bypass route
        weight = 4;
        opacity = 0.9;
        dashArray = '6, 6';
      }

      const geoJsonFeature = {
        type: 'Feature' as const,
        properties: {
          name: track.name,
          code: track.code,
          isAffected,
          isAlternate
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: track.coordinates
        }
      };

      const trackLayer = L.geoJSON(geoJsonFeature, {
        style: {
          color,
          weight,
          opacity,
          dashArray,
          lineCap: 'round',
          lineJoin: 'round'
        }
      });

      trackLayer.bindTooltip(
        `${track.name} ${isAffected ? '⚠️ [AFFECTED CORRIDOR]' : isAlternate ? '🔄 [DESIGNATED BYPASS]' : ''}`,
        { className: 'emergency-map-tooltip', sticky: true }
      );

      trackLayer.on('click', () => {
        setSelectedEntity(`Corridor: ${track.name} (${track.code})`);
      });

      trackLayer.addTo(layerGroup);
    });

    // Draw the Red Danger Segment for the failed location
    const affectedTrack = corridorTracks.find((t) => t.id === corridorId) || corridorTracks[0];
    if (affectedTrack.coordinates.length >= 2) {
      // Create sub-segment representing the exact blocked sector
      // In COR-01 (BSP-DURG-UP), coordinates[0] is Bilaspur (BSP), coordinates[1] is Bhatapara (BYT).
      // Incident KM 142.4 - 146.0 is between Bilaspur and Bhatapara.
      const p1 = affectedTrack.coordinates[0];
      const p2 = affectedTrack.coordinates[1];

      const hazardSegment = {
        type: 'Feature' as const,
        properties: { name: 'Emergency Sector' },
        geometry: {
          type: 'LineString' as const,
          coordinates: [p1, p2]
        }
      };

      const hazardLayer = L.geoJSON(hazardSegment, {
        style: {
          color: '#EF4444', // Intense Red
          weight: 8,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round'
        }
      });

      hazardLayer.bindPopup(`
        <div class="emergency-popup-box">
          <div class="emergency-popup-alert">🚨 INCIDENT RED ZONE</div>
          <div class="emergency-popup-row"><b>Failure:</b> <span class="font-bold text-red-700">${failureType}</span></div>
          <div class="emergency-popup-row"><b>Location:</b> <span class="font-bold text-slate-900">${location}</span></div>
          <div class="emergency-popup-status">STATUS: ISOLATED / BLOCKED</div>
        </div>
      `, { className: 'emergency-map-popup-container' });
      hazardLayer.addTo(layerGroup);

      // Add animated Hazard Icon Marker at midpoint of hazard sector
      const midLat = (p1[1] + p2[1]) / 2;
      const midLng = (p1[0] + p2[0]) / 2;

      const hazardIcon = L.divIcon({
        className: 'emergency-hazard-div-icon',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <span style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background-color: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <span style="position: relative; width: 22px; height: 22px; border-radius: 9999px; background: linear-gradient(135deg, #dc2626, #991b1b); border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold; box-shadow: 0 0 15px rgba(239, 68, 68, 0.8);">⚠️</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const hazardMarker = L.marker([midLat, midLng], {
        icon: hazardIcon,
        zIndexOffset: 1000
      });

      hazardMarker.bindTooltip(
        `<div style="display: flex; align-items: center; gap: 5px; font-family: ui-monospace, monospace; font-size: 11px; font-weight: 700; color: #0f172a;">
           <span style="color: #ef4444; font-size: 12px;">🚨</span>
           <span style="color: #b91c1c; font-weight: 800;">${failureType}</span>
           <span style="color: #475569; font-weight: 600;">(${location})</span>
         </div>`,
        {
          permanent: true,
          direction: 'top',
          offset: [0, -18],
          className: 'emergency-pin-tooltip'
        }
      );
      hazardMarker.addTo(layerGroup);
    }

    // Add Train Position Markers for affected trains, ensuring distinct anchor points & vertical offsets
    const coordsList = affectedTrack.coordinates;
    const numCoords = coordsList.length;

    affectedTrains.slice(0, 4).forEach((item, idx) => {
      const train = item.train;
      // Stagger trains along distinct corridor stations so they do not collide with each other or the hazard marker
      let lat: number;
      let lng: number;

      if (idx === 0) {
        // Approaching train held at or north of Bilaspur
        lat = coordsList[0][1] + 0.05;
        lng = coordsList[0][0] + 0.04;
      } else if (idx === 1) {
        // Regulated freight train (e.g. B/BOXN-402) held at Bhatapara loop line
        lat = coordsList[Math.min(1, numCoords - 1)][1];
        lng = coordsList[Math.min(1, numCoords - 1)][0];
      } else if (idx === 2) {
        // Train regulated at Raipur
        lat = coordsList[Math.min(2, numCoords - 1)][1];
        lng = coordsList[Math.min(2, numCoords - 1)][0];
      } else {
        // Train regulated at Bhilai / Durg
        lat = coordsList[Math.min(3 + (idx - 3), numCoords - 1)][1];
        lng = coordsList[Math.min(3 + (idx - 3), numCoords - 1)][0];
      }

      const isHighPriority = train.type === 'Vande Bharat' || train.priorityLevel === 'High-Speed';

      const trainIcon = L.divIcon({
        className: 'emergency-train-div-icon',
        html: `
          <div class="emergency-train-pill ${isHighPriority ? 'is-high-priority' : ''}">
            <span class="emergency-train-icon">🚆</span>
            <span class="emergency-train-number">${train.trainNo}</span>
            <span class="emergency-train-delay">+${item.estimatedDelayMinutes}m</span>
          </div>
        `,
        iconSize: [110, 24],
        iconAnchor: [55, 12]
      });

      const trainMarker = L.marker([lat, lng], {
        icon: trainIcon,
        zIndexOffset: 800 - idx * 20
      });

      trainMarker.bindPopup(`
        <div class="emergency-popup-box">
          <div class="emergency-popup-train-title">🚆 ${train.trainNo} ${train.trainName}</div>
          <div class="emergency-popup-row"><b>Type:</b> ${train.type}</div>
          <div class="emergency-popup-delay"><b>Est. Delay:</b> +${item.estimatedDelayMinutes} minutes</div>
          <div class="emergency-popup-impact">${item.plainEnglishImpact}</div>
        </div>
      `, { className: 'emergency-map-popup-container' });
      trainMarker.addTo(layerGroup);
    });

    layerGroup.addTo(map);
    map.fitBounds(layerGroup.getBounds(), { padding: [35, 35] });

    return () => {
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
        tileLayerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, [corridorId, failureType, location, affectedTrains]);

  return (
    <div
      className={`relative h-[440px] w-full rounded-2xl border transition-colors overflow-hidden shadow-2xl ${
        theme === 'dark'
          ? 'border-rose-500/40 bg-railway-bg'
          : 'border-rose-400/50 bg-slate-100'
      } emergency-map-theme-${theme} theme-${theme}`}
      data-theme={theme}
    >
      <div
        ref={mapElementRef}
        className="h-full w-full"
        style={{ background: theme === 'dark' ? '#0b1120' : 'var(--bg-secondary)' }}
      />

      {/* Floating Map Legend (Bottom-Left) */}
      <div
        className="pointer-events-none absolute bottom-4 left-4 z-[500] w-[min(300px,calc(100%-2rem))] rounded-xl border border-slate-200 bg-white/95 text-slate-800 p-3.5 shadow-xl backdrop-blur-md transition-colors"
      >
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between text-slate-600">
          <span className="font-extrabold text-slate-900">EMERGENCY MAP LEGEND</span>
          <span className="text-rose-600 flex items-center gap-1 font-bold text-[9.5px]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            Live Vector
          </span>
        </div>
        <div className="space-y-1.5 text-[11px] font-mono">
          <div className="flex items-center gap-2 font-semibold text-rose-700">
            <span className="h-2 w-5 rounded bg-rose-600 border border-rose-400 animate-pulse shrink-0" />
            <span>Blocked / Fracture Zone</span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-orange-700">
            <span className="h-1.5 w-5 rounded bg-orange-500 shrink-0" />
            <span>Affected Corridor</span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-cyan-700">
            <span className="h-1.5 w-5 rounded bg-cyan-400 border border-dashed border-cyan-600 shrink-0" />
            <span>Designated Bypass Route</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span className="h-1 w-5 rounded bg-slate-400 shrink-0" />
            <span>Normal Operational Tracks</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200 text-slate-700 font-medium">
            <span>🚆</span>
            <span>Affected Regulated Train Vectors</span>
          </div>
        </div>
      </div>

      {/* Top Floating Red Zone Badge (Top-Left) */}
      <div
        className="pointer-events-none absolute top-4 left-4 z-[500] rounded-xl border border-red-300/90 bg-[#FEF2F2]/95 px-3.5 py-2 text-xs font-semibold text-red-900 shadow-md backdrop-blur-md flex items-center gap-2.5 border-l-4 border-l-red-600 transition-colors"
      >
        <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 animate-pulse" />
        <span className="font-bold tracking-tight">Active Corridor Red Zone: <span className="font-mono font-bold text-red-800">{location}</span></span>
      </div>

      <style>{`
        /* ================= TRAIN PILL MARKERS ================= */
        .emergency-train-pill {
          border-radius: 8px;
          padding: 2px 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: ui-monospace, monospace;
          font-size: 10px;
          font-weight: bold;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .emergency-train-delay {
          font-size: 8px;
          padding: 1px 3px;
          border-radius: 3px;
          font-weight: 700;
        }

        /* Dark Theme Train Marker */
        .emergency-map-theme-dark .emergency-train-pill,
        .theme-dark .emergency-train-pill,
        [data-theme="dark"] .emergency-train-pill {
          background-color: #0f172a;
          border: 1.5px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
          color: #ffffff;
        }
        .emergency-map-theme-dark .emergency-train-pill.is-high-priority,
        .theme-dark .emergency-train-pill.is-high-priority,
        [data-theme="dark"] .emergency-train-pill.is-high-priority {
          border-color: #38bdf8;
        }
        .emergency-map-theme-dark .emergency-train-pill.is-high-priority .emergency-train-icon,
        .theme-dark .emergency-train-pill.is-high-priority .emergency-train-icon,
        [data-theme="dark"] .emergency-train-pill.is-high-priority .emergency-train-icon {
          color: #38bdf8;
        }
        .emergency-map-theme-dark .emergency-train-delay,
        .theme-dark .emergency-train-delay,
        [data-theme="dark"] .emergency-train-delay {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }

        /* Light Theme Train Marker */
        .emergency-map-theme-light .emergency-train-pill,
        .theme-light .emergency-train-pill,
        [data-theme="light"] .emergency-train-pill {
          background-color: #ffffff;
          border: 1.5px solid #94a3b8;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          color: #0f172a;
        }
        .emergency-map-theme-light .emergency-train-pill.is-high-priority,
        .theme-light .emergency-train-pill.is-high-priority,
        [data-theme="light"] .emergency-train-pill.is-high-priority {
          border-color: #0284c7;
        }
        .emergency-map-theme-light .emergency-train-pill.is-high-priority .emergency-train-icon,
        .theme-light .emergency-train-pill.is-high-priority .emergency-train-icon,
        [data-theme="light"] .emergency-train-pill.is-high-priority .emergency-train-icon {
          color: #0284c7;
        }
        .emergency-map-theme-light .emergency-train-delay,
        .theme-light .emergency-train-delay,
        [data-theme="light"] .emergency-train-delay {
          background: rgba(239, 68, 68, 0.15);
          color: #b91c1c;
        }

        /* ================= POPUP STYLES ================= */
        .emergency-popup-box {
          font-family: ui-monospace, monospace;
          padding: 4px;
        }
        .emergency-popup-alert {
          color: #ef4444;
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 4px;
        }
        .emergency-popup-train-title {
          color: #0284c7;
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 3px;
        }
        .emergency-popup-row {
          font-size: 11px;
          margin-top: 2px;
        }
        .emergency-popup-status {
          color: #f59e0b;
          font-size: 10px;
          margin-top: 4px;
          font-weight: 700;
        }
        .emergency-popup-delay {
          color: #ef4444;
          font-size: 11px;
          margin-top: 2px;
          font-weight: 600;
        }
        .emergency-popup-impact {
          font-size: 10px;
          margin-top: 4px;
        }

        /* Dark Theme Popups */
        .emergency-map-theme-dark .emergency-map-popup-container .leaflet-popup-content-wrapper,
        .theme-dark .emergency-map-popup-container .leaflet-popup-content-wrapper,
        [data-theme="dark"] .emergency-map-popup-container .leaflet-popup-content-wrapper,
        .emergency-map-theme-dark .emergency-map-popup-container .leaflet-popup-tip,
        .theme-dark .emergency-map-popup-container .leaflet-popup-tip,
        [data-theme="dark"] .emergency-map-popup-container .leaflet-popup-tip {
          background: #0e172b !important;
          border: 1px solid #2d4a7d !important;
          color: #e2e8f0 !important;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.75);
        }
        .emergency-map-theme-dark .emergency-popup-row {
          color: #e2e8f0;
        }
        .emergency-map-theme-dark .emergency-popup-row b {
          color: #94a3b8;
        }
        .emergency-map-theme-dark .emergency-popup-impact {
          color: #94a3b8;
        }
        .emergency-map-theme-dark .emergency-map-popup-container .leaflet-popup-close-button,
        .theme-dark .emergency-map-popup-container .leaflet-popup-close-button,
        [data-theme="dark"] .emergency-map-popup-container .leaflet-popup-close-button {
          color: #94a3b8 !important;
        }
        .emergency-map-theme-dark .emergency-map-popup-container .leaflet-popup-close-button:hover,
        .theme-dark .emergency-map-popup-container .leaflet-popup-close-button:hover,
        [data-theme="dark"] .emergency-map-popup-container .leaflet-popup-close-button:hover {
          color: #f8fafc !important;
        }

        /* Light Theme Popups */
        .emergency-map-theme-light .emergency-map-popup-container .leaflet-popup-content-wrapper,
        .theme-light .emergency-map-popup-container .leaflet-popup-content-wrapper,
        [data-theme="light"] .emergency-map-popup-container .leaflet-popup-content-wrapper,
        .emergency-map-theme-light .emergency-map-popup-container .leaflet-popup-tip,
        .theme-light .emergency-map-popup-container .leaflet-popup-tip,
        [data-theme="light"] .emergency-map-popup-container .leaflet-popup-tip {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172b !important;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08) !important;
        }
        .emergency-map-theme-light .emergency-popup-row {
          color: #1e293b;
        }
        .emergency-map-theme-light .emergency-popup-row b {
          color: #475569;
        }
        .emergency-map-theme-light .emergency-popup-impact {
          color: #475569;
        }
        .emergency-map-theme-light .emergency-map-popup-container .leaflet-popup-close-button,
        .theme-light .emergency-map-popup-container .leaflet-popup-close-button,
        [data-theme="light"] .emergency-map-popup-container .leaflet-popup-close-button {
          color: #64748b !important;
        }
        .emergency-map-theme-light .emergency-map-popup-container .leaflet-popup-close-button:hover,
        .theme-light .emergency-map-popup-container .leaflet-popup-close-button:hover,
        [data-theme="light"] .emergency-map-popup-container .leaflet-popup-close-button:hover {
          color: #0f172a !important;
        }

        /* ================= TOOLTIP STYLES ================= */
        .emergency-map-theme-dark .emergency-map-tooltip,
        .theme-dark .emergency-map-tooltip,
        [data-theme="dark"] .emergency-map-tooltip {
          background: #0f172a !important;
          border: 1px solid #ef4444 !important;
          color: #f8fafc !important;
          font-family: ui-monospace, monospace;
          font-size: 11px;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
        .emergency-map-theme-dark .emergency-map-tooltip::before,
        .theme-dark .emergency-map-tooltip::before,
        [data-theme="dark"] .emergency-map-tooltip::before {
          border-top-color: #ef4444 !important;
          border-bottom-color: #ef4444 !important;
        }

        .emergency-map-theme-light .emergency-map-tooltip,
        .theme-light .emergency-map-tooltip,
        [data-theme="light"] .emergency-map-tooltip {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          border-left: 3px solid #ef4444 !important;
          color: #0f172b !important;
          font-family: ui-monospace, monospace;
          font-size: 11px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          pointer-events: none !important;
          z-index: 400 !important;
        }
        .emergency-map-theme-light .emergency-map-tooltip::before,
        .theme-light .emergency-map-tooltip::before,
        [data-theme="light"] .emergency-map-tooltip::before {
          border-top-color: #ef4444 !important;
          border-bottom-color: #ef4444 !important;
        }

        .emergency-pin-tooltip {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          border-left: 3.5px solid #ef4444 !important;
          color: #0f172a !important;
          font-family: ui-monospace, monospace;
          font-weight: 700;
          font-size: 11px;
          border-radius: 6px;
          padding: 4px 8px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), 0 0 1px rgba(239, 68, 68, 0.3) !important;
          white-space: nowrap;
          z-index: 1000 !important;
        }
        .emergency-pin-tooltip::before {
          border-top-color: #ffffff !important;
          border-bottom-color: #ffffff !important;
        }

        /* ================= ZOOM CONTROLS ================= */
        .emergency-map-theme-dark .leaflet-control-zoom a,
        .theme-dark .leaflet-control-zoom a,
        [data-theme="dark"] .leaflet-control-zoom a {
          background: #0e172b !important;
          border-color: #2d4a7d !important;
          color: #cbd5e1 !important;
        }
        .emergency-map-theme-dark .leaflet-control-zoom a:hover,
        .theme-dark .leaflet-control-zoom a:hover,
        [data-theme="dark"] .leaflet-control-zoom a:hover {
          background: #1e293b !important;
          color: #ffffff !important;
        }

        .emergency-map-theme-light .leaflet-control-zoom a,
        .theme-light .leaflet-control-zoom a,
        [data-theme="light"] .leaflet-control-zoom a {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #334155 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }
        .emergency-map-theme-light .leaflet-control-zoom a:hover,
        .theme-light .leaflet-control-zoom a:hover,
        [data-theme="light"] .leaflet-control-zoom a:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }

        /* ================= ATTRIBUTION STRIP ================= */
        .emergency-map-theme-dark .leaflet-control-attribution,
        .theme-dark .leaflet-control-attribution,
        [data-theme="dark"] .leaflet-control-attribution {
          background: rgba(14, 23, 43, 0.85) !important;
          color: #64748b !important;
          font-size: 9px !important;
        }
        .emergency-map-theme-dark .leaflet-control-attribution a,
        .theme-dark .leaflet-control-attribution a,
        [data-theme="dark"] .leaflet-control-attribution a {
          color: #38bdf8 !important;
        }

        .emergency-map-theme-light .leaflet-control-attribution,
        .theme-light .leaflet-control-attribution,
        [data-theme="light"] .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.85) !important;
          color: #64748b !important;
          font-size: 9px !important;
        }
        .emergency-map-theme-light .leaflet-control-attribution a,
        .theme-light .leaflet-control-attribution a,
        [data-theme="light"] .leaflet-control-attribution a {
          color: #0284c7 !important;
        }
      `}</style>
    </div>
  );
};

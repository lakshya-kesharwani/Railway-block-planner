import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../../context/AppContext';
import { Corridor } from '../../types';
import { INITIAL_CORRIDORS } from '../../data/mockData';

interface MapCorridorTrack {
  id: string;
  name: string;
  code: string;
  color: string;
  route: [number, number][];
  startStation: string;
  endStation: string;
  sectionLengthKm: number;
  maxSpeedKmph: number;
  dailyTrainDensity: number;
  status: string;
}

// 6 Active Corridors with real-world station endpoints and matching schedule legend colors
const CORRIDOR_METADATA: Record<string, { color: string; startStation: string; endStation: string; route: [number, number][] }> = {
  'COR-01': {
    color: '#3B82F6', // Blue
    startStation: 'BSP (Bilaspur Jn)',
    endStation: 'DURG (Durg Jn)',
    route: [
      [22.0797, 82.1409],
      [21.7371, 81.9360],
      [21.2514, 81.6296],
      [21.2137, 81.3824],
      [21.1904, 81.2849]
    ]
  },
  'BSP-DURG-UP': {
    color: '#3B82F6', // Blue alias
    startStation: 'BSP (Bilaspur Jn)',
    endStation: 'DURG (Durg Jn)',
    route: [
      [22.0797, 82.1409],
      [21.7371, 81.9360],
      [21.2514, 81.6296],
      [21.2137, 81.3824],
      [21.1904, 81.2849]
    ]
  },
  'COR-02': {
    color: '#06B6D4', // Cyan
    startStation: 'DURG (Durg Jn)',
    endStation: 'BSP (Bilaspur Jn)',
    route: [
      [21.1984, 81.2849],
      [21.2217, 81.3824],
      [21.2594, 81.6296],
      [21.7451, 81.9360],
      [22.0877, 82.1409]
    ]
  },
  'BSP-DURG-DN': {
    color: '#06B6D4', // Cyan alias
    startStation: 'DURG (Durg Jn)',
    endStation: 'BSP (Bilaspur Jn)',
    route: [
      [21.1984, 81.2849],
      [21.2217, 81.3824],
      [21.2594, 81.6296],
      [21.7451, 81.9360],
      [22.0877, 82.1409]
    ]
  },
  'COR-03': {
    color: '#22C55E', // Green
    startStation: 'R (Raipur Jn)',
    endStation: 'MNDH (Mandir Hasaud)',
    route: [
      [21.2514, 81.6296],
      [21.2227, 81.7766]
    ]
  },
  'R-MNDH': {
    color: '#22C55E', // Green alias
    startStation: 'R (Raipur Jn)',
    endStation: 'MNDH (Mandir Hasaud)',
    route: [
      [21.2514, 81.6296],
      [21.2227, 81.7766]
    ]
  },
  'COR-04': {
    color: '#EAB308', // Yellow
    startStation: 'R (Raipur Jn)',
    endStation: 'LAE (Lakholi)',
    route: [
      [21.2514, 81.6296],
      [21.2227, 81.7766],
      [21.1610, 81.8210]
    ]
  },
  'R-LAE': {
    color: '#EAB308', // Yellow alias
    startStation: 'R (Raipur Jn)',
    endStation: 'LAE (Lakholi)',
    route: [
      [21.2514, 81.6296],
      [21.2227, 81.7766],
      [21.1610, 81.8210]
    ]
  },
  'COR-05': {
    color: '#A855F7', // Purple
    startStation: 'R (Raipur Jn)',
    endStation: 'AVP (Abhanpur Jn)',
    route: [
      [21.2514, 81.6296],
      [21.1250, 81.6850],
      [21.0535, 81.7180]
    ]
  },
  'R-AVP': {
    color: '#A855F7', // Purple alias
    startStation: 'R (Raipur Jn)',
    endStation: 'AVP (Abhanpur Jn)',
    route: [
      [21.2514, 81.6296],
      [21.1250, 81.6850],
      [21.0535, 81.7180]
    ]
  },
  'COR-06': {
    color: '#EC4899', // Pink
    startStation: 'AVP (Abhanpur Jn)',
    endStation: 'RIM (Rajim)',
    route: [
      [21.0535, 81.7180],
      [20.9634, 81.8797]
    ]
  },
  'AVP-RIM': {
    color: '#EC4899', // Pink alias
    startStation: 'AVP (Abhanpur Jn)',
    endStation: 'RIM (Rajim)',
    route: [
      [21.0535, 81.7180],
      [20.9634, 81.8797]
    ]
  }
};

// Custom divIcons for origin, endpoint, and junction station nodes matching light theme and track colors
const createStationOriginIcon = (color: string) =>
  L.divIcon({
    className: 'custom-station-node',
    html: `<div style="width: 12px; height: 12px; border-radius: 50%; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25), 0 0 6px ${color}88; transition: transform 0.15s ease;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

const createStationEndpointIcon = (color: string) =>
  L.divIcon({
    className: 'custom-endpoint-node',
    html: `<div style="width: 12px; height: 12px; border-radius: 50%; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25), 0 0 6px ${color}88; transition: transform 0.15s ease;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

const createJunctionStationIcon = () =>
  L.divIcon({
    className: 'custom-junction-node',
    html: `<div style="width: 12px; height: 12px; border-radius: 50%; background: #EF4444; border: 2px solid #ffffff; box-shadow: 0 0 0 2.5px rgba(239, 68, 68, 0.25), 0 0 10px rgba(239, 68, 68, 0.65), 0 1px 4px rgba(0, 0, 0, 0.25); transition: transform 0.15s ease, box-shadow 0.15s ease;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

import { useThemedTileLayer } from '../../hooks/useThemedTileLayer';

// Helper to compute Euclidean distance between two [lat, lng] points
function getSegmentDistance(p1: [number, number], p2: [number, number]): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

// Linear interpolation between two coordinates
function interpolateCoordinate(p1: [number, number], p2: [number, number], t: number): [number, number] {
  return [
    p1[0] + (p2[0] - p1[0]) * t,
    p1[1] + (p2[1] - p1[1]) * t
  ];
}

// Slice an exact partial subsegment of a polyline given fractional start and end (0.0 to 1.0)
function slicePolylineByRatio(
  route: [number, number][],
  startRatio: number,
  endRatio: number
): [number, number][] {
  if (route.length < 2) return route;

  const distances: number[] = [0];
  let totalDist = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const d = getSegmentDistance(route[i], route[i + 1]);
    totalDist += d;
    distances.push(totalDist);
  }

  if (totalDist === 0) return route;

  const clampedStart = Math.max(0, Math.min(1, Math.min(startRatio, endRatio)));
  const clampedEnd = Math.max(0, Math.min(1, Math.max(startRatio, endRatio)));

  const targetStart = totalDist * clampedStart;
  const targetEnd = totalDist * clampedEnd;

  const result: [number, number][] = [];

  // 1. Locate interpolated start point
  let startIdx = 0;
  while (startIdx < distances.length - 1 && distances[startIdx + 1] < targetStart) {
    startIdx++;
  }
  const seg1Start = distances[startIdx];
  const seg1End = distances[startIdx + 1];
  const seg1Len = seg1End - seg1Start;
  const tStart = seg1Len > 0 ? (targetStart - seg1Start) / seg1Len : 0;
  result.push(interpolateCoordinate(route[startIdx], route[startIdx + 1], tStart));

  // 2. Include all intermediate vertices within range
  for (let i = startIdx + 1; i < distances.length - 1; i++) {
    if (distances[i] > targetStart && distances[i] < targetEnd) {
      result.push(route[i]);
    }
  }

  // 3. Locate interpolated end point
  let endIdx = 0;
  while (endIdx < distances.length - 1 && distances[endIdx + 1] < targetEnd) {
    endIdx++;
  }
  const seg2Start = distances[endIdx];
  const seg2End = distances[endIdx + 1];
  const seg2Len = seg2End - seg2Start;
  const tEnd = seg2Len > 0 ? (targetEnd - seg2Start) / seg2Len : 0;
  result.push(interpolateCoordinate(route[endIdx], route[endIdx + 1], tEnd));

  return result;
}

export interface CorridorTaskOverlay {
  id: string;
  type: 'ongoing' | 'pending';
  corridorId: string;
  corridorCode: string;
  title: string;
  category: string;
  categoryLabel?: string;
  startRatio: number;
  endRatio: number;
  kmText: string;
  windowText: string;
  statusText: string;
}

export interface CorridorLeafletMapProps {
  tasks?: CorridorTaskOverlay[];
  selectedDateText?: string;
  isLoading?: boolean;
}

export const DEFAULT_TASKS: CorridorTaskOverlay[] = [
  {
    id: 'TSK-01',
    type: 'ongoing',
    corridorId: 'COR-01',
    corridorCode: 'BSP-DURG-UP',
    title: 'OHE Neutral Section & Dropper Test',
    category: 'OHE',
    categoryLabel: '⚡ OHE Maintenance',
    startRatio: 0.28,
    endRatio: 0.62,
    kmText: 'KM 58.0 – 92.0',
    windowText: '14:00 - 18:00',
    statusText: 'Active'
  },
  {
    id: 'TSK-02',
    type: 'pending',
    corridorId: 'COR-03',
    corridorCode: 'R-MNDH',
    title: 'Track Tamping 09-3X & USFD Inspection',
    category: 'Civil',
    categoryLabel: '🛠️ Civil / Track',
    startRatio: 0.25,
    endRatio: 0.75,
    kmText: 'KM 6.2 – 18.5',
    windowText: '22:30 - 02:30',
    statusText: 'Scheduled'
  }
];

export const CorridorLeafletMap: React.FC<CorridorLeafletMapProps> = ({
  tasks: propTasks,
  selectedDateText,
  isLoading = false
}) => {
  const { corridors } = useApp();
  const { theme, initThemedTileLayer, tileLayerRef } = useThemedTileLayer();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const currentTasks = propTasks !== undefined ? propTasks : DEFAULT_TASKS;
  const currentTasksRef = useRef<CorridorTaskOverlay[]>(currentTasks);
  currentTasksRef.current = currentTasks;

  // Toggle state for track name label popups (default unchecked for clean map)
  const [showTrackLabels, setShowTrackLabels] = useState<boolean>(false);
  const showTrackLabelsRef = useRef<boolean>(false);
  const startMarkersRef = useRef<L.Marker[]>([]);

  // Toggle state for partial task status overlays (default checked)
  const [showTaskStatus, setShowTaskStatus] = useState<boolean>(true);
  const showTaskStatusRef = useRef<boolean>(true);
  const taskOverlayLayersRef = useRef<L.Polyline[]>([]);

  // React to toggle changes by opening or closing track tooltips
  useEffect(() => {
    showTrackLabelsRef.current = showTrackLabels;
    startMarkersRef.current.forEach((marker) => {
      if (showTrackLabels) {
        marker.openTooltip();
      } else {
        marker.closeTooltip();
      }
    });
  }, [showTrackLabels]);

  // React to Show Task Status toggle by adding or removing partial task polylines
  useEffect(() => {
    showTaskStatusRef.current = showTaskStatus;
    taskOverlayLayersRef.current.forEach((layer) => {
      if (!mapInstanceRef.current) return;
      if (showTaskStatus) {
        if (!mapInstanceRef.current.hasLayer(layer)) {
          layer.addTo(mapInstanceRef.current);
        }
      } else {
        if (mapInstanceRef.current.hasLayer(layer)) {
          layer.remove();
        }
      }
    });
  }, [showTaskStatus]);

  const activeCorridors = corridors && corridors.length > 0 ? corridors : INITIAL_CORRIDORS;

  const tracks: MapCorridorTrack[] = useMemo(() => {
    return activeCorridors.map((corridor: Corridor) => {
      const meta = CORRIDOR_METADATA[corridor.id] || CORRIDOR_METADATA[corridor.code] || {
        color: '#F97316',
        startStation: 'Start Station',
        endStation: 'End Station',
        route: corridor.route || [[21.2514, 81.6296], [21.1904, 81.2849]]
      };

      return {
        id: corridor.id,
        name: corridor.name,
        code: corridor.code,
        color: meta.color,
        route: corridor.route && corridor.route.length > 0 ? corridor.route : meta.route,
        startStation: meta.startStation,
        endStation: meta.endStation,
        sectionLengthKm: corridor.sectionLengthKm,
        maxSpeedKmph: corridor.maxSpeedKmph,
        dailyTrainDensity: corridor.dailyTrainDensity,
        status: corridor.status
      };
    });
  }, [activeCorridors]);

  // Dynamically render task overlay polylines
  const renderTaskOverlays = useCallback((tasksToRender: CorridorTaskOverlay[]) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!map.getPane('floatingTasksPane')) {
      const taskPane = map.createPane('floatingTasksPane');
      taskPane.style.zIndex = '450';
      taskPane.style.pointerEvents = 'auto';
    }

    // Remove existing task layers
    taskOverlayLayersRef.current.forEach((layer) => layer.remove());
    taskOverlayLayersRef.current = [];

    tasksToRender.forEach((task) => {
      const track = tracks.find(
        (t) => t.id === task.corridorId || t.code === task.corridorCode
      );
      if (!track || track.route.length < 2) return;

      const partialCoords = slicePolylineByRatio(
        track.route,
        task.startRatio,
        task.endRatio
      );

      const isOngoing = task.type === 'ongoing';
      const color = isOngoing ? '#EF4444' : '#EAB308';
      const className = isOngoing
        ? 'rail-task-partial-ongoing'
        : 'rail-task-partial-pending';

      const polyline = L.polyline(partialCoords, {
        pane: 'floatingTasksPane',
        color,
        weight: 6,
        opacity: 1,
        dashArray: isOngoing ? undefined : '7, 5',
        lineCap: 'round',
        lineJoin: 'round',
        className,
        interactive: true
      });

      const tooltipHtml = `
        <div class="corridor-chip-content" style="border-left-color: ${color}; min-width: 180px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
            <span style="font-weight:700; color:${color}; font-size:10px;">
              ${isOngoing ? '⚡ Ongoing Task' : '⏳ Pending Task'}
            </span>
            <span style="background:${color}22; color:${color}; border:1px solid ${color}55; padding:1px 5px; border-radius:4px; font-size:8.5px; font-weight:700;">
              ${task.statusText}
            </span>
          </div>
          <div style="font-weight:700; font-size:11.5px; margin-top:2px;" class="text-slate-900 dark:text-white">${task.title}</div>
          <div style="font-size:9.5px; color:#94a3b8; font-family:monospace;">${track.code} • ${task.kmText}</div>
          <div style="border-top:1px solid rgba(148,163,184,0.25); margin-top:4px; padding-top:3px; display:flex; justify-content:space-between; font-size:9px; color:#cbd5e1;">
            <span class="text-slate-600 dark:text-slate-300">Window: ${task.windowText}</span>
            <span style="color:${color}; font-weight:700;">${isOngoing ? 'Active' : 'Scheduled'}</span>
          </div>
        </div>
      `;

      polyline.bindTooltip(tooltipHtml, {
        sticky: true,
        direction: 'top',
        offset: [0, -14],
        className: 'corridor-leaflet-chip'
      });

      if (showTaskStatusRef.current) {
        polyline.addTo(map);
      }

      taskOverlayLayersRef.current.push(polyline);
    });
  }, [tracks]);

  // Re-draw task overlays when tasks change (e.g. upon date selection)
  useEffect(() => {
    if (mapInstanceRef.current) {
      renderTaskOverlays(currentTasks);
    }
  }, [currentTasks, renderTaskOverlays]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    startMarkersRef.current = [];

    // Initialize Leaflet map instance centered on Chhattisgarh
    const map = L.map(mapContainerRef.current, {
      center: [21.5, 81.7],
      zoom: 9,
      scrollWheelZoom: false, // Prevents hijacking vertical page scroll
      zoomControl: true,
      attributionControl: true
    });
    mapInstanceRef.current = map;

    // High-contrast CartoDB tile layer matching theme
    initThemedTileLayer(map, { maxZoom: 18 });

    const allCoords: L.LatLngTuple[] = [];

    // Ensure R-MNDH (green) renders on top of (after) R-LAE (yellow) without modifying any other line order
    const drawOrderedTracks = [...tracks].sort((a, b) => {
      if ((a.code === 'R-MNDH' || a.id === 'COR-03') && (b.code === 'R-LAE' || b.id === 'COR-04')) {
        return 1; // R-MNDH drawn after R-LAE
      }
      if ((a.code === 'R-LAE' || a.id === 'COR-04') && (b.code === 'R-MNDH' || b.id === 'COR-03')) {
        return -1; // R-LAE drawn before R-MNDH
      }
      return 0; // preserve all other lines' relative order
    });

    const rMndhLayers: L.Polyline[] = [];

    // Render each corridor polyline, station markers, and floating label chips
    drawOrderedTracks.forEach((track) => {
      track.route.forEach((pt) => allCoords.push([pt[0], pt[1]]));

      // Underlay glow polyline
      const glow = L.polyline(track.route, {
        color: track.color,
        weight: 10,
        opacity: 0.18,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Core track polyline
      const polyline = L.polyline(track.route, {
        color: track.color,
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      if (track.code === 'R-MNDH' || track.id === 'COR-03') {
        rMndhLayers.push(glow, polyline);
      }

      // Detailed corridor specs popup on line click
      const popupHtml = `
        <div class="space-y-2 p-1 text-xs">
          <div class="border-b border-slate-700 pb-1.5">
            <span class="font-mono text-[10px] font-bold" style="color: ${track.color}">
              ${track.code}
            </span>
            <h4 class="font-bold text-white text-sm mt-0.5">${track.name}</h4>
          </div>
          <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-300 mt-2">
            <div>
              <span class="block text-[10px] text-slate-400">Route Span:</span>
              <span class="font-medium">${track.startStation} → ${track.endStation}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-400">Track Section:</span>
              <span class="font-medium">${track.sectionLengthKm} km</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-400">Max Speed:</span>
              <span class="font-medium">${track.maxSpeedKmph} km/h</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-400">Daily Density:</span>
              <span class="font-medium">${track.dailyTrainDensity} Trains</span>
            </div>
          </div>
        </div>
      `;
      polyline.bindPopup(popupHtml, { className: 'corridor-leaflet-popup' });

    });

    // Render task overlays on initial map setup
    renderTaskOverlays(currentTasksRef.current);

    // Group station endpoints to detect multi-line junctions (e.g., AVP, Raipur) and render light-themed markers
    interface StationPointData {
      coords: [number, number];
      startTracks: MapCorridorTrack[];
      endTracks: MapCorridorTrack[];
      viaTracks: MapCorridorTrack[];
    }

    const stationPointsMap = new Map<string, StationPointData>();

    tracks.forEach((track) => {
      const startPt = track.route[0];
      const endPt = track.route[track.route.length - 1];

      if (startPt) {
        const k = `${startPt[0].toFixed(4)},${startPt[1].toFixed(4)}`;
        if (!stationPointsMap.has(k)) {
          stationPointsMap.set(k, { coords: startPt, startTracks: [], endTracks: [], viaTracks: [] });
        }
        stationPointsMap.get(k)!.startTracks.push(track);
      }

      if (endPt) {
        const k = `${endPt[0].toFixed(4)},${endPt[1].toFixed(4)}`;
        if (!stationPointsMap.has(k)) {
          stationPointsMap.set(k, { coords: endPt, startTracks: [], endTracks: [], viaTracks: [] });
        }
        stationPointsMap.get(k)!.endTracks.push(track);
      }
    });

    // Detect through-corridors passing directly through station coordinates (e.g. BSP-DURG line at Raipur Jn)
    tracks.forEach((track) => {
      if (track.route.length > 2) {
        for (let i = 1; i < track.route.length - 1; i++) {
          const pt = track.route[i];
          const k = `${pt[0].toFixed(4)},${pt[1].toFixed(4)}`;
          if (stationPointsMap.has(k)) {
            const sp = stationPointsMap.get(k)!;
            const alreadyPresent = [...sp.startTracks, ...sp.endTracks, ...sp.viaTracks].some(
              (t) => t.id === track.id
            );
            if (!alreadyPresent) {
              sp.viaTracks.push(track);
            }
          }
        }
      }
    });

    stationPointsMap.forEach((sp) => {
      const allTracksAtPt = [...sp.startTracks, ...sp.endTracks, ...sp.viaTracks];
      // Only the primary multi-line convergence junction where 3+ lines meet (Raipur Junction) qualifies for red + glow styling
      const isCentralJunction = allTracksAtPt.length >= 3;

      if (isCentralJunction) {
        // Raipur Central Junction Marker: Red fill with subtle matching red glow effect and crisp white border
        const marker = L.marker(sp.coords, {
          icon: createJunctionStationIcon()
        }).addTo(map);

        const stationName =
          sp.startTracks[0]?.startStation || sp.endTracks[0]?.endStation || 'Raipur';
        const trackCodes = allTracksAtPt.map((t) => t.code).join(' · ');

        const junctionTooltipHtml = `
          <div class="corridor-chip-content" style="border-left-color: #EF4444;">
            <div class="corridor-chip-name">${stationName.split(' ')[0]} Junction</div>
            <div class="corridor-chip-code" style="color: #EF4444;">
              ${trackCodes}
            </div>
          </div>
        `;

        marker.bindTooltip(junctionTooltipHtml, {
          permanent: true,
          direction: 'top',
          offset: [0, -14],
          className: 'corridor-leaflet-chip'
        });

        // Toggle state controls permanent chip visibility
        if (!showTrackLabelsRef.current) {
          marker.closeTooltip();
        }

        // Hover opens tooltip when permanent toggle is off
        marker.on('mouseover', () => {
          if (!showTrackLabelsRef.current) {
            marker.openTooltip();
          }
        });
        marker.on('mouseout', () => {
          if (!showTrackLabelsRef.current) {
            marker.closeTooltip();
          }
        });

        startMarkersRef.current.push(marker);
      } else if (sp.startTracks.length > 0) {
        // Origin marker (e.g. Bilaspur start, Durg start, Abhanpur start for AVP-RIM line)
        // Colored matching its track line (e.g. Pink for AVP-RIM) with white outline
        const track = sp.startTracks[0];
        const marker = L.marker(sp.coords, {
          icon: createStationOriginIcon(track.color)
        }).addTo(map);

        const tooltipHtml = `
          <div class="corridor-chip-content" style="border-left-color: ${track.color};">
            <div class="corridor-chip-name">${track.name}</div>
            <div class="corridor-chip-code" style="color: ${track.color};">
              ${track.code} (${track.startStation.split(' ')[0]})
            </div>
          </div>
        `;

        marker.bindTooltip(tooltipHtml, {
          permanent: true,
          direction: 'top',
          offset: [0, -14],
          className: 'corridor-leaflet-chip'
        });

        if (!showTrackLabelsRef.current) {
          marker.closeTooltip();
        }

        marker.on('mouseover', () => {
          if (!showTrackLabelsRef.current) {
            marker.openTooltip();
          }
        });
        marker.on('mouseout', () => {
          if (!showTrackLabelsRef.current) {
            marker.closeTooltip();
          }
        });

        startMarkersRef.current.push(marker);
      } else if (sp.endTracks.length > 0) {
        // Endpoint marker (e.g. Mandir Hasaud, Lakholi, Rajim, Bilaspur end, Durg end)
        // Colored matching its track line (e.g. Orange for R-MNDH, Green for R-LAE, Pink for AVP-RIM) with subtle white outline
        const track = sp.endTracks[0];
        const marker = L.marker(sp.coords, {
          icon: createStationEndpointIcon(track.color)
        }).addTo(map);

        marker.bindTooltip(
          `
          <span class="font-mono text-[9px] font-semibold text-slate-700 dark:text-slate-300">
            ${track.endStation}
          </span>
        `,
          {
            direction: 'bottom',
            offset: [0, 8],
            className: 'corridor-endpoint-chip'
          }
        );
      }
    });

    // Auto-fit map bounds so all 6 corridors are fully visible
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, {
        padding: [42, 42],
        maxZoom: 11
      });
    }

    // Cleanup on unmount
    return () => {
      startMarkersRef.current = [];
      taskOverlayLayersRef.current = [];
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
        tileLayerRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [tracks]);

  return (
    <section
      className={`glass-panel overflow-hidden rounded-2xl border border-railway-border/80 transition-colors shadow-md corridor-map-theme-${theme} theme-${theme}`}
      data-theme={theme}
    >
      {/* Header bar matching the rest of the application */}
      <div className="flex items-center justify-between border-b border-railway-border/70 px-4 py-3 transition-colors">
        <div>
          <h2 className="text-sm font-bold text-railway-text">
            Corridor Map
          </h2>
          <p className="text-[11px] text-railway-muted">
            Schematic operational network (Geographic GIS track vectors)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {showTaskStatus && (
            <span className="flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> {currentTasks.length} TASK OVERLAY{currentTasks.length === 1 ? '' : 'S'}
            </span>
          )}
          <span className="rounded-full border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-[10px] font-mono font-bold text-slate-300">
            {tracks.length} CORRIDORS
          </span>
        </div>
      </div>

      {/* Map viewport container */}
      <div
        className={`relative h-[380px] w-full overflow-hidden transition-colors ${
          !showTrackLabels ? 'corridor-track-labels-hidden' : ''
        } ${theme === 'dark' ? 'bg-railway-bg' : 'bg-slate-100'}`}
      >
        {/* Loading Overlay when Date Data is refreshing */}
        {isLoading && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-slate-950/65 backdrop-blur-xs transition-all">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-railway-card/95 border border-railway-border shadow-2xl">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Updating Corridor GIS Vectors...</span>
                <span className="text-[10px] text-slate-400 font-mono">Loading data for {selectedDateText || 'selected date'}</span>
              </div>
            </div>
          </div>
        )}
        <div
          ref={mapContainerRef}
          className="h-full w-full"
          style={{ background: theme === 'dark' ? '#0b1120' : 'var(--bg-secondary)' }}
        />

        {/* Floating Toggle Controls in Top-Right Corner */}
        <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2 items-end">
          {/* 1. Show Track Labels Toggle */}
          <label
            className="flex items-center gap-2 rounded-xl border border-railway-border bg-railway-card/95 px-3 py-1.5 text-xs font-medium text-railway-text backdrop-blur-md shadow-md transition cursor-pointer select-none hover:border-cyan-500/50"
            title="Toggle track name popups on map"
          >
            <input
              type="checkbox"
              id="show-track-labels-toggle"
              checked={showTrackLabels}
              onChange={(e) => setShowTrackLabels(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-railway-border accent-cyan-600 cursor-pointer"
            />
            <span className="text-[11px] font-semibold text-railway-text">Show Track Labels</span>
          </label>

          {/* 2. Show Task Status Toggle (Directly below Show Track Labels) */}
          <label
            className="flex items-center gap-2 rounded-xl border border-railway-border bg-railway-card/95 px-3 py-1.5 text-xs font-medium text-railway-text backdrop-blur-md shadow-md transition cursor-pointer select-none hover:border-rose-500/50"
            title="Toggle partial track task overlays"
          >
            <input
              type="checkbox"
              id="show-task-status-toggle"
              checked={showTaskStatus}
              onChange={(e) => setShowTaskStatus(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-railway-border accent-red-600 cursor-pointer"
            />
            <span className="text-[11px] font-semibold text-railway-text">Show Task Status</span>
          </label>
        </div>

        {/* Floating map legend overlay in bottom-left corner */}
        <div
          className="pointer-events-none absolute bottom-3 left-3 z-[400] flex flex-wrap items-center gap-2 rounded-xl border border-railway-border bg-railway-card/95 px-3 py-2 text-[10px] text-railway-text backdrop-blur-md shadow-md transition-colors"
        >
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-railway-muted">
            Network Key:
          </span>
          {tracks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-1.5 font-medium text-railway-text"
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
              <span>{t.code}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 font-medium text-railway-text border-l border-railway-border/60 pl-2">
            <span
              className="h-2 w-2 rounded-full shrink-0 bg-red-500 border border-white"
              style={{ boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)' }}
            />
            <span className="font-semibold text-red-600 dark:text-red-400">Junction</span>
          </div>

          {/* Ongoing Task Legend Entry (Solid Red) */}
          <div className="flex items-center gap-1.5 font-medium text-railway-text border-l border-railway-border/60 pl-2">
            <span
              className="h-2 w-4 rounded-full bg-red-500 border border-white/30 shadow-[0_0_6px_rgba(239,68,68,0.8)]"
            />
            <span className="font-semibold text-red-500">Ongoing Task</span>
          </div>

          {/* Pending Task Legend Entry (Dashed Yellow) */}
          <div className="flex items-center gap-1.5 font-medium text-railway-text border-l border-railway-border/60 pl-2">
            <span
              className="h-2 w-4 rounded-full border-t-2 border-dashed border-yellow-400 opacity-90 shadow-[0_0_6px_rgba(234,179,8,0.6)]"
            />
            <span className="font-semibold text-yellow-500 dark:text-yellow-400">Pending Task</span>
          </div>
        </div>
      </div>

      {/* Scoped CSS styling for Leaflet elements */}
      <style>{`
        /* When showTrackLabels is false, hide track name chips cleanly */
        .corridor-track-labels-hidden .corridor-leaflet-chip {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        /* Remove default white speech bubble and arrow, eliminate harsh shadows */
        .corridor-leaflet-chip.leaflet-tooltip,
        .leaflet-tooltip.corridor-leaflet-chip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          filter: none !important;
          -webkit-filter: none !important;
          padding: 0 !important;
        }

        .corridor-leaflet-chip.leaflet-tooltip::before,
        .leaflet-tooltip.corridor-leaflet-chip::before {
          display: none !important;
        }

        /* Base chip content - soft subtle card/tooltip box-shadow */
        .corridor-chip-content {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-left: 3.5px solid;
          border-radius: 6px;
          padding: 4px 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 1.5px;
        }

        /* Station & Junction marker node hover transition */
        .custom-station-node div,
        .custom-endpoint-node div,
        .custom-junction-node div {
          cursor: pointer;
          transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease;
        }

        .custom-station-node:hover div,
        .custom-endpoint-node:hover div {
          transform: scale(1.35);
        }

        .custom-junction-node:hover div {
          transform: scale(1.35);
          box-shadow: 0 0 0 3.5px rgba(239, 68, 68, 0.35), 0 0 14px rgba(239, 68, 68, 0.85), 0 1px 5px rgba(0, 0, 0, 0.3);
        }

        /* ================= DARK THEME LEAFLET STYLES ================= */
        .corridor-map-theme-dark .corridor-chip-content,
        .theme-dark .corridor-chip-content,
        [data-theme="dark"] .corridor-chip-content {
          background: #0b1329 !important;
          border: 1px solid rgba(51, 65, 85, 0.7) !important;
          border-left: 3.5px solid !important;
          border-radius: 6px;
          padding: 4px 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 1.5px;
        }

        .corridor-map-theme-dark .corridor-chip-name,
        .theme-dark .corridor-chip-name,
        [data-theme="dark"] .corridor-chip-name {
          color: #f8fafc !important;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
          letter-spacing: -0.01em;
        }

        .corridor-map-theme-dark .corridor-chip-code,
        .theme-dark .corridor-chip-code,
        [data-theme="dark"] .corridor-chip-code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9.5px;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
        }

        .corridor-map-theme-dark .corridor-endpoint-chip.leaflet-tooltip,
        .theme-dark .corridor-endpoint-chip.leaflet-tooltip,
        [data-theme="dark"] .corridor-endpoint-chip.leaflet-tooltip {
          background: rgba(11, 19, 41, 0.9) !important;
          border: 1px solid rgba(71, 85, 105, 0.5) !important;
          color: #cbd5e1 !important;
          border-radius: 4px;
          padding: 2px 5px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
        }

        .corridor-map-theme-dark .corridor-endpoint-chip.leaflet-tooltip::before,
        .theme-dark .corridor-endpoint-chip.leaflet-tooltip::before,
        [data-theme="dark"] .corridor-endpoint-chip.leaflet-tooltip::before {
          border-bottom-color: rgba(11, 19, 41, 0.9) !important;
          border-top-color: rgba(11, 19, 41, 0.9) !important;
        }

        .corridor-map-theme-dark .corridor-endpoint-chip.leaflet-tooltip .text-slate-300,
        .theme-dark .corridor-endpoint-chip.leaflet-tooltip .text-slate-300,
        [data-theme="dark"] .corridor-endpoint-chip.leaflet-tooltip .text-slate-300 {
          color: #cbd5e1 !important;
        }

        .corridor-map-theme-dark .corridor-leaflet-popup .leaflet-popup-content-wrapper,
        .theme-dark .corridor-leaflet-popup .leaflet-popup-content-wrapper,
        [data-theme="dark"] .corridor-leaflet-popup .leaflet-popup-content-wrapper {
          background: #0b1329 !important;
          border: 1px solid #2d4a7d !important;
          color: #e2e8f0 !important;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.75);
        }

        .corridor-map-theme-dark .corridor-leaflet-popup .leaflet-popup-tip,
        .theme-dark .corridor-leaflet-popup .leaflet-popup-tip,
        [data-theme="dark"] .corridor-leaflet-popup .leaflet-popup-tip {
          background: #0b1329 !important;
          border: 1px solid #2d4a7d !important;
        }

        .corridor-map-theme-dark .corridor-leaflet-popup .leaflet-popup-close-button,
        .theme-dark .corridor-leaflet-popup .leaflet-popup-close-button,
        [data-theme="dark"] .corridor-leaflet-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
        }

        .corridor-map-theme-dark .corridor-leaflet-popup .leaflet-popup-close-button:hover,
        .theme-dark .corridor-leaflet-popup .leaflet-popup-close-button:hover,
        [data-theme="dark"] .corridor-leaflet-popup .leaflet-popup-close-button:hover {
          color: #f8fafc !important;
        }

        .corridor-map-theme-dark .corridor-leaflet-popup h4,
        .theme-dark .corridor-leaflet-popup h4,
        [data-theme="dark"] .corridor-leaflet-popup h4 {
          color: #f8fafc !important;
        }

        .corridor-map-theme-dark .corridor-leaflet-popup .border-slate-700,
        .theme-dark .corridor-leaflet-popup .border-slate-700,
        [data-theme="dark"] .corridor-leaflet-popup .border-slate-700 {
          border-color: #334155 !important;
        }

        .corridor-map-theme-dark .corridor-leaflet-popup .text-slate-300,
        .theme-dark .corridor-leaflet-popup .text-slate-300,
        [data-theme="dark"] .corridor-leaflet-popup .text-slate-300 {
          color: #cbd5e1 !important;
        }

        .corridor-map-theme-dark .corridor-leaflet-popup .text-slate-400,
        .theme-dark .corridor-leaflet-popup .text-slate-400,
        [data-theme="dark"] .corridor-leaflet-popup .text-slate-400 {
          color: #94a3b8 !important;
        }

        .corridor-map-theme-dark .leaflet-control-zoom a,
        .theme-dark .leaflet-control-zoom a,
        [data-theme="dark"] .leaflet-control-zoom a {
          background: #0b1329 !important;
          border-color: #2d4a7d !important;
          color: #cbd5e1 !important;
        }

        .corridor-map-theme-dark .leaflet-control-zoom a:hover,
        .theme-dark .leaflet-control-zoom a:hover,
        [data-theme="dark"] .leaflet-control-zoom a:hover {
          background: #1e293b !important;
          color: #ffffff !important;
        }

        .corridor-map-theme-dark .leaflet-control-attribution,
        .theme-dark .leaflet-control-attribution,
        [data-theme="dark"] .leaflet-control-attribution {
          background: rgba(11, 19, 41, 0.85) !important;
          color: #64748b !important;
          font-size: 9px !important;
        }

        .corridor-map-theme-dark .leaflet-control-attribution a,
        .theme-dark .leaflet-control-attribution a,
        [data-theme="dark"] .leaflet-control-attribution a {
          color: #38bdf8 !important;
        }

        /* ================= LIGHT THEME LEAFLET STYLES ================= */
        .corridor-map-theme-light .corridor-chip-content,
        .theme-light .corridor-chip-content,
        [data-theme="light"] .corridor-chip-content {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          border-left: 3.5px solid !important;
          border-radius: 6px;
          padding: 4px 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 1.5px;
        }

        .corridor-map-theme-light .corridor-chip-name,
        .theme-light .corridor-chip-name,
        [data-theme="light"] .corridor-chip-name {
          color: #0f172b !important;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.2;
          white-space: nowrap;
          letter-spacing: -0.01em;
        }

        .corridor-map-theme-light .corridor-chip-code,
        .theme-light .corridor-chip-code,
        [data-theme="light"] .corridor-chip-code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9.5px;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
        }

        .corridor-map-theme-light .corridor-endpoint-chip.leaflet-tooltip,
        .theme-light .corridor-endpoint-chip.leaflet-tooltip,
        [data-theme="light"] .corridor-endpoint-chip.leaflet-tooltip {
          background: rgba(255, 255, 255, 0.95) !important;
          border: 1px solid #cbd5e1 !important;
          color: #1e293b !important;
          border-radius: 4px;
          padding: 2px 5px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
        }

        .corridor-map-theme-light .corridor-endpoint-chip.leaflet-tooltip::before,
        .theme-light .corridor-endpoint-chip.leaflet-tooltip::before,
        [data-theme="light"] .corridor-endpoint-chip.leaflet-tooltip::before {
          border-bottom-color: #cbd5e1 !important;
          border-top-color: #cbd5e1 !important;
        }

        .corridor-map-theme-light .corridor-endpoint-chip.leaflet-tooltip .text-slate-300,
        .theme-light .corridor-endpoint-chip.leaflet-tooltip .text-slate-300,
        [data-theme="light"] .corridor-endpoint-chip.leaflet-tooltip .text-slate-300 {
          color: #1e293b !important;
        }

        .corridor-map-theme-light .corridor-leaflet-popup .leaflet-popup-content-wrapper,
        .theme-light .corridor-leaflet-popup .leaflet-popup-content-wrapper,
        [data-theme="light"] .corridor-leaflet-popup .leaflet-popup-content-wrapper {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172b !important;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08) !important;
        }

        .corridor-map-theme-light .corridor-leaflet-popup .leaflet-popup-tip,
        .theme-light .corridor-leaflet-popup .leaflet-popup-tip,
        [data-theme="light"] .corridor-leaflet-popup .leaflet-popup-tip {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
        }

        .corridor-map-theme-light .corridor-leaflet-popup .leaflet-popup-close-button,
        .theme-light .corridor-leaflet-popup .leaflet-popup-close-button,
        [data-theme="light"] .corridor-leaflet-popup .leaflet-popup-close-button {
          color: #64748b !important;
        }

        .corridor-map-theme-light .corridor-leaflet-popup .leaflet-popup-close-button:hover,
        .theme-light .corridor-leaflet-popup .leaflet-popup-close-button:hover,
        [data-theme="light"] .corridor-leaflet-popup .leaflet-popup-close-button:hover {
          color: #0f172a !important;
        }

        .corridor-map-theme-light .corridor-leaflet-popup h4,
        .theme-light .corridor-leaflet-popup h4,
        [data-theme="light"] .corridor-leaflet-popup h4 {
          color: #0f172a !important;
        }

        .corridor-map-theme-light .corridor-leaflet-popup .border-slate-700,
        .theme-light .corridor-leaflet-popup .border-slate-700,
        [data-theme="light"] .corridor-leaflet-popup .border-slate-700 {
          border-color: #e2e8f0 !important;
        }

        .corridor-map-theme-light .corridor-leaflet-popup .text-slate-300,
        .theme-light .corridor-leaflet-popup .text-slate-300,
        [data-theme="light"] .corridor-leaflet-popup .text-slate-300 {
          color: #334155 !important;
        }

        .corridor-map-theme-light .corridor-leaflet-popup .text-slate-400,
        .theme-light .corridor-leaflet-popup .text-slate-400,
        [data-theme="light"] .corridor-leaflet-popup .text-slate-400 {
          color: #64748b !important;
        }

        .corridor-map-theme-light .leaflet-control-zoom a,
        .theme-light .leaflet-control-zoom a,
        [data-theme="light"] .leaflet-control-zoom a {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #334155 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }

        .corridor-map-theme-light .leaflet-control-zoom a:hover,
        .theme-light .leaflet-control-zoom a:hover,
        [data-theme="light"] .leaflet-control-zoom a:hover {
          background: #f1f5f9 !important;
          color: #0f172a !important;
        }

        .corridor-map-theme-light .leaflet-control-attribution,
        .theme-light .leaflet-control-attribution,
        [data-theme="light"] .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.85) !important;
          color: #64748b !important;
          font-size: 9px !important;
        }

        .corridor-map-theme-light .leaflet-control-attribution a,
        .theme-light .leaflet-control-attribution a,
        [data-theme="light"] .leaflet-control-attribution a {
          color: #0284c7 !important;
        }

        /* ================= PARTIAL TASK OVERLAYS ================= */
        .leaflet-pane.leaflet-floatingTasksPane-pane,
        .leaflet-pane[style*="z-index: 450"] {
          z-index: 450 !important;
        }

        /* 1. ONGOING TASK: Solid Red Partial Polyline */
        .rail-task-partial-ongoing {
          stroke: #EF4444 !important;
          filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.75)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6)) !important;
          cursor: pointer !important;
          transition: stroke-width 0.18s ease, filter 0.18s ease;
        }

        .rail-task-partial-ongoing:hover {
          stroke-width: 8px !important;
          filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.95)) drop-shadow(0 3px 6px rgba(0, 0, 0, 0.8)) !important;
        }

        /* 2. PENDING TASK: Dashed Yellow Partial Polyline */
        .rail-task-partial-pending {
          stroke: #EAB308 !important;
          filter: drop-shadow(0 0 5px rgba(234, 179, 8, 0.75)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6)) !important;
          cursor: pointer !important;
          transition: stroke-width 0.18s ease, filter 0.18s ease;
        }

        .rail-task-partial-pending:hover {
          stroke-width: 8px !important;
          filter: drop-shadow(0 0 12px rgba(234, 179, 8, 0.95)) drop-shadow(0 3px 6px rgba(0, 0, 0, 0.8)) !important;
        }
      `}</style>
    </section>
  );
};

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarRange,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ChevronDown,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { can } from '../../utils/permissions';
import { Corridor, Department, GanttBlock } from '../../types';
import { SimulatedBadge } from '../common/Badge';
import { INITIAL_CORRIDORS, INITIAL_GANTT_BLOCKS } from '../../data/mockData';
import { CorridorLeafletMap, CorridorTaskOverlay } from './CorridorLeafletMap';

// Corridor theme colors matching Leaflet map polylines & chips 1:1
const corridorColorMap: Record<string, string> = {
  'COR-01': '#3B82F6', // Blue
  'BSP-DURG-UP': '#3B82F6',
  'COR-02': '#06B6D4', // Cyan
  'BSP-DURG-DN': '#06B6D4',
  'COR-03': '#22C55E', // Green
  'R-MNDH': '#22C55E',  // Green alias
  'COR-04': '#EAB308', // Yellow
  'R-LAE': '#EAB308',   // Yellow alias
  'COR-05': '#A855F7', // Purple
  'R-AVP': '#A855F7',
  'COR-06': '#EC4899', // Pink
  'AVP-RIM': '#EC4899'
};

const departmentSegmentClass: Record<Department, string> = {
  Engineering: 'bg-rose-600/90 border-rose-300/70',
  Traction: 'bg-emerald-600/90 border-emerald-300/70',
  'Signal & Telecom': 'bg-blue-600/90 border-blue-300/70',
  'Cross-Department': 'bg-violet-600/90 border-violet-300/70'
};

const departmentLabel: Record<Department, string> = {
  Engineering: 'Engineering (Civil/Track)',
  Traction: 'Traction (OHE/TRD)',
  'Signal & Telecom': 'Signal & Telecom (S&T)',
  'Cross-Department': 'Integrated Multi-Dept'
};

const formatHour = (hour: number) => `${Math.floor(hour).toString().padStart(2, '0')}:00`;

// Reference default date: 07 Sep 2026
const TODAY_ISO = '2026-09-07';

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }); // e.g. "07 Sep 2026"
}

function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface DateSpecificData {
  tasks: CorridorTaskOverlay[];
  ganttBlocks: GanttBlock[];
  stats: {
    pendingCount: number;
    highRiskCount: number;
    approvedTodayCount: number;
    corridorUtilization: number;
  };
}

function getDateHash(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getScheduleForDate(date: Date, defaultBlocks: GanttBlock[]): DateSpecificData {
  const iso = formatIsoDate(date);

  // Default Today (07 Sep 2026) reflects primary verified operations
  if (iso === TODAY_ISO) {
    return {
      tasks: [
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
          windowText: '14:00 - 18:00 IST',
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
          windowText: '22:30 - 02:30 IST',
          statusText: 'Scheduled'
        }
      ],
      ganttBlocks: defaultBlocks && defaultBlocks.length > 0 ? defaultBlocks : INITIAL_GANTT_BLOCKS,
      stats: {
        pendingCount: 8,
        highRiskCount: 2,
        approvedTodayCount: 14,
        corridorUtilization: 84.2
      }
    };
  }

  // Deterministic generator for all other days
  const hash = getDateHash(iso);
  const variant = hash % 4;

  const pendingCount = 4 + (hash % 8);
  const highRiskCount = hash % 4;
  const approvedTodayCount = 9 + (hash % 10);
  const corridorUtilization = Number((74 + (hash % 18) + (hash % 7) * 0.1).toFixed(1));

  let tasks: CorridorTaskOverlay[] = [];
  let dayBlocks: GanttBlock[] = [];

  if (variant === 0) {
    tasks = [
      {
        id: `TSK-${iso}-1`,
        type: 'ongoing',
        corridorId: 'COR-02',
        corridorCode: 'BSP-DURG-DN',
        title: 'Civil: USFD Flaw Rectification & Tamping',
        category: 'Civil',
        categoryLabel: '🛠️ Civil / Track',
        startRatio: 0.32,
        endRatio: 0.65,
        kmText: 'KM 72.0 – 110.5',
        windowText: '11:00 - 15:30 IST',
        statusText: 'Active'
      },
      {
        id: `TSK-${iso}-2`,
        type: 'pending',
        corridorId: 'COR-04',
        corridorCode: 'R-LAE',
        title: 'Signal: Dual Axle Counter Overhaul',
        category: 'Signal',
        categoryLabel: '📶 Signal & Telecom',
        startRatio: 0.22,
        endRatio: 0.78,
        kmText: 'KM 8.0 – 24.0',
        windowText: '19:00 - 23:00 IST',
        statusText: 'Scheduled'
      }
    ];
    dayBlocks = [
      {
        id: `BLK-${iso}-01`,
        requestId: `REQ-${iso}-01`,
        title: 'Civil: USFD Flaw Rectification & Tamping',
        department: 'Engineering',
        startHour: 11.0,
        endHour: 15.5,
        trackKm: 'KM 72.0 - 110.5',
        corridorId: 'COR-02',
        hasConflict: false,
        status: 'In-Progress',
        oheCut: false,
        speedRestriction: '30 km/h',
        isSimulated: true
      },
      {
        id: `BLK-${iso}-02`,
        requestId: `REQ-${iso}-02`,
        title: 'Signal: Dual Axle Counter Overhaul',
        department: 'Signal & Telecom',
        startHour: 19.0,
        endHour: 23.0,
        trackKm: 'KM 8.0 - 24.0',
        corridorId: 'COR-04',
        hasConflict: false,
        status: 'Approved',
        oheCut: false,
        speedRestriction: 'Caution 45 km/h',
        isSimulated: true
      }
    ];
  } else if (variant === 1) {
    tasks = [
      {
        id: `TSK-${iso}-1`,
        type: 'ongoing',
        corridorId: 'COR-05',
        corridorCode: 'R-AVP',
        title: 'Traction: Substation Feeder Wire Overhaul',
        category: 'OHE',
        categoryLabel: '⚡ OHE Maintenance',
        startRatio: 0.25,
        endRatio: 0.72,
        kmText: 'KM 12.0 – 28.5',
        windowText: '09:30 - 14:00 IST',
        statusText: 'Active'
      },
      {
        id: `TSK-${iso}-2`,
        type: 'pending',
        corridorId: 'COR-01',
        corridorCode: 'BSP-DURG-UP',
        title: 'Civil: Flash Butt Weld Insertion (KM 142)',
        category: 'Civil',
        categoryLabel: '🛠️ Civil / Track',
        startRatio: 0.18,
        endRatio: 0.48,
        kmText: 'KM 40.0 – 75.0',
        windowText: '21:00 - 01:30 IST',
        statusText: 'Scheduled'
      }
    ];
    dayBlocks = [
      {
        id: `BLK-${iso}-04`,
        requestId: `REQ-${iso}-04`,
        title: 'Traction: Substation Feeder Wire Overhaul',
        department: 'Traction',
        startHour: 9.5,
        endHour: 14.0,
        trackKm: 'KM 12.0 - 28.5',
        corridorId: 'COR-05',
        hasConflict: false,
        status: 'In-Progress',
        oheCut: true,
        speedRestriction: 'Coasting',
        isSimulated: true
      },
      {
        id: `BLK-${iso}-05`,
        requestId: `REQ-${iso}-05`,
        title: 'Civil: Flash Butt Weld Insertion',
        department: 'Engineering',
        startHour: 21.0,
        endHour: 25.5,
        trackKm: 'KM 40.0 - 75.0',
        corridorId: 'COR-01',
        hasConflict: false,
        status: 'Approved',
        oheCut: false,
        speedRestriction: '20 km/h',
        isSimulated: true
      }
    ];
  } else if (variant === 2) {
    tasks = [
      {
        id: `TSK-${iso}-1`,
        type: 'ongoing',
        corridorId: 'COR-06',
        corridorCode: 'AVP-RIM',
        title: 'Civil: Switch Tie Renewal & Alignment',
        category: 'Civil',
        categoryLabel: '🛠️ Civil / Track',
        startRatio: 0.30,
        endRatio: 0.70,
        kmText: 'KM 5.0 – 14.0',
        windowText: '13:00 - 17:30 IST',
        statusText: 'Active'
      },
      {
        id: `TSK-${iso}-2`,
        type: 'pending',
        corridorId: 'COR-02',
        corridorCode: 'BSP-DURG-DN',
        title: 'OHE: Dropper Tensioning & Neutral Section',
        category: 'OHE',
        categoryLabel: '⚡ OHE Maintenance',
        startRatio: 0.38,
        endRatio: 0.72,
        kmText: 'KM 80.0 – 122.0',
        windowText: '23:00 - 03:00 IST',
        statusText: 'Scheduled'
      }
    ];
    dayBlocks = [
      {
        id: `BLK-${iso}-06`,
        requestId: `REQ-${iso}-06`,
        title: 'Civil: Switch Tie Renewal & Alignment',
        department: 'Engineering',
        startHour: 13.0,
        endHour: 17.5,
        trackKm: 'KM 5.0 - 14.0',
        corridorId: 'COR-06',
        hasConflict: false,
        status: 'In-Progress',
        oheCut: false,
        speedRestriction: '45 km/h',
        isSimulated: true
      },
      {
        id: `BLK-${iso}-07`,
        requestId: `REQ-${iso}-07`,
        title: 'OHE: Dropper Tensioning & Neutral Section',
        department: 'Traction',
        startHour: 23.0,
        endHour: 27.0,
        trackKm: 'KM 80.0 - 122.0',
        corridorId: 'COR-02',
        hasConflict: false,
        status: 'Approved',
        oheCut: true,
        speedRestriction: 'Isolation',
        isSimulated: true
      }
    ];
  } else {
    tasks = [
      {
        id: `TSK-${iso}-1`,
        type: 'pending',
        corridorId: 'COR-03',
        corridorCode: 'R-MNDH',
        title: 'S&T: Electronic Interlocking Diagnostic Scan',
        category: 'Signal',
        categoryLabel: '📶 Signal & Telecom',
        startRatio: 0.28,
        endRatio: 0.72,
        kmText: 'KM 7.5 – 19.5',
        windowText: '16:00 - 19:30 IST',
        statusText: 'Scheduled'
      },
      {
        id: `TSK-${iso}-2`,
        type: 'pending',
        corridorId: 'COR-04',
        corridorCode: 'R-LAE',
        title: 'Traction: Substation Circuit Breaker Testing',
        category: 'OHE',
        categoryLabel: '⚡ OHE Maintenance',
        startRatio: 0.25,
        endRatio: 0.70,
        kmText: 'KM 10.0 – 22.0',
        windowText: '22:00 - 02:00 IST',
        statusText: 'Scheduled'
      }
    ];
    dayBlocks = [
      {
        id: `BLK-${iso}-08`,
        requestId: `REQ-${iso}-08`,
        title: 'S&T: Electronic Interlocking Diagnostic Scan',
        department: 'Signal & Telecom',
        startHour: 16.0,
        endHour: 19.5,
        trackKm: 'KM 7.5 - 19.5',
        corridorId: 'COR-03',
        hasConflict: false,
        status: 'Approved',
        oheCut: false,
        speedRestriction: 'Normal',
        isSimulated: true
      },
      {
        id: `BLK-${iso}-09`,
        requestId: `REQ-${iso}-09`,
        title: 'Traction: Substation Circuit Breaker Testing',
        department: 'Traction',
        startHour: 22.0,
        endHour: 26.0,
        trackKm: 'KM 10.0 - 22.0',
        corridorId: 'COR-04',
        hasConflict: false,
        status: 'Approved',
        oheCut: true,
        speedRestriction: 'No Power',
        isSimulated: true
      }
    ];
  }

  return {
    tasks,
    ganttBlocks: dayBlocks,
    stats: {
      pendingCount,
      highRiskCount,
      approvedTodayCount,
      corridorUtilization
    }
  };
}

export const ScheduleMapView: React.FC = () => {
  const navigate = useNavigate();
  const { corridors, ganttBlocks, autoResolveConflicts, role, showToast } = useApp();
  const [selectedBlock, setSelectedBlock] = useState<GanttBlock | null>(null);
  const hours = Array.from({ length: 24 }, (_, index) => index);

  // Date selection state (default to today: 2026-09-07)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2026-09-07T00:00:00'));
  const [isLoadingDateData, setIsLoadingDateData] = useState<boolean>(false);

  const isToday = formatIsoDate(selectedDate) === TODAY_ISO;

  // Derive schedule data for currently selected date
  const dateData = useMemo(() => {
    return getScheduleForDate(selectedDate, ganttBlocks);
  }, [selectedDate, ganttBlocks]);

  // Date change handler with simulated async fetch delay
  const handleDateChange = (newDate: Date, triggerToast = true) => {
    setIsLoadingDateData(true);
    setSelectedDate(newDate);
    setTimeout(() => {
      setIsLoadingDateData(false);
      if (triggerToast) {
        showToast({
          type: 'info',
          title: 'Schedule Updated',
          message: `Corridor schedules loaded for ${formatDisplayDate(newDate)}.`
        });
      }
    }, 350);
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    handleDateChange(d, true);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    handleDateChange(d, true);
  };

  const handleResetToday = () => {
    handleDateChange(new Date('2026-09-07T00:00:00'), false);
    showToast({
      type: 'success',
      title: 'Current Operations',
      message: 'Schedule reset to Today (07 Sept 2026).'
    });
  };

  // Guarantee corridor rows exist and match the exact 1-6 top-to-bottom order
  const activeCorridors = corridors && corridors.length > 0 ? corridors : INITIAL_CORRIDORS;
  const orderedCorridors = [...activeCorridors].sort((a, b) => {
    const order = ['COR-01', 'COR-02', 'COR-03', 'COR-04', 'COR-05', 'COR-06'];
    const idxA = order.indexOf(a.id);
    const idxB = order.indexOf(b.id);
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });

  return (
    <div className="space-y-5">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-railway-orange" />
            <h1 className="text-lg font-bold tracking-tight text-white">Schedule &amp; Map</h1>
            {dateData.stats.highRiskCount > 0 ? (
              <span className="flex items-center gap-1 rounded-full border border-rose-500/50 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                <ShieldAlert className="h-3 w-3" /> {dateData.stats.highRiskCount} Conflict{dateData.stats.highRiskCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> Live
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">Corridor infrastructure and maintenance windows across the 24-hour operating day.</p>
        </div>

        {/* Top-Right Simulator Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/what-if-simulator')}
            className="px-3.5 py-1.5 rounded-xl bg-railway-surface hover:bg-slate-800 border border-railway-border text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>What-If Simulator</span>
          </button>

          {can(role, 'canOptimize') && (
            <button
              type="button"
              onClick={() => navigate('/storm-mode')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 border border-red-500/50 text-white text-xs font-bold shadow-glow-red flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>🚨 Emergency Simulator</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Selector & Day-Specific Operations Metric Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-railway-card/90 border border-railway-border/80 shadow-md backdrop-blur-md">
        {/* Left side: Day Navigation, Date Picker, and Today reset */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Operating Day:</span>

          <div className="flex items-center gap-1 rounded-xl bg-railway-surface border border-railway-border p-0.5">
            <button
              type="button"
              onClick={handlePrevDay}
              disabled={isLoadingDateData}
              className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-white transition disabled:opacity-50 cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Native date picker trigger wrapped in custom styled pill */}
            <div className="relative inline-flex items-center">
              <input
                type="date"
                value={formatIsoDate(selectedDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    handleDateChange(new Date(y, m - 1, d));
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                title="Click to pick date from calendar"
              />
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-slate-700/60 text-xs font-bold text-white transition">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-xs">{formatDisplayDate(selectedDate)}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              disabled={isLoadingDateData}
              className="p-1.5 rounded-lg hover:bg-slate-700/60 text-slate-300 hover:text-white transition disabled:opacity-50 cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetToday}
            disabled={isToday || isLoadingDateData}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isToday
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
                : 'bg-railway-surface hover:bg-slate-800 border-railway-border text-slate-300 hover:text-white'
            }`}
            title="Reset to Today (07 Sep 2026)"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Today</span>
          </button>
        </div>

        {/* Right side: Top Metric Counters reflecting selected date */}
        <div className="flex items-center gap-2.5 text-xs font-mono flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-railway-border/60">
            <span className="text-slate-400 text-[11px]">Pending:</span>
            <strong className="text-amber-400 font-bold">{dateData.stats.pendingCount}</strong>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-railway-border/60">
            <span className="text-slate-400 text-[11px]">High Risk:</span>
            <strong className="text-rose-400 font-bold">{dateData.stats.highRiskCount}</strong>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-railway-border/60">
            <span className="text-slate-400 text-[11px]">Approved:</span>
            <strong className="text-emerald-400 font-bold">{dateData.stats.approvedTodayCount}</strong>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-railway-border/60">
            <span className="text-slate-400 text-[11px]">Corridor Util:</span>
            <strong className="text-cyan-400 font-bold">{dateData.stats.corridorUtilization}%</strong>
          </div>
        </div>
      </div>

      {/* Interactive Geographic Leaflet Map with CartoDB Dark Tiles & Date-Driven Task Overlays */}
      <CorridorLeafletMap
        tasks={dateData.tasks}
        selectedDateText={formatDisplayDate(selectedDate)}
        isLoading={isLoadingDateData}
      />

      {/* Track's Task Schedules Panel */}
      <section className="glass-panel overflow-hidden rounded-2xl border border-railway-border/80">
        <div className="flex items-center justify-between border-b border-railway-border/70 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-white">Track&apos;s Task Schedules</h2>
            <p className="text-[11px] text-slate-500">
              Maintenance blocks plotted against the 24-hour operating day ({formatDisplayDate(selectedDate)})
            </p>
          </div>
          <div className="hidden items-center gap-3 text-[10px] text-slate-400 sm:flex">
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />Civil / Track</span>
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />OHE / TRD</span>
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />S&amp;T</span>
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-violet-500" />Integrated</span>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          {/* Loading Skeleton / Spinner Overlay for Schedule Panel */}
          {isLoadingDateData && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs transition-all">
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-railway-card border border-railway-border shadow-xl">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-slate-200">Loading schedule for {formatDisplayDate(selectedDate)}...</span>
              </div>
            </div>
          )}

          <div className="min-w-[900px] p-4">
            {/* Single sticky horizontal header row with 24 columns */}
            <div className="sticky top-0 z-20 grid grid-cols-[245px_1fr] border-b border-railway-border/70 bg-railway-surface/95 backdrop-blur-sm pb-2 pt-1">
              <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Corridor
              </div>
              <div
                className="grid grid-cols-24 divide-x divide-railway-border/40 text-center font-mono text-[9px] font-medium text-slate-400"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
              >
                {hours.map((hour) => (
                  <span key={hour} className="py-1">
                    {formatHour(hour)}
                  </span>
                ))}
              </div>
            </div>

            {/* Corridor rows pulling directly from corridors array, bold names & colored codes */}
            <div className="divide-y divide-railway-border/50">
              {orderedCorridors.map((corridor: Corridor) => {
                const corridorBlocks = dateData.ganttBlocks.filter((block) => block.corridorId === corridor.id);
                const fallbackInfo = INITIAL_CORRIDORS.find((c) => c.id === corridor.id);
                const corridorName = corridor.name || fallbackInfo?.name || 'Corridor Track';
                const corridorCode = corridor.code || fallbackInfo?.code || corridor.id;

                return (
                  <div key={corridor.id} className="grid grid-cols-[245px_1fr] items-center gap-0 py-3.5">
                    {/* Left Corridor Info Column: Guaranteed rendered, bold name, matching colored code & indicator */}
                    <div className="pr-4 flex items-start gap-2.5">
                      <span
                        className="mt-1 h-3.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: corridorColorMap[corridor.id] || '#38BDF8' }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-slate-100" title={corridorName}>
                          {corridorName}
                        </div>
                        <div
                          className="mt-0.5 font-mono text-[11px] font-semibold"
                          style={{ color: corridorColorMap[corridor.id] || '#38BDF8' }}
                        >
                          {corridorCode}
                        </div>
                      </div>
                    </div>

                    {/* Corridor Schedule Bar */}
                    <div className="relative h-9 rounded-lg border border-railway-border/70 bg-railway-bg/85 overflow-hidden">
                      {/* 24-Column background tick grid matching ruler */}
                      <div
                        className="absolute inset-0 grid grid-cols-24 divide-x divide-railway-border/30 pointer-events-none"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                      >
                        {hours.map((hour) => (
                          <span key={hour} className={hour >= 1 && hour <= 5 ? 'bg-cyan-950/15' : ''} />
                        ))}
                      </div>

                      {/* Segments with 1-2px physical gap, outline border, and tooltip on hover */}
                      {corridorBlocks.map((block) => {
                        const leftPercent = (block.startHour / 24) * 100;
                        const widthPercent = ((block.endHour - block.startHour) / 24) * 100;
                        const tooltipText = `${departmentLabel[block.department]} | ${block.title} (${block.startHour}:00 - ${block.endHour}:00) | Location: ${block.trackKm}`;

                        return (
                          <button
                            type="button"
                            key={block.id}
                            onClick={() => setSelectedBlock(block)}
                            title={tooltipText}
                            style={{
                              left: `calc(${leftPercent}% + 1px)`,
                              width: `calc(${widthPercent}% - 2px)`
                            }}
                            className={`absolute top-1 h-7 min-w-[12px] overflow-hidden rounded-md border border-white/25 ring-1 ring-slate-950/80 px-2 flex items-center shadow-md transition hover:z-30 hover:brightness-125 ${departmentSegmentClass[block.department]}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Block Details Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-4 overflow-hidden rounded-2xl border border-railway-border bg-railway-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-railway-border pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-cyan-500/20 p-2 text-cyan-400">
                  <CalendarRange className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-slate-400">{selectedBlock.requestId}</span>
                  <h3 className="text-sm font-bold text-white">{selectedBlock.title}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBlock(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-railway-card hover:text-white"
              >
                ✕
              </button>
            </div>
            {selectedBlock.hasConflict && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500 bg-rose-950/60 p-3 text-xs text-rose-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <div>
                  <span className="block font-bold">Conflict Details:</span>
                  <span>{selectedBlock.conflictDetails}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-railway-border bg-railway-card p-3">
                <span className="block text-[10px] text-slate-400">Department</span>
                <span className="font-semibold text-slate-200">{selectedBlock.department}</span>
              </div>
              <div className="rounded-xl border border-railway-border bg-railway-card p-3">
                <span className="block text-[10px] text-slate-400">Allocated Time</span>
                <span className="font-mono font-semibold text-cyan-300">
                  {selectedBlock.startHour}:00 – {selectedBlock.endHour}:00 hrs
                </span>
              </div>
              <div className="rounded-xl border border-railway-border bg-railway-card p-3">
                <span className="block text-[10px] text-slate-400">Location Marker</span>
                <span className="font-semibold text-slate-200">{selectedBlock.trackKm}</span>
              </div>
              <div className="rounded-xl border border-railway-border bg-railway-card p-3">
                <span className="block text-[10px] text-slate-400">OHE Traction Cut</span>
                <span className="font-semibold text-slate-200">{selectedBlock.oheCut ? 'Required (25kV)' : 'No Isolation'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-railway-border pt-2">
              <SimulatedBadge text="Corridor Gantt Node" />
              <div className="flex items-center gap-2">
                {selectedBlock.hasConflict && (
                  <button
                    type="button"
                    onClick={() => {
                      autoResolveConflicts();
                      setSelectedBlock(null);
                    }}
                    className="rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    Auto-Resolve This Conflict
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedBlock(null)}
                  className="rounded-xl bg-railway-card px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

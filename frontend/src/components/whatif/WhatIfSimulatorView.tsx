import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { GanttBlock, TrainSchedule, Corridor } from '../../types';
import { 
  Sliders, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  CalendarRange, 
  Train, 
  ArrowLeft, 
  RotateCcw, 
  Check, 
  ArrowRight,
  ShieldAlert,
  Zap
} from 'lucide-react';

interface WhatIfSimulatorViewProps {
  standalone?: boolean;
}

export const WhatIfSimulatorView: React.FC<WhatIfSimulatorViewProps> = ({ standalone = false }) => {
  const navigate = useNavigate();
  const { 
    ganttBlocks, 
    trainSchedules, 
    corridors, 
    modifyRequestSlot, 
    setGanttBlocks, 
    setActiveView,
    showToast
  } = useApp();

  const handleBackToSchedule = () => {
    setActiveView('gantt');
    navigate('/schedule-and-map');
  };

  // State: Selected Gantt Block
  const [selectedBlockId, setSelectedBlockId] = useState<string>(() => {
    // Default to the first block with conflict if present, or first block
    const conflictBlock = ganttBlocks.find((b) => b.hasConflict);
    return conflictBlock ? conflictBlock.id : (ganttBlocks[0]?.id || 'BLK-01');
  });

  // State: Shift by (in hours, e.g. -4.0 to +4.0 in 0.5h increments)
  const [shiftHours, setShiftHours] = useState<number>(0);

  // Success message after applying
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // Selected block details
  const selectedBlock = useMemo(() => {
    return ganttBlocks.find((b) => b.id === selectedBlockId) || ganttBlocks[0];
  }, [ganttBlocks, selectedBlockId]);

  // Corridor for selected block
  const blockCorridor = useMemo(() => {
    if (!selectedBlock) return corridors[0];
    return corridors.find((c) => c.id === selectedBlock.corridorId) || corridors[0];
  }, [corridors, selectedBlock]);

  // Calculate new start and end hours
  const originalStart = selectedBlock?.startHour ?? 2.0;
  const originalEnd = selectedBlock?.endHour ?? 5.0;
  const blockDuration = originalEnd - originalStart;

  // New clamped hours (bounded between 0 and 24)
  const newStartHour = Math.max(0, Math.min(24 - blockDuration, Math.round((originalStart + shiftHours) * 10) / 10));
  const newEndHour = Math.round((newStartHour + blockDuration) * 10) / 10;

  // Format hour number to "HH:MM"
  const formatHour = (h: number) => {
    const hours = Math.floor(h);
    const minutes = Math.round((h - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Trains on the selected corridor
  const corridorTrains = useMemo(() => {
    if (!selectedBlock) return [];
    return trainSchedules.filter((t) => t.corridorId === selectedBlock.corridorId);
  }, [trainSchedules, selectedBlock]);

  // Detect conflicts in original slot vs new shifted slot
  const originalConflicts = useMemo(() => {
    return corridorTrains.filter((train) => {
      // Check interval overlap: startA < endB && endA > startB
      return train.startHour < originalEnd && train.endHour > originalStart;
    });
  }, [corridorTrains, originalStart, originalEnd]);

  const simulatedConflicts = useMemo(() => {
    return corridorTrains.filter((train) => {
      return train.startHour < newEndHour && train.endHour > newStartHour;
    });
  }, [corridorTrains, newStartHour, newEndHour]);

  // AI Auto-Find Optimal Slot
  const handleAutoFindSlot = () => {
    // Search for a gap between 0:00 and 24:00 with zero train overlaps
    const step = 0.5;
    let bestSlot = 0;
    let minConflictTrains = 999;

    for (let testShift = -originalStart; testShift <= 24 - originalEnd; testShift += step) {
      const testStart = originalStart + testShift;
      const testEnd = testStart + blockDuration;
      
      const overlapping = corridorTrains.filter(
        (t) => t.startHour < testEnd && t.endHour > testStart
      ).length;

      if (overlapping < minConflictTrains) {
        minConflictTrains = overlapping;
        bestSlot = testShift;
        if (overlapping === 0) break; // Found perfect zero-conflict slot!
      }
    }

    setShiftHours(Math.round(bestSlot * 10) / 10);
    setAppliedSuccess(false);
  };

  // Commit Shift to App State
  const handleApplyShift = () => {
    if (!selectedBlock) return;

    // Use modifyRequestSlot if requestId exists
    if (selectedBlock.requestId) {
      modifyRequestSlot(selectedBlock.requestId, newStartHour, newEndHour);
    } else {
      setGanttBlocks((prev) =>
        prev.map((b) =>
          b.id === selectedBlock.id
            ? {
                ...b,
                startHour: newStartHour,
                endHour: newEndHour,
                hasConflict: simulatedConflicts.length > 0,
                conflictDetails:
                  simulatedConflicts.length > 0
                    ? `⚠️ Overlaps with ${simulatedConflicts.map((t) => '#' + t.trainNo).join(', ')}`
                    : undefined
              }
            : b
        )
      );
    }

    setAppliedSuccess(true);
    showToast({
      type: 'success',
      title: 'Simulation Plan Applied',
      message: 'New schedule slots successfully committed to live Gantt schedule.'
    });
  };

  // 24-Hour Timeline Ruler for Visual Preview
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Header */}
      <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              What-If Scenario Simulator
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Interactive Rescheduling Engine
            </span>
            {standalone && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Independent Tab
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 max-w-3xl">
            Simulate moving scheduled maintenance windows, preview real-time conflicts with passenger and freight timetable vectors, and assess delay impact before applying to production.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBackToSchedule}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/40 text-xs font-bold text-cyan-200 hover:text-white flex items-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-950/20"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>← Back to Schedule &amp; Map</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Controls Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Block Selector & Shift By Slider */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-railway-border/90 bg-railway-surface/90 shadow-xl space-y-6">
          
          <div className="flex items-center justify-between pb-3 border-b border-railway-border">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Select Block &amp; Adjust Time Window
              </h2>
            </div>
            <button
              type="button"
              onClick={handleAutoFindSlot}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-glow-blue flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
              <span>AI Auto-Find Conflict-Free Gap</span>
            </button>
          </div>

          {/* Block Selector Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target Maintenance Block
            </label>
            <select
              value={selectedBlockId}
              onChange={(e) => {
                setSelectedBlockId(e.target.value);
                setShiftHours(0);
                setAppliedSuccess(false);
              }}
              className="w-full px-4 py-3 bg-railway-card border border-railway-border rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer"
            >
              {ganttBlocks.map((block) => (
                <option key={block.id} value={block.id} className="bg-slate-900 text-white">
                  {block.id} — {block.title} ({formatHour(block.startHour)}–{formatHour(block.endHour)} hrs) {block.hasConflict ? '⚠️ CONFLICT' : '✅ OK'}
                </option>
              ))}
            </select>
          </div>

          {/* Block Info Snapshot */}
          {selectedBlock && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-railway-card border border-railway-border">
                <span className="text-[10px] text-slate-400 block">Department</span>
                <span className="font-bold text-slate-200 mt-0.5 block">{selectedBlock.department}</span>
              </div>
              <div className="p-3 rounded-xl bg-railway-card border border-railway-border">
                <span className="text-[10px] text-slate-400 block">Corridor Section</span>
                <span className="font-bold text-cyan-300 mt-0.5 block truncate">{blockCorridor?.name || selectedBlock.corridorId}</span>
              </div>
              <div className="p-3 rounded-xl bg-railway-card border border-railway-border">
                <span className="text-[10px] text-slate-400 block">Location Marker</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{selectedBlock.trackKm}</span>
              </div>
              <div className="p-3 rounded-xl bg-railway-card border border-railway-border">
                <span className="text-[10px] text-slate-400 block">Duration</span>
                <span className="font-mono font-bold text-amber-300 mt-0.5 block">{blockDuration.toFixed(1)} Hours</span>
              </div>
            </div>
          )}

          {/* "Shift by" Slider */}
          <div className="p-5 rounded-2xl bg-railway-card border border-railway-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Shift Schedule Window (&plusmn; Hours)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Drag the slider to test shifting this block earlier or later in the operating day.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-xl text-xs font-mono font-extrabold border ${
                  shiftHours === 0 
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : shiftHours > 0 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                }`}>
                  {shiftHours > 0 ? `+${shiftHours}h` : `${shiftHours}h`}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setShiftHours(0);
                    setAppliedSuccess(false);
                  }}
                  title="Reset to 0"
                  className="p-1.5 rounded-lg bg-railway-surface hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min="-6"
                max="6"
                step="0.5"
                value={shiftHours}
                onChange={(e) => {
                  setShiftHours(parseFloat(e.target.value));
                  setAppliedSuccess(false);
                }}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>-6.0h (Earlier)</span>
                <span>0.0h (Original Slot)</span>
                <span>+6.0h (Later)</span>
              </div>
            </div>

            {/* Time slot delta badge */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-railway-border/60">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Original Window:</span>
                <span className="font-mono font-semibold text-slate-300">
                  {formatHour(originalStart)} – {formatHour(originalEnd)} hrs
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">Simulated Window:</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  {formatHour(newStartHour)} – {formatHour(newEndHour)} hrs
                </span>
              </div>
            </div>
          </div>

          {/* Visual Mini 24h Timeline Ruler */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              24-Hour Operating Day Conflict Heatmap:
            </span>

            <div className="relative h-14 rounded-xl border border-railway-border bg-railway-bg overflow-hidden">
              {/* Hour Grid */}
              <div className="absolute inset-0 grid grid-cols-24 divide-x divide-railway-border/30 pointer-events-none">
                {hours.map((h) => (
                  <div key={h} className={`h-full ${h >= 1 && h <= 5 ? 'bg-cyan-950/20' : ''}`} />
                ))}
              </div>

              {/* Trains on Corridor */}
              {corridorTrains.map((train) => {
                const left = (train.startHour / 24) * 100;
                const width = Math.max(2, ((train.endHour - train.startHour) / 24) * 100);
                return (
                  <div
                    key={train.id}
                    style={{ left: `${left}%`, width: `${width}%`, top: '4px' }}
                    className="absolute h-4 rounded px-1 flex items-center text-[8px] font-mono font-bold bg-slate-800/90 border border-slate-600 text-slate-300 truncate z-10"
                    title={`Train #${train.trainNo} (${train.trainName}): ${formatHour(train.startHour)} - ${formatHour(train.endHour)}`}
                  >
                    {train.trainNo}
                  </div>
                );
              })}

              {/* Simulated Moving Block */}
              <div
                style={{
                  left: `${(newStartHour / 24) * 100}%`,
                  width: `${Math.max(3, (blockDuration / 24) * 100)}%`,
                  bottom: '4px'
                }}
                className={`absolute h-6 rounded-lg px-2 flex items-center justify-between text-[10px] font-mono font-bold text-white z-20 transition-all duration-150 shadow-lg ${
                  simulatedConflicts.length > 0
                    ? 'bg-rose-600 border border-red-400 animate-pulse'
                    : 'bg-emerald-600 border border-emerald-400'
                }`}
              >
                <span className="truncate">{selectedBlock?.title}</span>
                <span className="text-[8px] opacity-90 shrink-0 ml-1">
                  {simulatedConflicts.length > 0 ? '⚠️ CONFLICT' : '✅ CLEAR'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Real-Time Impact & Before/After Status */}
        <div className="glass-panel p-6 rounded-2xl border border-railway-border/90 bg-railway-surface/90 shadow-xl space-y-5 flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-railway-border">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Real-Time Feasibility Check
              </h2>
              {simulatedConflicts.length > 0 ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  Conflict Detected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Feasible Slot
                </span>
              )}
            </div>

            {/* Overlapping Trains Status Box */}
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              simulatedConflicts.length > 0
                ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {simulatedConflicts.length > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>{simulatedConflicts.length} Timetable Overlap(s)</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>0 Train Overlaps (100% Clear Gap)</span>
                  </>
                )}
              </div>

              {simulatedConflicts.length > 0 ? (
                <ul className="space-y-1.5 pt-1 text-[11px] text-slate-300">
                  {simulatedConflicts.map((train) => (
                    <li key={train.id} className="flex items-start gap-1.5 font-mono">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>
                        #{train.trainNo} {train.trainName} ({formatHour(train.startHour)}–{formatHour(train.endHour)} hrs)
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  The shifted window aligns perfectly with a natural traffic lull on {blockCorridor?.code}. No passenger or freight services require regulation.
                </p>
              )}
            </div>

            {/* Before vs After Mini Metrics */}
            <div className="space-y-2 pt-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Impact Comparison:
              </span>

              <div className="p-3 rounded-xl bg-railway-card border border-railway-border space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Original Conflicts:</span>
                  <span className="font-mono font-bold text-rose-400">
                    {originalConflicts.length} Conflicts
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>New Simulated Conflicts:</span>
                  <span className={`font-mono font-bold ${
                    simulatedConflicts.length === 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {simulatedConflicts.length} Conflicts
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Punctuality Preservation:</span>
                  <span className={`font-mono font-bold ${
                    simulatedConflicts.length === 0 ? 'text-cyan-300' : 'text-amber-400'
                  }`}>
                    {simulatedConflicts.length === 0 ? '99.4% (Zero Delay)' : '82.5% (Delays Expected)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Area */}
          <div className="space-y-2 pt-4 border-t border-railway-border/60">
            {appliedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Slot updated in schedule!</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleApplyShift}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-glow-green flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Shifted Slot to Schedule</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

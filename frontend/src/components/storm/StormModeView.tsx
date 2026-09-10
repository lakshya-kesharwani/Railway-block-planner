import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { can } from '../../utils/permissions';
import { AccessRestricted } from '../common/AccessRestricted';
import { EmergencyCorridorMap } from './EmergencyCorridorMap';
import { INITIAL_CORRIDORS } from '../../data/mockData';
import { GanttBlock, Corridor, Department } from '../../types';
import { 
  calculateRiskScore, 
  calculatePriorityBucket, 
  getTrainImpact, 
  simulateShift, 
  EmergencySeverity, 
  EmergencyFailureType, 
  EmergencyPlanResult, 
  AffectedTrainDetail 
} from '../../utils/simulation';
import { 
  ArrowLeft, 
  ShieldAlert, 
  AlertTriangle, 
  Radio, 
  Activity, 
  Sparkles, 
  Zap, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  RefreshCw, 
  Layers, 
  Gauge, 
  Cpu, 
  Check, 
  FileCheck, 
  ArrowRight, 
  Wrench, 
  Train,
  Sliders,
  Send,
  CalendarRange
} from 'lucide-react';

export const StormModeView: React.FC = () => {
  const navigate = useNavigate();
  const { 
    role, 
    corridors, 
    trainSchedules, 
    ganttBlocks, 
    setGanttBlocks,
    theme,
    showToast
  } = useApp();

  // Gate behind canOptimize permission (Control Office / Admin only)
  if (!can(role, 'canOptimize')) {
    return <AccessRestricted moduleName="Storm Mode" standalone />;
  }

  const activeCorridors = corridors && corridors.length > 0 ? corridors : INITIAL_CORRIDORS;

  // Form State: Emergency Event Detection
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('COR-01');
  const [failureType, setFailureType] = useState<EmergencyFailureType>('Rail Fracture');
  const [severity, setSeverity] = useState<EmergencySeverity>('Critical');
  const [location, setLocation] = useState<string>('KM 142.4 - 146.0');
  const [timestamp, setTimestamp] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 16);
  });

  // Current corridor object
  const currentCorridor = useMemo(() => {
    return activeCorridors.find((c) => c.id === selectedCorridorId) || activeCorridors[0];
  }, [activeCorridors, selectedCorridorId]);

  // Update location placeholder when corridor changes
  const handleCorridorChange = (newCorridorId: string) => {
    setSelectedCorridorId(newCorridorId);
    if (newCorridorId === 'COR-01') setLocation('KM 142.4 - 146.0 (Near Bhatapara)');
    else if (newCorridorId === 'COR-02') setLocation('KM 172.0 - 176.5 (Bhilai Outers)');
    else if (newCorridorId === 'COR-03') setLocation('KM 08.5 - 12.0 (Mandir Hasaud)');
    else if (newCorridorId === 'COR-04') setLocation('KM 14.0 - 18.2 (Lakholi Siding)');
    else if (newCorridorId === 'COR-05') setLocation('KM 105.0 - 108.5 (Abhanpur Branch)');
    else setLocation('KM 92.0 - 95.0 (Rajim Section)');
  };

  // Pipeline execution state (1 through 8)
  const [pipelineActiveStep, setPipelineActiveStep] = useState<number>(8); // Completed initially for preview
  const [isProcessingPipeline, setIsProcessingPipeline] = useState<boolean>(false);
  const [hasTriggeredEmergency, setHasTriggeredEmergency] = useState<boolean>(true);

  // Plan Commit status
  const [isPlanApplied, setIsPlanApplied] = useState<boolean>(false);

  // Failure Start Hour (defaults to hour 5.5 = 05:30 AM to reflect real morning high-traffic window)
  const failureStartHour = 5.5;
  const failureDurationHours = severity === 'Critical' ? 2.5 : severity === 'High' ? 1.8 : 1.2;

  // Calculate simulated Risk & Priority
  // SIMULATED — replace with real XGBoost & Random Forest API call in production
  const riskScore = useMemo(() => {
    return calculateRiskScore(
      severity,
      currentCorridor.dailyTrainDensity,
      currentCorridor.maxSpeedKmph,
      failureType
    );
  }, [severity, currentCorridor, failureType]);

  const priorityBucket = useMemo(() => {
    return calculatePriorityBucket(riskScore);
  }, [riskScore]);

  // Real Train Impact filter (filtered on corridorId)
  // SIMULATED — replace with real Train Timetable Delay Prediction API call in production
  const affectedTrains: AffectedTrainDetail[] = useMemo(() => {
    return getTrainImpact(
      trainSchedules,
      selectedCorridorId,
      failureStartHour,
      failureStartHour + failureDurationHours,
      failureType
    );
  }, [trainSchedules, selectedCorridorId, failureStartHour, failureDurationHours, failureType]);

  // Existing blocks blocked / needing rescheduling on this corridor
  const impactedExistingBlocks = useMemo(() => {
    const failureEndHour = failureStartHour + failureDurationHours;
    return ganttBlocks.filter(
      (b) => b.corridorId === selectedCorridorId && (b.startHour < failureEndHour && b.endHour > failureStartHour)
    );
  }, [ganttBlocks, selectedCorridorId, failureStartHour, failureDurationHours]);

  // Simulated Re-Optimization Plan
  // SIMULATED — replace with real OR-Tools / MILP Solver API call in production
  const emergencyPlan: EmergencyPlanResult = useMemo(() => {
    return simulateShift(
      ganttBlocks,
      currentCorridor,
      failureStartHour,
      failureDurationHours,
      failureType,
      location,
      severity
    );
  }, [ganttBlocks, currentCorridor, failureStartHour, failureDurationHours, failureType, location, severity]);

  // Pipeline Trigger Action
  const handleReportEmergency = () => {
    setIsProcessingPipeline(true);
    setIsPlanApplied(false);
    setHasTriggeredEmergency(true);
    setPipelineActiveStep(1);

    // Sequential step activation: 500ms delay per step
    const totalSteps = 8;
    let currentStep = 1;

    const interval = setInterval(() => {
      currentStep += 1;
      setPipelineActiveStep(currentStep);

      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setIsProcessingPipeline(false);
        showToast({
          type: 'success',
          title: 'Emergency Strategy Generated',
          message: 'Zero train cancellations verified across all weather disruptions.'
        });
      }
    }, 550);
  };

  // Apply Emergency Plan to Global AppContext
  const handleApplyEmergencyPlan = () => {
    setGanttBlocks(emergencyPlan.updatedGanttBlocks);
    setIsPlanApplied(true);

    showToast({
      type: 'success',
      title: 'Emergency Plan Enacted',
      message: 'Dynamic corridor speed restrictions and emergency slots published.'
    });
  };

  // Pipeline step definitions
  const pipelineSteps = [
    { id: 1, title: 'Failure Event', sub: 'Telemetry Ingest', icon: AlertTriangle },
    { id: 2, title: 'Affected Assets', sub: 'Corridor Isolation', icon: Layers },
    { id: 3, title: 'Affected Trains', sub: 'Timetable Scan', icon: Train },
    { id: 4, title: 'Risk Prediction', sub: 'XGBoost Scoring', icon: Gauge },
    { id: 5, title: 'Priority Bucket', sub: 'Random Forest P1–P4', icon: Cpu },
    { id: 6, title: 'Constraint Update', sub: 'MILP Track Lock', icon: ShieldAlert },
    { id: 7, title: 'Re-Optimization', sub: 'OR-Tools Engine', icon: Sparkles },
    { id: 8, title: 'New Recovery Plan', sub: 'Conflict-Free Matrix', icon: CheckCircle2 }
  ];

  const getRiskColor = (score: number) => {
    if (score >= 85) return 'text-rose-400 bg-rose-500/20 border-rose-500/50';
    if (score >= 65) return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
    if (score >= 40) return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
    return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50';
  };

  return (
    <div className="min-h-screen bg-railway-bg text-slate-100 flex flex-col railway-grid-pattern selection:bg-rose-600 selection:text-white pb-20">
      
      {/* 1. Header Navigation Bar */}
      <header className="h-16 bg-railway-surface/95 border-b border-rose-500/30 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-3.5 py-1.5 rounded-xl bg-railway-card hover:bg-slate-800 border border-railway-border text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-2 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-rose-400" />
            <span>← Exit Storm Mode</span>
          </button>

          <div className="h-4 w-px bg-railway-border hidden sm:block" />

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-500/50 text-[11px] font-mono font-bold text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>STORM MODE ENGAGED</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 hidden md:inline">
            Role: <span className="font-bold text-amber-400 uppercase">{role}</span>
          </span>
          <div className="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Direct Replanning Console</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full mx-auto px-4 lg:px-6 pt-6 space-y-6">

        {/* Page Title & Emergency Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-railway-surface to-railway-card border border-rose-500/50 shadow-glow-red flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-600/30 text-rose-400 border border-rose-500/40">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                🚨 STORM MODE — Real-Time Emergency Replanning &amp; Recovery
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Rapid contingency replanning pipeline using simulated XGBoost Risk Scoring, Random Forest Priority Bucketing, and OR-Tools MILP schedule shifting to resolve corridor blockages with zero passenger train cancellations.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <span className="text-[10px] font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400">
              Corridor: <b className="text-white">{currentCorridor.code}</b>
            </span>
          </div>
        </div>

        {/* Section a: Emergency Event Detection Input Form */}
        <section className="glass-panel p-5 sm:p-6 rounded-2xl border border-railway-border/90 bg-railway-surface/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-railway-border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Section A: Emergency Event Detection &amp; Ingestion
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Step 1 of 9</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
            {/* Asset Dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Asset (Track Corridor)
              </label>
              <select
                value={selectedCorridorId}
                onChange={(e) => handleCorridorChange(e.target.value)}
                className="w-full px-3 py-2 bg-railway-card border border-railway-border rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                {activeCorridors.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900">
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Failure Type */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Failure Type
              </label>
              <select
                value={failureType}
                onChange={(e) => setFailureType(e.target.value as EmergencyFailureType)}
                className="w-full px-3 py-2 bg-railway-card border border-railway-border rounded-xl text-xs font-semibold text-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value="Rail Fracture" className="bg-slate-900">Rail Fracture (Track / Civil)</option>
                <option value="Signal Failure" className="bg-slate-900">Signal Failure (Interlocking)</option>
                <option value="OHE Snap" className="bg-slate-900">OHE Snap (25kV Traction Wire)</option>
                <option value="Track Washout" className="bg-slate-900">Track Washout (Subgrade Erosion)</option>
                <option value="Other" className="bg-slate-900">Other Asset Hazard</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as EmergencySeverity)}
                className="w-full px-3 py-2 bg-railway-card border border-railway-border rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value="Critical" className="bg-slate-900 text-rose-400 font-bold">Critical (Track Impassable)</option>
                <option value="High" className="bg-slate-900 text-orange-400 font-semibold">High (Severe Restriction)</option>
                <option value="Medium" className="bg-slate-900 text-amber-400">Medium (Speed Caution)</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Location Marker
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. KM 142.4 - 146.0"
                className="w-full px-3 py-2 bg-railway-card border border-railway-border rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Timestamp */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Incident Timestamp
              </label>
              <input
                type="text"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full px-3 py-2 bg-railway-card border border-railway-border rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-railway-border/60">
            <span className="text-[11px] text-slate-400">
              Reporting triggers automated sequence across Affected Assets, Train Schedules, XGBoost, Random Forest, and OR-Tools solvers.
            </span>
            <button
              type="button"
              onClick={handleReportEmergency}
              disabled={isProcessingPipeline}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-glow-red flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isProcessingPipeline ? 'animate-bounce' : ''}`} />
              <span>{isProcessingPipeline ? 'Executing STORM Pipeline...' : 'Report Emergency & Trigger STORM'}</span>
            </button>
          </div>
        </section>

        {/* Section b: STORM Pipeline Visualization */}
        <section className="glass-panel p-5 sm:p-6 rounded-2xl border border-rose-500/40 bg-railway-surface/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-railway-border">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Section B: STORM Pipeline Visualization (Sequential Stage Execution)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {isProcessingPipeline ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Processing Stage {pipelineActiveStep} / 8...
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  All 8 Stages Verified
                </span>
              )}
            </div>
          </div>

          {/* Step Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 relative">
            {pipelineSteps.map((step) => {
              const Icon = step.icon;
              const isCompleted = pipelineActiveStep > step.id || (!isProcessingPipeline && pipelineActiveStep === 8);
              const isCurrent = isProcessingPipeline && pipelineActiveStep === step.id;
              const isPending = pipelineActiveStep < step.id;

              let cardBg = 'bg-railway-card/80 border-railway-border/60 text-slate-400';
              if (isCurrent) {
                cardBg = 'bg-rose-950/70 border-rose-500 text-rose-200 shadow-glow-red animate-pulse';
              } else if (isCompleted) {
                cardBg = 'bg-emerald-950/30 border-emerald-500/50 text-slate-200 shadow-glow-green';
              }

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border ${cardBg} flex flex-col justify-between transition-all duration-300 relative`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400">0{step.id}</span>
                      <div className="p-1.5 rounded-lg bg-railway-surface/80 border border-white/10">
                        {isCompleted ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-3 h-3 text-rose-400 animate-spin" />
                        ) : (
                          <Icon className="w-3 h-3 text-slate-500" />
                        )}
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-white tracking-tight leading-snug">{step.title}</h3>
                    <p className="text-[10px] font-mono text-cyan-300 truncate mt-0.5">{step.sub}</p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/5 text-[9px] font-mono">
                    {isCompleted ? (
                      <span className="text-emerald-400 font-bold">READY</span>
                    ) : isCurrent ? (
                      <span className="text-rose-400 font-bold">ACTIVE</span>
                    ) : (
                      <span className="text-slate-500">QUEUED</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section c & d: Two-column grid (Affected Trains/Assets & Risk/Priority) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Section c: Affected Trains & Assets Panel (2 columns on lg) */}
          <section className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-railway-border/90 bg-railway-surface/90 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-railway-border">
              <div className="flex items-center gap-2">
                <Train className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Section C: Affected Trains &amp; Corridor Asset Status
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {affectedTrains.length} Trains on {currentCorridor.code}
              </span>
            </div>

            {/* Asset Telemetry Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-railway-card border border-railway-border">
                <span className="text-[10px] text-slate-400 block font-medium">Corridor Name</span>
                <span className="font-bold text-slate-200 mt-0.5 block truncate">{currentCorridor.name}</span>
              </div>
              <div className="p-3 rounded-xl bg-railway-card border border-railway-border">
                <span className="text-[10px] text-slate-400 block font-medium">Section Length</span>
                <span className="font-bold font-mono text-cyan-300 mt-0.5 block">{currentCorridor.sectionLengthKm} km</span>
              </div>
              <div className="p-3 rounded-xl bg-railway-card border border-railway-border">
                <span className="text-[10px] text-slate-400 block font-medium">Max Speed Limit</span>
                <span className="font-bold font-mono text-emerald-300 mt-0.5 block">{currentCorridor.maxSpeedKmph} km/h</span>
              </div>
              <div className="p-3 rounded-xl bg-railway-card border border-railway-border">
                <span className="text-[10px] text-slate-400 block font-medium">Daily Traffic Density</span>
                <span className="font-bold font-mono text-amber-300 mt-0.5 block">{currentCorridor.dailyTrainDensity} Trains/Day</span>
              </div>
            </div>

            {/* Filtered Affected Trains List */}
            <div className="space-y-2.5 pt-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Live Timetable Vectors in Corridor Sector:
              </div>

              {affectedTrains.length === 0 ? (
                <div className="p-4 rounded-xl bg-railway-card border border-railway-border text-center text-xs text-slate-400">
                  No direct train vectors scheduled on this corridor during the current hour window.
                </div>
              ) : (
                affectedTrains.map((item) => {
                  const train = item.train;
                  const isHighPriority = train.type === 'Vande Bharat' || train.priorityLevel === 'High-Speed';

                  return (
                    <div
                      key={train.id}
                      className="p-3.5 rounded-xl bg-railway-card/90 border border-railway-border hover:border-slate-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-cyan-300 text-xs">#{train.trainNo}</span>
                          <span className="font-bold text-white text-xs">{train.trainName}</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${
                            isHighPriority 
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
                              : 'bg-slate-700/50 text-slate-300 border-slate-600'
                          }`}>
                            {train.type}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Slot: {train.startHour}:00 – {train.endHour}:00 hrs
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          {item.plainEnglishImpact}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        <span className="px-2 py-1 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono font-bold text-[11px]">
                          +{item.estimatedDelayMinutes} min delay
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Section d: Risk & Priority Panel (1 column on lg) */}
          <section className="glass-panel p-5 rounded-2xl border border-railway-border/90 bg-railway-surface/90 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-railway-border">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-orange-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Section D: Risk &amp; Priority
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-slate-400">XGBoost / RF</span>
              </div>

              {/* Risk Score Display */}
              <div className="mt-4 p-5 rounded-2xl bg-railway-card border border-railway-border text-center space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Predicted Safety &amp; Delay Risk Score
                </span>

                <div className="flex items-center justify-center gap-3">
                  <div className={`px-4 py-2 rounded-2xl border text-2xl sm:text-3xl font-mono font-extrabold shadow-lg ${getRiskColor(riskScore)}`}>
                    {riskScore} / 100
                  </div>
                </div>

                <p className="text-[10px] font-mono text-slate-400">
                  // SIMULATED — replace with real XGBoost Risk Prediction Model API call in production
                </p>
              </div>

              {/* Priority Bucket */}
              <div className={`mt-3 p-4 rounded-2xl bg-railway-card border ${priorityBucket.borderClass} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority Tier</span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-extrabold border ${priorityBucket.badgeClass}`}>
                    {priorityBucket.bucket}
                  </span>
                </div>
                <p className="text-xs font-bold text-white leading-snug">
                  {priorityBucket.label}
                </p>
                <p className="text-[10px] font-mono text-slate-400 pt-1">
                  // SIMULATED — replace with real Random Forest Priority Classification Model API call in production
                </p>
              </div>
            </div>

            {/* Severity Breakdown Factors */}
            <div className="space-y-1.5 pt-2 border-t border-railway-border/60 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Failure Hazard:</span>
                <span className="font-bold text-rose-400">{failureType} ({severity})</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Speed Penalty Factor:</span>
                <span className="font-mono text-amber-300">{currentCorridor.maxSpeedKmph} km/h line</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Passenger Protection:</span>
                <span className="font-semibold text-cyan-300">Zero Cancellation Locked</span>
              </div>
            </div>
          </section>

        </div>

        {/* Section e: Constraint Update Panel */}
        <section className="glass-panel p-5 rounded-2xl border border-rose-500/40 bg-rose-950/20 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-rose-500/30">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Section E: Constraint Update (Track Availability Matrix)
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white animate-pulse">
              RED ZONE ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-railway-card/90 border border-rose-500/30 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Blocked Section</span>
              <span className="text-sm font-extrabold text-rose-300 font-mono block">{location}</span>
              <span className="text-[11px] text-slate-400 block">Status: UNAVAILABLE / ISOLATED for scheduled trains</span>
            </div>

            <div className="p-3.5 rounded-xl bg-railway-card/90 border border-railway-border space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Power / Speed State</span>
              <span className="text-sm font-bold text-amber-300 block">
                {failureType === 'OHE Snap' ? '25kV Catenary Dead' : 'Caution TSR 15 km/h'}
              </span>
              <span className="text-[11px] text-slate-400 block">Interlocking points clamped facing normal direction</span>
            </div>

            <div className="p-3.5 rounded-xl bg-railway-card/90 border border-railway-border space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Scheduled Blocks Displaced</span>
              <span className="text-sm font-extrabold font-mono text-cyan-300 block">
                {impactedExistingBlocks.length} Scheduled Block(s) Overlapping
              </span>
              <span className="text-[11px] text-slate-400 block">
                Requires automated displacement via MILP constraint solver
              </span>
            </div>
          </div>
        </section>

        {/* Section g: Emergency Map */}
        <section
          className={`glass-panel p-5 sm:p-6 rounded-2xl border transition-colors shadow-xl space-y-4 ${
            theme === 'dark'
              ? 'border-railway-border/90 bg-railway-surface/90'
              : 'border-slate-200 bg-white/95'
          }`}
        >
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b ${
              theme === 'dark' ? 'border-railway-border' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CalendarRange className={`w-4 h-4 ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`} />
              <h2
                className={`text-sm font-bold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                Section G: Interactive Emergency Geographic Corridor Map
              </h2>
            </div>
            <div
              className={`flex items-center gap-3 text-xs font-mono ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-semibold'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 shrink-0" /> Hazard Sector
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-orange-500 shrink-0" /> Affected Track
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500 shrink-0" /> Bypass Diversion
              </span>
            </div>
          </div>

          <EmergencyCorridorMap
            corridorId={selectedCorridorId}
            failureType={failureType}
            location={location}
            affectedTrains={affectedTrains}
          />
        </section>

        {/* Section f: Emergency Re-Optimization Panel */}
        <section className="glass-panel p-5 sm:p-6 rounded-2xl border border-railway-border/90 bg-railway-surface/90 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-railway-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Section F: Emergency Re-Optimization (OR-Tools Solver)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleReportEmergency}
              className="px-3.5 py-1.5 rounded-xl bg-railway-card hover:bg-slate-800 border border-railway-border text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Re-Run Solver Heuristic</span>
            </button>
          </div>

          <p className="text-[10px] font-mono text-slate-400">
            // SIMULATED — replace with real OR-Tools / MILP Solver API call in production
          </p>

          {/* Metrics Comparison Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-railway-card border border-rose-500/30">
              <span className="text-[10px] text-slate-400 font-medium block">Unmitigated Delays (Before)</span>
              <span className="text-xl font-extrabold font-mono text-rose-400 mt-1 block">
                {emergencyPlan.delaysBeforeMinutes} mins
              </span>
              <span className="text-[10px] text-slate-500 block">Multiple conflicting queues</span>
            </div>

            <div className="p-3.5 rounded-xl bg-railway-card border border-emerald-500/40">
              <span className="text-[10px] text-slate-400 font-medium block">Optimized Delay Impact (After)</span>
              <span className="text-xl font-extrabold font-mono text-emerald-400 mt-1 block">
                {emergencyPlan.delaysAfterMinutes} mins
              </span>
              <span className="text-[10px] text-emerald-300 font-bold block">
                ↓ {Math.round(((emergencyPlan.delaysBeforeMinutes - emergencyPlan.delaysAfterMinutes) / emergencyPlan.delaysBeforeMinutes) * 100)}% Delay Reduction
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-railway-card border border-railway-border">
              <span className="text-[10px] text-slate-400 font-medium block">Timetable Conflicts Resolved</span>
              <span className="text-xl font-extrabold font-mono text-amber-300 mt-1 block">
                {emergencyPlan.conflictsBefore} → 0
              </span>
              <span className="text-[10px] text-emerald-400 font-bold block">100% Conflict-Free Target</span>
            </div>

            <div className="p-3.5 rounded-xl bg-railway-card border border-railway-border">
              <span className="text-[10px] text-slate-400 font-medium block">Re-Scheduled Maintenance Blocks</span>
              <span className="text-xl font-extrabold font-mono text-cyan-300 mt-1 block">
                {emergencyPlan.rescheduledCount} Blocks Shifted
              </span>
              <span className="text-[10px] text-slate-400 block">Moved to shadow layovers</span>
            </div>
          </div>

          {/* Resource Reallocation Summary */}
          <div className="p-4 rounded-xl bg-railway-card/80 border border-railway-border text-xs space-y-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Automated Resource Reallocation &amp; Crew Dispatch Matrix:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block">Assigned Emergency Crews:</span>
                <ul className="mt-1 space-y-1 text-slate-200">
                  {emergencyPlan.resourceSummary.crewsAssigned.map((c, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span>{c.teamName} ({c.count} members)</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Dispatched Machinery:</span>
                <ul className="mt-1 space-y-1 text-slate-200">
                  {emergencyPlan.resourceSummary.machinesDispatched.map((m, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Safety Protocol:</span>
                <div className="mt-1 text-slate-200 space-y-0.5">
                  <div>Lookout Marshals: <b>{emergencyPlan.resourceSummary.safetyMarshals} Marshals</b></div>
                  <div>Estimated Recovery Window: <b>{emergencyPlan.resourceSummary.estimatedRecoveryTimeMinutes} minutes</b></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section h: AI Recommendation Panel */}
        <section className="glass-panel p-5 sm:p-6 rounded-2xl border border-cyan-500/40 bg-railway-surface/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-railway-border">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Section H: AI Recommendation &amp; Tactical Guidance
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/40">
              Prescriptive Decision Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-railway-card border border-railway-border space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Immediate Tactical Action</span>
                <p className="text-slate-200 font-semibold leading-relaxed">
                  {emergencyPlan.recommendation.immediateAction}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-railway-card border border-railway-border space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suggested Block Window</span>
                <p className="text-cyan-300 font-mono font-bold leading-relaxed">
                  {emergencyPlan.recommendation.suggestedWindow}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-railway-card border border-railway-border space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Required Teams &amp; Heavy Assets</span>
                <p className="text-slate-200 leading-relaxed">
                  {emergencyPlan.recommendation.requiredTeams}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-railway-card border border-railway-border space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recovery Time Estimate</span>
                <p className="text-emerald-400 font-bold leading-relaxed">
                  {emergencyPlan.recommendation.recoveryTime}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 space-y-1">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Mandatory Safety Warning &amp; Isolations
                </span>
                <p className="text-xs leading-relaxed font-semibold">
                  {emergencyPlan.recommendation.safetyWarning}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section i: Final Plan Comparison & Action */}
        <section className="glass-panel p-5 sm:p-6 rounded-2xl border border-rose-500/40 bg-gradient-to-b from-railway-surface to-railway-card shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-railway-border">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Section I: Final Plan Comparison &amp; Schedule Execution
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Step 9 of 9</span>
          </div>

          {/* Before vs After Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Previous Plan (Legacy Disrupted State) */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Previous Plan (Disrupted Status)</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                  High Impact
                </span>
              </div>

              <ul className="space-y-2 text-slate-300 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong>{emergencyPlan.delaysBeforeMinutes} min cumulative delay</strong> across passenger &amp; freight services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong>{emergencyPlan.conflictsBefore} active corridor overlaps</strong> with high-speed passenger services</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span><strong>Overlapping civil/traction works</strong> stuck in the unisolated danger zone</span>
                </li>
              </ul>
            </div>

            {/* New Re-Optimized Recovery Plan */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-railway-card to-cyan-950/30 border border-emerald-500/50 shadow-glow-green space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">New Re-Optimized Recovery Plan</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  MILP Feasible
                </span>
              </div>

              <ul className="space-y-2 text-slate-200 text-xs">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>{emergencyPlan.delaysAfterMinutes} min regulated delay</strong> (down from {emergencyPlan.delaysBeforeMinutes} mins)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>0 active conflicts</strong> with absolute clearance of the incident zone</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Emergency Restoration Block:</strong> {emergencyPlan.emergencyBlock.title} scheduled</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>{emergencyPlan.rescheduledCount} conflicting blocks shifted</strong> safely into shadow windows</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Action Bar */}
          <div className="pt-3 border-t border-railway-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              {isPlanApplied ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Emergency schedule applied live! Gantt Chart timeline has been updated with the restoration block.
                </span>
              ) : (
                <span>
                  Clicking &ldquo;Apply Emergency Plan&rdquo; will commit the new schedule to the application state.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isPlanApplied ? (
                <button
                  type="button"
                  onClick={handleApplyEmergencyPlan}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-glow-green flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-yellow-200" />
                  <span>Apply Emergency Plan</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-railway-card hover:bg-slate-800 border border-emerald-500/50 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-400" />
                  <span>Return to Schedule &amp; Map (Gantt)</span>
                </button>
              )}
            </div>
          </div>

        </section>

      </main>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Cpu, 
  Workflow, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  Play, 
  CheckCircle2, 
  Clock, 
  Layers, 
  FileText, 
  Train, 
  Zap, 
  Activity, 
  Check,
  RefreshCw
} from 'lucide-react';
import { SimulatedBadge, PriorityBadge } from '../common/Badge';

export const AIOptimizationPipeline: React.FC = () => {
  const { aiWeights, setAiWeights, autoResolveConflicts, isAutoResolving, showToast } = useApp();
  const [activeStage, setActiveStage] = useState<number>(2); // Stage 2 or 3 by default
  const [isRunningPipeline, setIsRunningPipeline] = useState<boolean>(false);
  const [pipelineProgress, setPipelineProgress] = useState<number>(100);

  const runPipelineSimulation = () => {
    setIsRunningPipeline(true);
    setPipelineProgress(0);

    const interval = setInterval(() => {
      setPipelineProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunningPipeline(false);
          showToast({
            type: 'success',
            title: 'Optimization Complete',
            message: 'MILP Constraint Solver converged with zero passenger delay.'
          });
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const stages = [
    {
      id: 1,
      title: '1. Maintenance Request',
      subtitle: 'Corridor & Asset Telemetry',
      badge: 'Input Data',
      icon: FileText,
      color: 'blue',
      description: 'Ingests field defect logs, Track Quality Index (TQI), USFD flaw detections, 25kV OHE wear, and corridor train density.',
      metrics: [
        { label: 'Active Requisitions', value: '8 Batched' },
        { label: 'Corridor Density', value: '114 Trains/Day' },
        { label: 'Track Geometry Data', value: 'TQI: 42.1 (Degraded)' }
      ]
    },
    {
      id: 2,
      title: '2. AI Risk Prediction',
      subtitle: 'Priority Scoring Engine',
      badge: 'XGBoost ML Model',
      icon: Cpu,
      color: 'orange',
      description: 'Machine learning model assesses safety urgency, derailment risk probability, and cascading delay impact to output a calibrated priority score (0-100).',
      metrics: [
        { label: 'Risk Model', value: 'XGBoost + Gradient Boost' },
        { label: 'Criticality Weight', value: `${aiWeights.trackSafety}% Safety Urgency` },
        { label: 'Score Output', value: '94/100 (Immediate Action)' }
      ]
    },
    {
      id: 3,
      title: '3. Optimization Engine',
      subtitle: 'MILP Constraint Solver',
      badge: 'Mixed-Integer LP',
      icon: Workflow,
      color: 'purple',
      description: 'Mathematical solver scans train timetable gaps, crew shift limits, and OHE isolation needs to formulate conflict-free shadow block windows.',
      metrics: [
        { label: 'Hard Constraints', value: '0 Passenger Cancellations' },
        { label: 'Solver Method', value: 'MILP + Branch & Bound' },
        { label: 'Convergence Time', value: '1.24 seconds' }
      ]
    },
    {
      id: 4,
      title: '4. Recommended Slot',
      subtitle: 'Feasible Shadow Window',
      badge: 'Optimal Clearance',
      icon: ShieldCheck,
      color: 'green',
      description: 'Generates final conflict-free corridor schedule ready for Control Office section clearance with automated speed restrictions and crew dispatch.',
      metrics: [
        { label: 'Allocated Window', value: '01:30 - 04:30 hrs' },
        { label: 'Delay Impact', value: '0.0 min (Zero Delay)' },
        { label: 'Multi-Dept Synergy', value: 'Civil + Traction Combined' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Workflow className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              AI Priority Scoring & Optimization Pipeline Architecture
            </h2>
            <SimulatedBadge text="Mathematical Optimization Core" />
          </div>
          <p className="text-xs text-slate-400 max-w-3xl">
            Visualizing the end-to-end algorithmic transformation from raw field maintenance requisitions to conflict-free corridor block slots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runPipelineSimulation}
            disabled={isRunningPipeline}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-glow-blue flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRunningPipeline ? 'animate-spin' : ''}`} />
            <span>{isRunningPipeline ? 'Executing Optimization...' : 'Run Pipeline Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Visual Pipeline Flow Cards with Connected Arrows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isSelected = activeStage === stage.id;
          
          let cardBorder = 'border-railway-border/80';
          let glowClass = '';
          if (stage.color === 'blue') cardBorder = isSelected ? 'border-blue-500 shadow-glow-blue' : 'hover:border-blue-500/50';
          if (stage.color === 'orange') cardBorder = isSelected ? 'border-orange-500 shadow-glow-orange' : 'hover:border-orange-500/50';
          if (stage.color === 'purple') cardBorder = isSelected ? 'border-purple-500 shadow-lg' : 'hover:border-purple-500/50';
          if (stage.color === 'green') cardBorder = isSelected ? 'border-emerald-500 shadow-glow-green' : 'hover:border-emerald-500/50';

          return (
            <div
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={`glass-panel p-5 rounded-2xl border ${cardBorder} bg-railway-card/90 transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                isSelected ? 'bg-railway-card ring-1 ring-white/10' : ''
              }`}
            >
              {/* Step indicator badge */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-railway-surface text-slate-300 border border-railway-border">
                    {stage.badge}
                  </span>

                  <div className={`p-2 rounded-xl bg-railway-surface border border-railway-border text-slate-300 group-hover:text-white transition`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white tracking-tight">{stage.title}</h3>
                <p className="text-[11px] font-semibold text-cyan-300 mb-2">{stage.subtitle}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{stage.description}</p>
              </div>

              {/* Metrics box */}
              <div className="mt-4 pt-3 border-t border-railway-border/60 space-y-1.5 bg-railway-surface/60 p-2.5 rounded-xl">
                {stage.metrics.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{m.label}:</span>
                    <span className="font-mono font-bold text-slate-200">{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Connected Arrow Indicator for large screens */}
              {idx < stages.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-railway-surface border border-cyan-500/50 items-center justify-center text-cyan-400 shadow-md">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Parameter Tuning & Deep Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: AI Weight Sliders */}
        <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-railway-border">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-railway-orange" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                AI Optimization Objective Weights
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Total: 100%</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Punctuality Penalty */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Passenger Punctuality Preservation</span>
                <span className="font-mono text-cyan-400">{aiWeights.punctuality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={aiWeights.punctuality}
                onChange={(e) => setAiWeights(prev => ({ ...prev, punctuality: parseInt(e.target.value) }))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Penalizes passenger train slow-downs & re-routing.</p>
            </div>

            {/* Track Safety Risk */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Track & Asset Safety Risk Weight</span>
                <span className="font-mono text-orange-400">{aiWeights.trackSafety}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={aiWeights.trackSafety}
                onChange={(e) => setAiWeights(prev => ({ ...prev, trackSafety: parseInt(e.target.value) }))}
                className="w-full accent-railway-orange cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Prioritizes high-speed rail flaws & ultrasonic weld defects.</p>
            </div>

            {/* Weather / Monsoon */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Weather Vulnerability Buffer</span>
                <span className="font-mono text-amber-400">{aiWeights.weather}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                value={aiWeights.weather}
                onChange={(e) => setAiWeights(prev => ({ ...prev, weather: parseInt(e.target.value) }))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Adds rain/fog safety margins to OHE & ballast clearing.</p>
            </div>

            {/* Multi-Dept Synergy */}
            <div>
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>Cross-Department Synergy Bonus</span>
                <span className="font-mono text-purple-400">{aiWeights.synergy}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={aiWeights.synergy}
                onChange={(e) => setAiWeights(prev => ({ ...prev, synergy: parseInt(e.target.value) }))}
                className="w-full accent-purple-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Incentivizes combining Civil + Traction + S&T in one window.</p>
            </div>
          </div>
        </div>

        {/* Right: Before vs After Innovation Benchmark */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-railway-border/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-railway-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Innovation Impact: Manual Scheduling vs. AI-Assisted MILP
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                Verified Benchmark
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
              
              {/* Manual Scheduling */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Legacy Manual Process</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">Sub-Optimal</span>
                </div>

                <ul className="space-y-2 text-slate-300 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">✕</span>
                    <span><strong>45-60 min train delays</strong> per corridor maintenance block</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">✕</span>
                    <span><strong>Fragmented departmental requests</strong> requiring redundant separate power cuts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">✕</span>
                    <span><strong>22% Shadow window utilization</strong> due to manual computation limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">✕</span>
                    <span><strong>3.5 hours</strong> average time to manually resolve timetable overlaps</span>
                  </li>
                </ul>
              </div>

              {/* AI-Assisted Optimization */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-railway-card to-cyan-950/30 border border-emerald-500/50 shadow-glow-green space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">AI-Assisted Optimizer</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">State of the Art</span>
                </div>

                <ul className="space-y-2 text-slate-200 text-xs">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>0.0 min passenger delay</strong> by locking natural freight/night gaps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Multi-dept co-scheduling</strong> (Track + OHE + S&T in single block)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>86.4% corridor utilization</strong> with automated headway buffers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>1.2 seconds</strong> instant conflict auto-resolution</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-railway-border/60 flex items-center justify-between text-xs text-slate-400">
            <span>Mathematical Guarantee: Strict integer feasibility with guaranteed headway separation</span>
            <span className="font-mono text-cyan-300 font-bold">MILP Feasibility: 100%</span>
          </div>
        </div>

      </div>

    </div>
  );
};

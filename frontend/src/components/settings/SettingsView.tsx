import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, 
  Cpu, 
  RotateCcw, 
  Database, 
  Sliders, 
  ShieldCheck, 
  Save, 
  Sparkles,
  Info,
  Server,
  Layers
} from 'lucide-react';
import { SimulatedBadge } from '../common/Badge';
import { 
  INITIAL_REQUESTS, 
  INITIAL_GANTT_BLOCKS, 
  INITIAL_TRAIN_SCHEDULES, 
  SCENARIO_PRESETS 
} from '../../data/mockData';

export const SettingsView: React.FC = () => {
  const { 
    aiWeights, 
    setAiWeights, 
    setRequests, 
    setGanttBlocks, 
    selectedScenario, 
    setSelectedScenario,
    showToast
  } = useApp();

  const [headwayBufferMins, setHeadwayBufferMins] = useState<number>(15);
  const [solverMaxIterations, setSolverMaxIterations] = useState<number>(500);
  const [enableShadowWindowHeuristic, setEnableShadowWindowHeuristic] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleResetData = () => {
    setRequests(INITIAL_REQUESTS);
    setGanttBlocks(INITIAL_GANTT_BLOCKS);
    setSelectedScenario(SCENARIO_PRESETS[0]);
    showToast({
      type: 'info',
      title: 'Dataset Reset',
      message: 'Simulated prototype dataset reset to default state.'
    });
  };

  const handleSaveSettings = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-slate-500/20 text-slate-300">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              System Configuration & AI Engine Hyperparameters
            </h2>
            <SimulatedBadge text="Admin Console" />
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Configure mathematical solver tolerances, safety headway buffers, and synthetic prototype data seeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-railway-orange to-amber-600 hover:from-railway-orangeLight hover:to-orange-500 text-white text-xs font-bold shadow-glow-orange flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saveSuccess ? 'Settings Saved!' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: AI Solver Parameters */}
        <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-railway-border">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">MILP Solver & Headway Constraints</h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-300">v3.2.0</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Minimum Train Headway Buffer</span>
                <span className="font-mono text-cyan-400 font-bold">{headwayBufferMins} minutes</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={headwayBufferMins}
                onChange={(e) => setHeadwayBufferMins(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Separation distance maintained between scheduled block boundaries and high-speed trains.</span>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Max Solver Iterations (Branch & Bound)</span>
                <span className="font-mono text-orange-400 font-bold">{solverMaxIterations} steps</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={solverMaxIterations}
                onChange={(e) => setSolverMaxIterations(parseInt(e.target.value))}
                className="w-full accent-railway-orange cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Higher steps improve multi-corridor global optimality at the cost of computation time.</span>
            </div>

            <div className="pt-2 border-t border-railway-border space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableShadowWindowHeuristic}
                  onChange={(e) => setEnableShadowWindowHeuristic(e.target.checked)}
                  className="rounded bg-railway-surface border-railway-border text-railway-orange focus:ring-0"
                />
                <span>Enable Autonomous Shadow Window Detection</span>
              </label>
              <p className="text-[10px] text-slate-500 pl-6">
                Automatically co-schedules track maintenance in natural low-traffic gaps created by freight crossings.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Synthetic Data & Scenario Management */}
        <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-railway-border">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Prototype Synthetic Dataset Controls</h3>
              </div>
              <SimulatedBadge text="Seeded Mock Data" />
            </div>

            <div className="space-y-3 mt-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                This prototype runs with synthetic data generated to reflect real-world Indian Railway trunk corridor density, USFD flaw statistics, and OHE isolation procedures.
              </p>

              <div className="p-3 rounded-xl bg-railway-surface border border-railway-border space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Active Operational Scenario</span>
                <div className="text-xs font-bold text-cyan-300">{selectedScenario.name}</div>
                <p className="text-[11px] text-slate-400">{selectedScenario.description}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-railway-border flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 font-mono">Records: 8 Requests, 6 Gantt Blocks</span>

            <button
              onClick={handleResetData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Prototype Data</span>
            </button>
          </div>
        </div>

      </div>

      {/* System Information & Architecture Specifications */}
      <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>System Architecture & Integration Specifications</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300 pt-1">
          <div className="p-3 rounded-xl bg-railway-surface/80 border border-railway-border">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">AI Risk Prioritization</span>
            <span className="font-mono text-cyan-300 font-bold mt-0.5 block">XGBoost Classifier + Regressor</span>
            <span className="text-[10px] text-slate-400">Trained on 45,000 synthetic defect inspection logs</span>
          </div>

          <div className="p-3 rounded-xl bg-railway-surface/80 border border-railway-border">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Corridor Optimization Engine</span>
            <span className="font-mono text-orange-400 font-bold mt-0.5 block">Mixed-Integer Linear Program (MILP)</span>
            <span className="text-[10px] text-slate-400">Guarantees headway separation & zero train overlaps</span>
          </div>

          <div className="p-3 rounded-xl bg-railway-surface/80 border border-railway-border">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Control Office Integration</span>
            <span className="font-mono text-emerald-400 font-bold mt-0.5 block">Real-time Dispatch Protocol</span>
            <span className="text-[10px] text-slate-400">One-click section clearance and speed restriction sync</span>
          </div>
        </div>
      </div>

    </div>
  );
};

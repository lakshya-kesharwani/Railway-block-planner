import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Department, UrgencyLevel } from '../../types';
import { 
  X, 
  Sparkles, 
  Wrench, 
  Zap, 
  Radio, 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  ShieldCheck, 
  Check 
} from 'lucide-react';
import { PriorityBadge, SimulatedBadge } from '../common/Badge';

export const NewRequestModal: React.FC = () => {
  const { isNewRequestModalOpen, setIsNewRequestModalOpen, addRequest, corridors } = useApp();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState<Department>('Engineering');
  const [corridor, setCorridor] = useState(corridors[0]?.name || 'BSP-DURG Main Line (UP)');
  const [trackKm, setTrackKm] = useState('KM 152.0 - 154.5');
  const [durationHours, setDurationHours] = useState<number>(2.5);
  const [deadline, setDeadline] = useState('2026-09-04');
  const [urgency, setUrgency] = useState<UrgencyLevel>('High');
  const [blockType, setBlockType] = useState('Mechanized Track Tamping (CSM)');
  const [ohePowerCut, setOhePowerCut] = useState<boolean>(false);
  const [speedRestriction, setSpeedRestriction] = useState<string>('30 km/h');
  const [specialMachine, setSpecialMachine] = useState<string>('Plasser 09-3X Tamper');
  const [crewRequired, setCrewRequired] = useState<number>(14);

  // Live Dynamic AI Risk & Priority Score Predictor
  const dynamicAI = useMemo(() => {
    let baseScore = 50;
    
    if (urgency === 'Emergency') baseScore += 35;
    else if (urgency === 'High') baseScore += 22;
    else if (urgency === 'Medium') baseScore += 8;
    else baseScore -= 10;

    if (durationHours > 3.5) baseScore += 8;
    if (ohePowerCut) baseScore += 7;
    if (department === 'Engineering') baseScore += 4;
    if (speedRestriction !== 'None') baseScore += 5;

    // Clamp score
    const finalScore = Math.min(99, Math.max(25, baseScore));

    const trackGeometryRisk = Math.min(98, Math.max(20, finalScore + (department === 'Engineering' ? 10 : -15)));
    const trafficVolumeIndex = Math.min(95, Math.max(40, 85 + (corridor.includes('Fast') || corridor.includes('UP') ? 8 : -10)));
    const defectSeverity = Math.min(96, Math.max(30, urgency === 'Emergency' ? 95 : urgency === 'High' ? 82 : 55));
    const weatherVulnerability = Math.min(90, Math.max(30, ohePowerCut ? 80 : 45));
    const assetAgingIndex = Math.min(92, Math.max(40, Math.round(finalScore * 0.9)));

    // Recommended shadow window
    const startHour = 1.5;
    const endHour = 1.5 + durationHours;
    const formatTime = (h: number) => {
      const hrs = Math.floor(h);
      const mins = Math.round((h - hrs) * 60);
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    return {
      finalScore,
      trackGeometryRisk,
      trafficVolumeIndex,
      defectSeverity,
      weatherVulnerability,
      assetAgingIndex,
      recommendedSlot: {
        startTime: formatTime(startHour),
        endTime: formatTime(endHour),
        startHour,
        endHour
      }
    };
  }, [urgency, durationHours, ohePowerCut, department, speedRestriction, corridor]);

  if (!isNewRequestModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRequest({
      title: title || `${department}: ${blockType}`,
      department,
      corridor,
      trackKm,
      durationHours,
      deadline,
      urgency,
      blockType,
      submittedBy: currentUser?.name || 'Field Maintenance Supervisor',
      priorityScore: dynamicAI.finalScore,
      priorityBreakdown: {
        trackGeometryRisk: dynamicAI.trackGeometryRisk,
        trafficVolumeIndex: dynamicAI.trafficVolumeIndex,
        defectSeverity: dynamicAI.defectSeverity,
        weatherVulnerability: dynamicAI.weatherVulnerability,
        assetAgingIndex: dynamicAI.assetAgingIndex
      },
      constraints: {
        ohePowerCutRequired: ohePowerCut,
        speedRestrictionTsr: speedRestriction,
        specialMachine,
        crewRequired,
        interlockingIsolation: department === 'Signal & Telecom'
      },
      suggestedSlot: {
        date: deadline,
        startTime: dynamicAI.recommendedSlot.startTime,
        endTime: dynamicAI.recommendedSlot.endTime,
        startHour: dynamicAI.recommendedSlot.startHour,
        endHour: dynamicAI.recommendedSlot.endHour,
        corridor,
        shadowBlockWithTrain: 'Pre-Dawn Passenger Gap',
        trainDelayMinutes: 0,
        punctualityScore: 99.0,
        confidenceScore: 94.5
      }
    });

    setIsNewRequestModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-railway-surface border border-railway-border rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="p-4 px-6 bg-railway-card border-b border-railway-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-railway-orange/20 text-railway-orange">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Submit Maintenance Block Request
              </h2>
              <p className="text-xs text-slate-400">
                AI Optimization Engine will automatically predict priority score and find conflict-free shadow slots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SimulatedBadge text="Live AI Model Estimation" />
            <button
              onClick={() => setIsNewRequestModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-railway-surface transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Form + Live AI Estimator */}
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Fields (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Title / Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Request Title / Defect Summary
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Turnout Tongue Rail Weld Replacement & USFD Testing"
                className="w-full px-3 py-2 rounded-xl bg-railway-card border border-railway-border text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-railway-orange"
              />
            </div>

            {/* Department + Urgency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Department)}
                  className="w-full px-3 py-2 rounded-xl bg-railway-card border border-railway-border text-xs text-white focus:outline-none focus:ring-1 focus:ring-railway-orange cursor-pointer"
                >
                  <option value="Engineering">Engineering (Track / Civil)</option>
                  <option value="Traction">Traction (OHE / Electrical)</option>
                  <option value="Signal & Telecom">Signal & Telecom (S&T)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Urgency Classification
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                  className="w-full px-3 py-2 rounded-xl bg-railway-card border border-railway-border text-xs text-white focus:outline-none focus:ring-1 focus:ring-railway-orange cursor-pointer"
                >
                  <option value="Emergency">🚨 Emergency (Immediate Safety Hazard)</option>
                  <option value="High">⚠️ High (Within 48-72h)</option>
                  <option value="Medium">⚡ Medium (Scheduled Cyclical)</option>
                  <option value="Routine">🛠️ Routine Preventive Maintenance</option>
                </select>
              </div>
            </div>

            {/* Corridor + Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Railway Corridor Section
                </label>
                <select
                  value={corridor}
                  onChange={(e) => setCorridor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-railway-card border border-railway-border text-xs text-white focus:outline-none focus:ring-1 focus:ring-railway-orange cursor-pointer"
                >
                  {corridors.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Track Kilometer Marker
                </label>
                <input
                  type="text"
                  value={trackKm}
                  onChange={(e) => setTrackKm(e.target.value)}
                  placeholder="e.g., KM 142.4 - 145.0"
                  className="w-full px-3 py-2 rounded-xl bg-railway-card border border-railway-border text-xs text-white focus:outline-none focus:ring-1 focus:ring-railway-orange"
                />
              </div>
            </div>

            {/* Block Type + Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Block Maintenance Type
                </label>
                <input
                  type="text"
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value)}
                  placeholder="e.g., Track Tamping (CSM)"
                  className="w-full px-3 py-2 rounded-xl bg-railway-card border border-railway-border text-xs text-white focus:outline-none focus:ring-1 focus:ring-railway-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Required Duration (Hours): <span className="text-cyan-400 font-mono font-bold">{durationHours} hrs</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.5"
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                  className="w-full accent-railway-orange cursor-pointer mt-2"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>30m</span>
                  <span>2h</span>
                  <span>4h</span>
                  <span>6h</span>
                </div>
              </div>
            </div>

            {/* Deadline + Machine */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Strict Target Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-railway-card border border-railway-border text-xs text-white focus:outline-none focus:ring-1 focus:ring-railway-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Special Machine / Rolling Stock
                </label>
                <input
                  type="text"
                  value={specialMachine}
                  onChange={(e) => setSpecialMachine(e.target.value)}
                  placeholder="e.g., Plasser 09-3X Dynamic Tamper"
                  className="w-full px-3 py-2 rounded-xl bg-railway-card border border-railway-border text-xs text-white focus:outline-none focus:ring-1 focus:ring-railway-orange"
                />
              </div>
            </div>

            {/* Constraint Toggles */}
            <div className="p-3 rounded-xl bg-railway-card border border-railway-border/60 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Operational & Safety Constraints
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ohePowerCut}
                    onChange={(e) => setOhePowerCut(e.target.checked)}
                    className="rounded bg-railway-surface border-railway-border text-railway-orange focus:ring-0"
                  />
                  <span>25kV OHE Power Cut (Traction Isolation)</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Crew Size:</span>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={crewRequired}
                    onChange={(e) => setCrewRequired(parseInt(e.target.value) || 6)}
                    className="w-16 px-2 py-1 rounded bg-railway-surface border border-railway-border text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Live AI Score Estimator Card */}
          <div className="lg:col-span-1 bg-railway-card/90 rounded-2xl border border-cyan-500/40 p-4 flex flex-col justify-between shadow-glow-blue">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-railway-border">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Live Estimator</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300">vXGBoost-1.4</span>
              </div>

              {/* Dynamic Score Badge */}
              <div className="my-4 text-center p-3 rounded-xl bg-railway-surface/90 border border-railway-border">
                <span className="text-[11px] text-slate-400 block mb-1">Calculated Priority Score</span>
                <div className="flex items-center justify-center gap-2">
                  <PriorityBadge score={dynamicAI.finalScore} />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  {dynamicAI.finalScore >= 80 ? '⚠️ High Priority: Auto-queued for Control Clearance' : 'Standard cyclical maintenance allocation'}
                </p>
              </div>

              {/* Risk Factor Breakdown Bars */}
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                    <span>Track Geometry Risk</span>
                    <span className="font-mono text-cyan-300 font-bold">{dynamicAI.trackGeometryRisk}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-railway-surface rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${dynamicAI.trackGeometryRisk}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                    <span>Traffic Volume Index</span>
                    <span className="font-mono text-orange-400 font-bold">{dynamicAI.trafficVolumeIndex}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-railway-surface rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{ width: `${dynamicAI.trafficVolumeIndex}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                    <span>Defect Criticality</span>
                    <span className="font-mono text-rose-400 font-bold">{dynamicAI.defectSeverity}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-railway-surface rounded-full overflow-hidden">
                    <div className="h-full bg-rose-400 rounded-full" style={{ width: `${dynamicAI.defectSeverity}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Recommended Shadow Window */}
              <div className="mt-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>AI Recommended Shadow Window</span>
                </div>
                <div className="font-mono text-white text-sm font-bold">
                  {dynamicAI.recommendedSlot.startTime} – {dynamicAI.recommendedSlot.endTime} hrs
                </div>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">
                  0.0 min passenger train delay (utilizes night freight gap)
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-railway-border mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewRequestModalOpen(false)}
                className="px-3 py-2 rounded-xl bg-railway-surface hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-railway-orange to-amber-600 hover:from-railway-orangeLight hover:to-orange-500 text-white text-xs font-bold shadow-glow-orange flex items-center gap-1.5 transition"
              >
                <Check className="w-4 h-4" />
                <span>Submit & Optimize</span>
              </button>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
};

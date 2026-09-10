import React from 'react';
import { MaintenanceRequest } from '../../types';
import { useApp } from '../../context/AppContext';
import { can } from '../../utils/permissions';
import { 
  X, 
  Sparkles, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Sliders, 
  ShieldCheck, 
  Train, 
  Zap, 
  Users, 
  Gauge 
} from 'lucide-react';
import { PriorityBadge, DepartmentBadge, StatusBadge, UrgencyBadge, SimulatedBadge } from '../common/Badge';

interface RequestDetailModalProps {
  request: MaintenanceRequest | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  onClose,
  onApprove,
  onReject
}) => {
  const { role } = useApp();
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-railway-surface border border-railway-border rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-4 px-6 bg-railway-card border-b border-railway-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Train className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">{request.id}</span>
                <StatusBadge status={request.status} />
                <UrgencyBadge urgency={request.urgency} />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                {request.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SimulatedBadge />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-railway-surface transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-railway-card/80 border border-railway-border/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Department</span>
              <div className="mt-1">
                <DepartmentBadge department={request.department} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-railway-card/80 border border-railway-border/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Section / Track</span>
              <span className="text-xs font-bold text-slate-200 mt-1 block truncate">
                {request.trackKm}
              </span>
              <span className="text-[10px] text-slate-400 truncate block">{request.corridor}</span>
            </div>

            <div className="p-3 rounded-xl bg-railway-card/80 border border-railway-border/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Duration & Deadline</span>
              <span className="text-xs font-bold text-cyan-300 mt-1 block font-mono">
                {request.durationHours} hrs required
              </span>
              <span className="text-[10px] text-slate-400">By {request.deadline}</span>
            </div>

            <div className="p-3 rounded-xl bg-railway-card/80 border border-railway-border/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">AI Priority Score</span>
              <div className="mt-1">
                <PriorityBadge score={request.priorityScore} />
              </div>
            </div>
          </div>

          {/* AI Explainable Reasoning Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-railway-card to-railway-surface border border-cyan-500/40 shadow-glow-blue space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-300">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">AI Multi-Objective Reasoning</h4>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">Confidence: {request.suggestedSlot.confidenceScore}%</span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {request.aiReasoning}
            </p>

            {/* Multi-Dimensional Factor Radar / Bars */}
            <div className="pt-2 border-t border-cyan-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-railway-surface/80 p-2 rounded-lg border border-railway-border">
                <span className="text-[10px] text-slate-400 block">Track Geometry Risk</span>
                <span className="text-sm font-bold font-mono text-cyan-400">{request.priorityBreakdown.trackGeometryRisk}/100</span>
              </div>
              <div className="bg-railway-surface/80 p-2 rounded-lg border border-railway-border">
                <span className="text-[10px] text-slate-400 block">Traffic Volume Index</span>
                <span className="text-sm font-bold font-mono text-orange-400">{request.priorityBreakdown.trafficVolumeIndex}/100</span>
              </div>
              <div className="bg-railway-surface/80 p-2 rounded-lg border border-railway-border">
                <span className="text-[10px] text-slate-400 block">Defect Severity</span>
                <span className="text-sm font-bold font-mono text-rose-400">{request.priorityBreakdown.defectSeverity}/100</span>
              </div>
              <div className="bg-railway-surface/80 p-2 rounded-lg border border-railway-border">
                <span className="text-[10px] text-slate-400 block">Weather Risk</span>
                <span className="text-sm font-bold font-mono text-amber-400">{request.priorityBreakdown.weatherVulnerability}/100</span>
              </div>
            </div>
          </div>

          {/* AI Recommended Block Window */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Optimized Feasible Maintenance Slot</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Punctuality Score: {request.suggestedSlot.punctualityScore}%</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">Recommended Time Window:</span>
                <div className="text-sm font-mono font-bold text-white mt-0.5">
                  {request.suggestedSlot.date} | {request.suggestedSlot.startTime} – {request.suggestedSlot.endTime} hrs
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px]">Shadow Block Synergy:</span>
                <div className="text-xs font-semibold text-cyan-300 mt-0.5">
                  {request.suggestedSlot.shadowBlockWithTrain || 'Autonomous Natural Gap'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px]">Passenger Delay:</span>
                <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                  +{request.suggestedSlot.trainDelayMinutes} min
                </div>
              </div>
            </div>
          </div>

          {/* Operational Constraints Checklist */}
          <div className="p-4 rounded-xl bg-railway-card/80 border border-railway-border/70 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Field Constraints & Resource Allocation
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>OHE Power Cut: <strong>{request.constraints.ohePowerCutRequired ? 'Required (25kV Isolation)' : 'Not Required'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>Speed Restriction: <strong>{request.constraints.speedRestrictionTsr}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Crew Required: <strong>{request.constraints.crewRequired} personnel</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Train className="w-4 h-4 text-orange-400" />
                <span>Special Machine: <strong>{request.constraints.specialMachine}</strong></span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 bg-railway-card border-t border-railway-border flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Submitted by: <strong className="text-slate-200">{request.submittedBy}</strong>
          </span>

          <div className="flex items-center gap-2">
            {can(role, 'canApprove') && request.status !== 'Approved' && (
              <button
                onClick={() => {
                  onApprove(request.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-green flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Block</span>
              </button>
            )}

            {can(role, 'canApprove') && request.status !== 'Rejected' && (
              <button
                onClick={() => {
                  onReject(request.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-300 text-xs font-bold transition cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-railway-surface hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

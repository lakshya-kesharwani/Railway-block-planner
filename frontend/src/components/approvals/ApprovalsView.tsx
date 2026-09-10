import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MaintenanceRequest } from '../../types';
import { 
  CheckCheck, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Train, 
  Zap, 
  Gauge, 
  Users,
  Layers,
  ArrowRight
} from 'lucide-react';
import { PriorityBadge, DepartmentBadge, StatusBadge, SimulatedBadge } from '../common/Badge';

export const ApprovalsView: React.FC = () => {
  const { requests, approveRequest, rejectRequest, modifyRequestSlot, showToast } = useApp();

  const [selectedModifyReq, setSelectedModifyReq] = useState<MaintenanceRequest | null>(null);
  const [modifyStartHour, setModifyStartHour] = useState<number>(1.5);
  const [modifyEndHour, setModifyEndHour] = useState<number>(4.5);
  const [rejectModalReq, setRejectModalReq] = useState<MaintenanceRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('High passenger train density on morning section');

  // Filter requests that require control office approval
  const pendingApprovals = requests.filter(r => r.status === 'Pending' || r.status === 'In-Review');

  const handleBatchApprove = () => {
    pendingApprovals.forEach((req) => {
      approveRequest(req.id, 'Batch-approved via Control Office AI Clearance');
    });
    showToast({
      type: 'success',
      title: 'Batch Approval Complete',
      message: `${pendingApprovals.length} maintenance blocks cleared for track execution.`
    });
  };

  const handleOpenModify = (req: MaintenanceRequest) => {
    setSelectedModifyReq(req);
    setModifyStartHour(req.suggestedSlot.startHour);
    setModifyEndHour(req.suggestedSlot.endHour);
  };

  const handleSaveModify = () => {
    if (selectedModifyReq) {
      modifyRequestSlot(selectedModifyReq.id, modifyStartHour, modifyEndHour);
      approveRequest(selectedModifyReq.id, `Modified slot (${modifyStartHour}:00 - ${modifyEndHour}:00) approved`);
      setSelectedModifyReq(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
              <CheckCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Control Office Clearance & Block Approval Desk
            </h2>
            <SimulatedBadge text="Section Controller Clearance" />
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Review AI-recommended corridor maintenance slots with multi-objective constraint compliance and punctuality impact scores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingApprovals.length > 0 && (
            <button
              onClick={handleBatchApprove}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-glow-green flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Batch Approve All ({pendingApprovals.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* List of Pending Approval Cards */}
      <div className="space-y-4">
        {pendingApprovals.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl border border-railway-border text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">All Requisitions Cleared!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No pending maintenance block requisitions require Control Office clearance at this time. All corridors operating on approved schedules.
            </p>
          </div>
        ) : (
          pendingApprovals.map((req) => (
            <div
              key={req.id}
              className="glass-panel p-5 rounded-2xl border border-railway-border/80 hover:border-railway-border transition-all shadow-xl space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-railway-border/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-railway-surface border border-railway-border text-slate-300">
                    <Train className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-300">{req.id}</span>
                      <DepartmentBadge department={req.department} />
                      <StatusBadge status={req.status} />
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
                      {req.title}
                    </h3>
                  </div>
                </div>

                {/* Priority Badge */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">AI Priority</span>
                    <PriorityBadge score={req.priorityScore} />
                  </div>
                </div>
              </div>

              {/* Grid: AI Recommended Slot (Left) + AI Reasoning & Constraints (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Left: Recommended Slot Details */}
                <div className="p-4 rounded-xl bg-railway-surface/80 border border-railway-border space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-railway-border/50">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        AI Recommended Feasible Slot
                      </span>
                      <span className="font-mono text-cyan-300 font-semibold text-[11px]">
                        Confidence: {req.suggestedSlot.confidenceScore}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Proposed Window</span>
                        <span className="text-sm font-bold font-mono text-white">
                          {req.suggestedSlot.startTime} – {req.suggestedSlot.endTime} hrs
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">({req.durationHours} hrs duration)</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">Section Location</span>
                        <span className="text-xs font-bold text-slate-200 block truncate">
                          {req.trackKm}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">{req.corridor}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">Passenger Delay</span>
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          +{req.suggestedSlot.trainDelayMinutes} min (Zero Delay)
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">Shadow Synergy</span>
                        <span className="text-xs font-bold text-cyan-300 truncate block">
                          {req.suggestedSlot.shadowBlockWithTrain}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resource constraints pill */}
                  <div className="pt-2 border-t border-railway-border/50 flex flex-wrap gap-2 text-[10px] text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      ⚡ OHE: {req.constraints.ohePowerCutRequired ? '25kV Isolation' : 'No Cut'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      🚦 TSR: {req.constraints.speedRestrictionTsr}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      👥 Crew: {req.constraints.crewRequired}
                    </span>
                  </div>
                </div>

                {/* Right: AI Multi-Objective Reasoning & Constraints Checked */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/20 via-railway-card to-railway-surface border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-railway-border/40">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>AI Multi-Objective Reasoning</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Punctuality Score: {req.suggestedSlot.punctualityScore}%</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {req.aiReasoning}
                  </p>

                  {/* Constraint verification checklist */}
                  <div className="pt-2 border-t border-railway-border/40 space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Verified: No high-speed passenger train headway violation (&gt;15 min buffer)</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Verified: Substation feeder isolation schedule locked with Traction SCADA</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Verified: Machine rake transit window path cleared on UP line</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-railway-border/60 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400 font-mono">
                  Deadline: <strong className="text-slate-200">{req.deadline}</strong> | Requisitioner: <strong className="text-slate-200">{req.submittedBy}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModify(req)}
                    className="px-3.5 py-1.5 rounded-xl bg-railway-surface hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modify Window</span>
                  </button>

                  <button
                    onClick={() => setRejectModalReq(req)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => approveRequest(req.id)}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-glow-green flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve Slot</span>
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Modify Window Modal */}
      {selectedModifyReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-railway-surface border border-railway-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-railway-border">
              <h3 className="text-sm font-bold text-white">Modify Maintenance Window Slot</h3>
              <button onClick={() => setSelectedModifyReq(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Adjusting allocated time for <strong className="text-cyan-300">{selectedModifyReq.id}</strong> ({selectedModifyReq.trackKm})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  Start Hour: <span className="text-cyan-300 font-mono font-bold">{modifyStartHour}:00 hrs</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={modifyStartHour}
                  onChange={(e) => {
                    const start = parseFloat(e.target.value);
                    setModifyStartHour(start);
                    if (start >= modifyEndHour) setModifyEndHour(start + selectedModifyReq.durationHours);
                  }}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  End Hour: <span className="text-cyan-300 font-mono font-bold">{modifyEndHour}:00 hrs</span>
                </label>
                <input
                  type="range"
                  min={modifyStartHour + 0.5}
                  max="24"
                  step="0.5"
                  value={modifyEndHour}
                  onChange={(e) => setModifyEndHour(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-railway-border">
              <button
                onClick={() => setSelectedModifyReq(null)}
                className="px-3 py-1.5 rounded-lg bg-railway-card text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModify}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Apply & Approve Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-railway-surface border border-railway-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-railway-border">
              <h3 className="text-sm font-bold text-rose-400">Reject / Defer Block Request</h3>
              <button onClick={() => setRejectModalReq(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Provide feedback reason for rejecting <strong className="text-white">{rejectModalReq.id}</strong>:
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-railway-card border border-railway-border text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-railway-border">
              <button
                onClick={() => setRejectModalReq(null)}
                className="px-3 py-1.5 rounded-lg bg-railway-card text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  rejectRequest(rejectModalReq.id, rejectReason);
                  setRejectModalReq(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

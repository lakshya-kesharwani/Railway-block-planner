import React from 'react';
import { useApp } from '../../context/AppContext';
import { Train, AlertTriangle, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { SimulatedBadge } from '../common/Badge';

export const CorridorLiveWidget: React.FC = () => {
  const { corridors, setActiveView } = useApp();

  return (
    <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Train className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Active Railway Corridors
            </h3>
            <p className="text-xs text-slate-400">Live section throughput & block readiness</p>
          </div>
        </div>

        <button
          onClick={() => setActiveView('gantt')}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer transition"
        >
          <span>Open Gantt View</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {corridors.map((c) => {
          let statusBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
          if (c.status === 'Congested') statusBg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
          if (c.status === 'Maintenance Active') statusBg = 'bg-blue-500/10 text-blue-400 border-blue-500/30';

          return (
            <div
              key={c.id}
              className="p-3 rounded-xl bg-railway-surface/80 border border-railway-border/70 hover:border-railway-border transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{c.code}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBg}`}>
                    {c.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{c.name}</h4>
              </div>

              <div className="mt-3 pt-2 border-t border-railway-border/40 grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-500 block">Length</span>
                  <span className="text-slate-200 font-bold">{c.sectionLengthKm} km</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Max Speed</span>
                  <span className="text-cyan-300 font-bold">{c.maxSpeedKmph} km/h</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Trains/Day</span>
                  <span className="text-orange-400 font-bold">{c.dailyTrainDensity}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const RecentActivityFeed: React.FC = () => {
  const activities = [
    {
      id: 'act-1',
      title: 'AI Optimization Algorithm executed for BSP-DURG UP',
      detail: 'Generated conflict-free shadow slot (01:30 - 04:30) for Track USFD defect #REQ-101',
      time: '12m ago',
      icon: ShieldCheck,
      color: 'text-emerald-400 bg-emerald-500/20'
    },
    {
      id: 'act-2',
      title: 'Traction OHE Power Cut Block Requested',
      detail: 'Submitted by DEE/TRD for Neutral Section Insulator #4 (KM 188.0)',
      time: '34m ago',
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/20'
    },
    {
      id: 'act-3',
      title: 'Multi-Department Integrated Block Combined',
      detail: 'Engineering tamping + S&T track circuit co-scheduled on Down line, saving 2.5 hours corridor downtime',
      time: '1h ago',
      icon: Train,
      color: 'text-purple-400 bg-purple-500/20'
    }
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white tracking-tight">
          Recent Optimization Events & Audit Log
        </h3>
        <SimulatedBadge text="Real-time Dispatch Stream" />
      </div>

      <div className="space-y-2.5">
        {activities.map((act) => {
          const Icon = act.icon;
          return (
            <div
              key={act.id}
              className="p-2.5 rounded-xl bg-railway-surface/60 border border-railway-border/50 flex items-start gap-3"
            >
              <div className={`p-2 rounded-lg ${act.color} shrink-0 mt-0.5`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{act.title}</h4>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">{act.time}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{act.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

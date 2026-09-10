import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Train, 
  Calendar, 
  FileSpreadsheet,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { CORRIDOR_HEATMAP_DATA, DEPARTMENT_UTILIZATION_DATA } from '../../data/mockData';
import { SimulatedBadge } from '../common/Badge';

export const ReportsView: React.FC = () => {
  const { requests, stats } = useApp();
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const delayTrendData = [
    { month: 'Apr', manualDelayMins: 420, aiDelayMins: 45, hoursGranted: 110 },
    { month: 'May', manualDelayMins: 480, aiDelayMins: 38, hoursGranted: 125 },
    { month: 'Jun', manualDelayMins: 510, aiDelayMins: 30, hoursGranted: 140 },
    { month: 'Jul', manualDelayMins: 590, aiDelayMins: 25, hoursGranted: 155 },
    { month: 'Aug', manualDelayMins: 620, aiDelayMins: 12, hoursGranted: 178 },
  ];

  const handleExportCSV = () => {
    // Generate actual CSV content
    const headers = ['RequestID', 'Department', 'Title', 'Corridor', 'TrackKM', 'DurationHours', 'AIPriorityScore', 'Status', 'SuggestedSlot'];
    const rows = requests.map(r => [
      r.id,
      r.department,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.corridor}"`,
      `"${r.trackKm}"`,
      r.durationHours,
      r.priorityScore,
      r.status,
      `"${r.suggestedSlot.startTime}-${r.suggestedSlot.endTime}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `railway_maintenance_blocks_report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Operational Intelligence & Corridor Efficiency Reports
            </h2>
            <SimulatedBadge text="Analytics Engine" />
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Longitudinal telemetry evaluating passenger punctuality preservation, multi-department co-scheduling synergies, and asset backlog clearance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-glow-blue flex items-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{downloadSuccess ? 'Export Complete (CSV)' : 'Export Corridor Report (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-railway-border/80">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Block Hours Delivered</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-mono text-white">708.0</span>
            <span className="text-xs text-emerald-400 font-semibold">+18.5% YoY</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Granted under shadow windows</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-railway-border/80">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Passenger Delay Avoided</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-mono text-cyan-400">2,620</span>
            <span className="text-xs text-slate-400">minutes saved</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Zero passenger train cancellations</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-railway-border/80">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Cross-Dept Synergy Ratio</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-mono text-purple-400">84.2%</span>
            <span className="text-xs text-emerald-400 font-semibold">+32% efficiency</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Co-scheduled OHE + Track Tamping</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-railway-border/80">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Section Punctuality Index</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold font-mono text-emerald-400">98.4%</span>
            <span className="text-xs text-slate-400">Section average</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across 4 trunk quad corridors</p>
        </div>
      </div>

      {/* Main Longitudinal Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Delay Minutes Avoided Trend */}
        <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-railway-border">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Passenger Delay Reduction Trend
              </h3>
              <p className="text-xs text-slate-400">Manual Planning Delay vs. AI-Assisted Optimization Delay</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
              -94% Delay Reduction
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={delayTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="manualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-red)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-red)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--chart-grid)' }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--chart-grid)' }} unit="m" />
                <Tooltip />
                <Area type="monotone" name="Manual Delay (Mins)" dataKey="manualDelayMins" stroke="var(--accent-red)" fillOpacity={1} fill="url(#manualGrad)" />
                <Area type="monotone" name="AI-Optimized Delay (Mins)" dataKey="aiDelayMins" stroke="var(--accent-green)" fillOpacity={1} fill="url(#aiGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Corridor Hourly Occupancy Heatmap Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-railway-border">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Corridor Block Density Across Time Slots
              </h3>
              <p className="text-xs text-slate-400">Peak night window concentration vs daytime passenger traffic</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/40">
              Optimal Shadow Curve
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CORRIDOR_HEATMAP_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="timeSlot" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={{ stroke: 'var(--chart-grid)' }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--chart-grid)' }} unit="%" />
                <Tooltip />
                <Bar name="BSP-DURG UP" dataKey="BSP_DURG_UP" fill="var(--accent-blue)" radius={[2, 2, 0, 0]} />
                <Bar name="BSP-DURG DN" dataKey="BSP_DURG_DN" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                <Bar name="R-MNDH" dataKey="R_MNDH" fill="var(--accent-orange)" radius={[2, 2, 0, 0]} />
                <Bar name="R-LAE" dataKey="R_LAE" fill="var(--accent-green)" radius={[2, 2, 0, 0]} />
                <Bar name="R-AVP" dataKey="R_AVP" fill="var(--accent-purple)" radius={[2, 2, 0, 0]} />
                <Bar name="AVP-RIM" dataKey="AVP_RIM" fill="#ec4899" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Department Synergy Audit Table */}
      <div className="glass-panel rounded-2xl border border-railway-border/80 overflow-hidden">
        <div className="p-4 bg-railway-card border-b border-railway-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Departmental Efficiency & Co-scheduling Breakdown</h3>
          <span className="text-xs text-slate-400 font-mono">Cycle 2026-Q3</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-railway-surface border-b border-railway-border text-slate-400 uppercase text-[10px] font-semibold">
                <th className="py-3 px-4">Department Unit</th>
                <th className="py-3 px-4">Blocks Requested</th>
                <th className="py-3 px-4">Hours Granted</th>
                <th className="py-3 px-4">Fulfillment %</th>
                <th className="py-3 px-4">Average Delay Impact</th>
                <th className="py-3 px-4 text-right">Synergy Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-railway-border/50 text-slate-300">
              {DEPARTMENT_UTILIZATION_DATA.map((d) => (
                <tr key={d.department} className="hover:bg-railway-cardHover/60 transition">
                  <td className="py-3 px-4 font-semibold text-white">{d.department}</td>
                  <td className="py-3 px-4 font-mono">{d.requestedHours} hrs</td>
                  <td className="py-3 px-4 font-mono text-cyan-300 font-bold">{d.allocatedHours} hrs</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">{d.efficiencyPct}%</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">0.0 min (On-Time)</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Optimal (Grade A)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

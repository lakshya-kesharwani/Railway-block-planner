import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { DEPARTMENT_UTILIZATION_DATA } from '../../data/mockData';
import { BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-railway-card p-3 rounded-xl border border-railway-border shadow-2xl text-xs font-sans">
        <p className="font-bold text-white mb-1.5 border-b border-railway-border/60 pb-1">{label}</p>
        <div className="space-y-1 font-mono">
          <p className="text-blue-400">Requested Hours: <strong className="text-white">{data.requestedHours} hrs</strong></p>
          <p className="text-orange-400">Allocated (AI): <strong className="text-white">{data.allocatedHours} hrs</strong></p>
          <p className="text-emerald-400">Efficiency Rate: <strong className="text-white">{data.efficiencyPct}%</strong></p>
          <p className="text-purple-300">Conflicts Avoided: <strong className="text-white">{data.savedConflicts}</strong></p>
        </div>
      </div>
    );
  }
  return null;
};

export const DepartmentUtilizationChart: React.FC = () => {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Block Utilization by Department
            </h3>
            <p className="text-xs text-slate-400">Requested vs. AI-Optimized Allocated Block Hours</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-railway-surface px-2.5 py-1 rounded-lg border border-railway-border/60">
          <span>AI Gain: <strong className="text-emerald-400 font-bold">+28.4 hrs/wk</strong></span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={DEPARTMENT_UTILIZATION_DATA}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis 
              dataKey="department" 
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-grid)' }}
            />
            <YAxis 
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-grid)' }}
              unit="h"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
            <Bar 
              name="Requested Block Hours" 
              dataKey="requestedHours" 
              fill="var(--accent-blue)" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              name="Granted (Optimized Hours)" 
              dataKey="allocatedHours" 
              fill="var(--accent-orange)" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

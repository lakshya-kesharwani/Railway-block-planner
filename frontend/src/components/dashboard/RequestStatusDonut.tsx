import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { STATUS_DONUT_DATA } from '../../data/mockData';
import { PieChart as PieChartIcon } from 'lucide-react';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-railway-card p-2.5 rounded-xl border border-railway-border shadow-2xl text-xs font-sans">
        <p className="font-bold text-white mb-1 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }}></span>
          {data.name}
        </p>
        <p className="font-mono text-slate-300">
          Count: <strong className="text-white font-bold">{data.value}</strong> requests
        </p>
      </div>
    );
  }
  return null;
};

export const RequestStatusDonut: React.FC = () => {
  const total = STATUS_DONUT_DATA.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-railway-border/80 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Request Status Distribution
            </h3>
            <p className="text-xs text-slate-400">Current Lifecycle Pipeline</p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-slate-400 bg-railway-surface px-2 py-0.5 rounded border border-railway-border/60">
          Total: <strong className="text-white">{total}</strong>
        </span>
      </div>

      <div className="h-48 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={STATUS_DONUT_DATA}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={4}
              dataKey="value"
            >
              {STATUS_DONUT_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--bg-secondary)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label inside donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-extrabold font-mono text-white tracking-tight">
            {total}
          </span>
          <span className="text-[10px] uppercase font-semibold text-slate-400">
            Requests
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-railway-border/50">
        {STATUS_DONUT_DATA.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-railway-surface/60 border border-railway-border/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-slate-300 text-[11px]">{item.name}</span>
            </div>
            <span className="font-mono font-bold text-white text-[11px]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

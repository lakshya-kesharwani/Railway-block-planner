import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subValue?: string;
  delta?: {
    value: string;
    isPositive: boolean;
    text: string;
  };
  icon: LucideIcon;
  colorScheme: 'orange' | 'red' | 'blue' | 'green' | 'purple';
  badge?: string;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subValue,
  delta,
  icon: Icon,
  colorScheme,
  badge,
  onClick
}) => {
  const colorMap = {
    orange: {
      border: 'border-orange-500/30 hover:border-orange-500/60',
      bg: 'from-orange-950/20 to-railway-card',
      iconBg: 'bg-orange-500/20 text-orange-400',
      glow: 'group-hover:shadow-glow-orange',
      text: 'text-orange-400'
    },
    red: {
      border: 'border-rose-500/40 hover:border-rose-500/70',
      bg: 'from-rose-950/30 to-railway-card',
      iconBg: 'bg-rose-500/20 text-rose-400 shadow-glow-red animate-pulse-subtle',
      glow: 'group-hover:shadow-glow-red',
      text: 'text-rose-400'
    },
    blue: {
      border: 'border-blue-500/30 hover:border-blue-500/60',
      bg: 'from-blue-950/20 to-railway-card',
      iconBg: 'bg-blue-500/20 text-blue-400',
      glow: 'group-hover:shadow-glow-blue',
      text: 'text-blue-400'
    },
    green: {
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      bg: 'from-emerald-950/20 to-railway-card',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      glow: 'group-hover:shadow-glow-green',
      text: 'text-emerald-400'
    },
    purple: {
      border: 'border-purple-500/30 hover:border-purple-500/60',
      bg: 'from-purple-950/20 to-railway-card',
      iconBg: 'bg-purple-500/20 text-purple-400',
      glow: 'group-hover:shadow-lg',
      text: 'text-purple-400'
    }
  };

  const scheme = colorMap[colorScheme];

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-4 rounded-2xl border ${scheme.border} bg-gradient-to-br ${scheme.bg} transition-all duration-200 group relative overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
            {badge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl lg:text-3xl font-extrabold font-mono text-white tracking-tight">
              {value}
            </span>
            {subValue && (
              <span className="text-xs text-slate-400 font-medium">{subValue}</span>
            )}
          </div>
        </div>

        <div className={`p-2.5 rounded-xl ${scheme.iconBg} transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {delta && (
        <div className="mt-3 pt-2.5 border-t border-railway-border/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold font-mono ${
                delta.isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {delta.value}
            </span>
            <span className="text-[11px] text-slate-400">{delta.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

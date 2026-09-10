import React from 'react';
import { Department, RequestStatus, UrgencyLevel } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'outline';
  className?: string;
}

export const PriorityBadge: React.FC<{ score: number; showLabel?: boolean }> = ({ score, showLabel = true }) => {
  let bgClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  let dotClass = 'bg-emerald-400';
  let tier = 'Low Risk';

  if (score >= 80) {
    bgClass = 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-glow-red animate-pulse-subtle';
    dotClass = 'bg-rose-500';
    tier = 'High Risk';
  } else if (score >= 50) {
    bgClass = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
    dotClass = 'bg-amber-400';
    tier = 'Moderate Risk';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bgClass}`}>
      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
      <span className="font-mono font-bold">{score}</span>
      {showLabel && <span className="opacity-90 font-normal text-[10px] tracking-wide uppercase">({tier})</span>}
    </span>
  );
};

export const DepartmentBadge: React.FC<{ department: Department | string }> = ({ department }) => {
  let color = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  let icon = '🚆';

  if (department === 'Traction' || department.includes('Traction')) {
    color = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    icon = '⚡';
  } else if (department === 'Signal & Telecom' || department.includes('Signal')) {
    color = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    icon = '📡';
  } else if (department === 'Cross-Department' || department.includes('Integrated')) {
    color = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    icon = '🔗';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${color}`}>
      <span>{icon}</span>
      <span>{department}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: RequestStatus | string }> = ({ status }) => {
  let styles = 'bg-slate-700/50 text-slate-300 border-slate-600/50';

  switch (status) {
    case 'Approved':
      styles = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      break;
    case 'Pending':
      styles = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      break;
    case 'In-Review':
      styles = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      break;
    case 'Rejected':
      styles = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      break;
    case 'Scheduled':
      styles = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      {status}
    </span>
  );
};

export const UrgencyBadge: React.FC<{ urgency: UrgencyLevel | string }> = ({ urgency }) => {
  let styles = 'bg-slate-700/40 text-slate-300';
  if (urgency === 'Emergency') styles = 'bg-rose-600/30 text-rose-200 border border-rose-500/50';
  if (urgency === 'High') styles = 'bg-orange-600/30 text-orange-200 border border-orange-500/50';
  if (urgency === 'Medium') styles = 'bg-amber-600/20 text-amber-200 border border-amber-500/40';
  if (urgency === 'Routine') styles = 'bg-slate-700/50 text-slate-300 border border-slate-600/30';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${styles}`}>
      {urgency}
    </span>
  );
};

export const SimulatedBadge: React.FC<{ text?: string; className?: string }> = ({ 
  text = "Simulated Prototype Data", 
  className = "" 
}) => {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-railway-surface/90 text-railway-muted border border-railway-border/60 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 animate-pulse"></span>
      {text}
    </span>
  );
};

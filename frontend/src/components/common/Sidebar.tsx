import React from 'react';
import { useApp } from '../../context/AppContext';
import { can } from '../../utils/permissions';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Cpu, 
  CalendarRange, 
  CheckCheck, 
  BarChart3, 
  Settings,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, stats, role } = useApp();

  const allNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Home',
      icon: LayoutDashboard,
      badge: null,
      badgeType: '',
      pulse: false,
      color: 'text-blue-400'
    },
    {
      id: 'requests',
      label: 'Maintenance Requests',
      icon: ClipboardList,
      badge: stats.pendingCount > 0 ? `${stats.pendingCount}` : null,
      badgeType: 'amber',
      pulse: false,
      color: 'text-amber-400'
    },
    {
      id: 'pipeline',
      label: 'AI vs Optimization',
      icon: Cpu,
      badge: 'Core Engine',
      badgeType: 'cyan',
      pulse: false,
      color: 'text-cyan-400'
    },
    {
      id: 'gantt',
      label: 'Schedule & Map',
      icon: CalendarRange,
      badge: stats.conflictCount > 0 ? `${stats.conflictCount} Conflict` : 'Live',
      badgeType: stats.conflictCount > 0 ? 'rose' : 'emerald',
      pulse: stats.conflictCount > 0,
      color: 'text-emerald-400'
    },
    {
      id: 'approvals',
      label: 'Approvals (Control Office)',
      icon: CheckCheck,
      badge: stats.pendingCount > 0 ? `${stats.pendingCount} Pending` : null,
      badgeType: 'orange',
      pulse: false,
      color: 'text-orange-400'
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      badge: null,
      badgeType: '',
      pulse: false,
      color: 'text-indigo-400'
    },
    {
      id: 'settings',
      label: 'Settings & Config',
      icon: Settings,
      badge: null,
      badgeType: '',
      pulse: false,
      color: 'text-slate-400'
    }
  ];

  const navItems = allNavItems.filter((item) => {
    if (item.id === 'pipeline') return can(role, 'canOptimize');
    if (item.id === 'approvals') return can(role, 'canApprove');
    if (item.id === 'settings') return can(role, 'canAccessSettings');
    return true;
  });

  return (
    <aside className="w-72 bg-railway-surface/90 border-r border-railway-border/80 flex flex-col justify-between shrink-0 h-full overflow-y-auto">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Navigation Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-railway-orange/20 to-railway-card text-white border border-railway-orange/40 shadow-lg shadow-orange-950/20'
                  : 'text-slate-300 hover:bg-railway-card hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-railway-orange text-white' : 'bg-railway-card text-slate-400 group-hover:text-slate-200'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate text-xs font-medium">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <span
                    className={`sidebar-badge sidebar-badge-${item.badgeType} ${
                      item.pulse ? 'animate-pulse' : ''
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-railway-orange shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Corridor Health Status Summary Box */}
      <div className="p-3.5 m-3 rounded-xl bg-railway-card/80 border border-railway-border/80 text-xs">
        <div className="flex items-center justify-between text-slate-300 mb-2.5">
          <span className="font-semibold text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            AI Engine Telemetry
          </span>
          <span className="sidebar-badge sidebar-badge-cyan font-mono text-[10px] px-2 py-0.5">
            99.8% Fit
          </span>
        </div>

        <div className="space-y-2 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span>Punctuality Index:</span>
            <span className="sidebar-badge sidebar-badge-emerald font-mono text-[10px] px-2 py-0.5">98.4%</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Delay Mins Saved:</span>
            <span className="sidebar-badge sidebar-badge-cyan font-mono text-[10px] px-2 py-0.5">420 min</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Shadow Block Ratio:</span>
            <span className="sidebar-badge sidebar-badge-amber font-mono text-[10px] px-2 py-0.5">78.2%</span>
          </div>
        </div>

        {stats.conflictCount > 0 && (
          <div className="mt-2.5 pt-2 border-t border-railway-border/60">
            <div className="sidebar-badge sidebar-badge-rose w-full justify-start gap-1.5 py-1 px-2.5 rounded-lg text-left">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate text-[10.5px]">1 Overlap requires slot shift</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

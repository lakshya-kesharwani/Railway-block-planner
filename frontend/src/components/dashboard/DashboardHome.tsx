import React from 'react';
import { useApp } from '../../context/AppContext';
import { KPICard } from './KPICard';
import { DepartmentUtilizationChart } from './DepartmentUtilizationChart';
import { RequestStatusDonut } from './RequestStatusDonut';
import { CorridorLiveWidget, RecentActivityFeed } from './CorridorLiveWidget';
import { 
  ClipboardList, 
  AlertOctagon, 
  CheckCircle2, 
  Gauge, 
  PlusCircle, 
  Sparkles, 
  CalendarRange, 
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

export const DashboardHome: React.FC = () => {
  const { 
    stats, 
    role, 
    setActiveView, 
    setIsNewRequestModalOpen, 
    autoResolveConflicts,
    isAutoResolving 
  } = useApp();

  return (
    <div className="space-y-6">
      
      {/* Role Banner / Contextual Announcement */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-railway-card via-railway-surface to-railway-card border border-railway-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-railway-orange animate-pulse"></span>
            <h2 className="text-base font-bold text-white tracking-tight">
              AI Block Optimization Center — {role.toUpperCase()} CONSOLE
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Coordinating multi-department maintenance windows (Civil, Traction OHE, S&T) with zero passenger train cancellations using Mixed-Integer Linear Programming & XGBoost Risk Priority Scoring.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsNewRequestModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-railway-orange to-amber-600 hover:from-railway-orangeLight hover:to-orange-500 text-white text-xs font-bold shadow-glow-orange flex items-center gap-1.5 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Request</span>
          </button>

          <button
            onClick={() => setActiveView('pipeline')}
            className="px-3 py-2 rounded-xl bg-railway-card hover:bg-railway-cardHover border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI vs Optimization</span>
          </button>

          <button
            onClick={() => setActiveView('gantt')}
            className="px-3 py-2 rounded-xl bg-railway-card hover:bg-railway-cardHover border border-railway-border text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <CalendarRange className="w-4 h-4 text-emerald-400" />
            <span>Gantt Chart</span>
          </button>
        </div>
      </div>

      {/* Top Row: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pending Requests"
          value={stats.pendingCount}
          subValue="requiring review"
          delta={{
            value: "+12%",
            isPositive: false,
            text: "vs 7-day average"
          }}
          icon={ClipboardList}
          colorScheme="orange"
          badge="Awaiting Slot"
          onClick={() => setActiveView('requests')}
        />

        <KPICard
          title="High-Risk Requests"
          value={stats.highRiskCount}
          subValue="AI Priority > 80"
          delta={{
            value: "Critical",
            isPositive: false,
            text: "USFD flaw & OHE"
          }}
          icon={AlertOctagon}
          colorScheme="red"
          badge="Urgent"
          onClick={() => setActiveView('requests')}
        />

        <KPICard
          title="Blocks Approved Today"
          value={stats.approvedTodayCount}
          subValue="28.5 total block hrs"
          delta={{
            value: "0.0 min",
            isPositive: true,
            text: "passenger delay"
          }}
          icon={CheckCircle2}
          colorScheme="green"
          badge="Conflict-Free"
          onClick={() => setActiveView('approvals')}
        />

        <KPICard
          title="Corridor Utilization"
          value={`${stats.corridorUtilization}%`}
          subValue="Target: 85.0%"
          delta={{
            value: "+4.2%",
            isPositive: true,
            text: "shadow slot efficiency"
          }}
          icon={Gauge}
          colorScheme="blue"
          badge="Optimal"
          onClick={() => setActiveView('reports')}
        />
      </div>

      {/* Middle Row: Bar Chart + Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DepartmentUtilizationChart />
        </div>
        <div className="lg:col-span-1">
          <RequestStatusDonut />
        </div>
      </div>

      {/* Bottom Row: Active Corridors + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CorridorLiveWidget />
        </div>
        <div className="lg:col-span-1">
          <RecentActivityFeed />
        </div>
      </div>

    </div>
  );
};

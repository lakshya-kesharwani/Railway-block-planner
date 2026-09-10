import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { APP_NAME } from '../../constants/appConfig';
import { SCENARIO_PRESETS } from '../../data/mockData';
import { 
  Train, 
  ShieldAlert, 
  Bell, 
  Clock, 
  Activity, 
  Wrench, 
  Zap, 
  Radio, 
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Layers,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  ArrowLeft
} from 'lucide-react';
import { SimulatedBadge } from './Badge';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { 
    role, 
    stats, 
    notifications, 
    dismissNotification, 
    selectedScenario, 
    setSelectedScenario,
    autoResolveConflicts,
    isAutoResolving,
    theme,
    toggleTheme,
    setActiveView
  } = useApp();

  const handleBackToSchedule = () => {
    setActiveView('gantt');
    navigate('/schedule-and-map');
  };

  const [timeStr, setTimeStr] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showScenarioMenu, setShowScenarioMenu] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const rolesConfig: { id: Role; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    { 
      id: 'control', 
      label: 'Control Office', 
      icon: <Activity className="w-4 h-4" />, 
      color: 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-500/15 border-orange-300 dark:border-orange-500/40',
      desc: 'Section Controller / Chief Traffic Dispatcher'
    },
    { 
      id: 'engineering', 
      label: 'Engineering', 
      icon: <Wrench className="w-4 h-4" />, 
      color: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/15 border-blue-300 dark:border-blue-500/40',
      desc: 'Civil / Permanent Way Track Maintenance'
    },
    { 
      id: 'traction', 
      label: 'Traction (OHE)', 
      icon: <Zap className="w-4 h-4" />, 
      color: 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/40',
      desc: 'Electrical / 25kV Traction Distribution'
    },
    { 
      id: 'signal', 
      label: 'Signal & Telecom', 
      icon: <Radio className="w-4 h-4" />, 
      color: 'text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/40',
      desc: 'S&T Interlocking & Electronic Points'
    },
    { 
      id: 'admin', 
      label: 'Admin', 
      icon: <SlidersHorizontal className="w-4 h-4" />, 
      color: 'text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/15 border-purple-300 dark:border-purple-500/40',
      desc: 'AI Calibration & System Operations'
    }
  ];

  const currentRoleConfig = rolesConfig.find(r => r.id === role) || rolesConfig[0];

  return (
    <header className="sticky top-0 z-40 shrink-0 bg-railway-surface/95 backdrop-blur-md border-b border-railway-border/80 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Brand & Live Clock */}
        <div className="flex items-center gap-4">
          {location.pathname === '/what-if-simulator' && (
            <button
              type="button"
              onClick={handleBackToSchedule}
              className="px-3 py-1.5 rounded-xl bg-railway-card hover:bg-slate-800 border border-railway-border text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer shadow-md"
              title="Return to Schedule & Map"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>← Back to Schedule &amp; Map</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-railway-orange to-amber-600 flex items-center justify-center shadow-glow-orange ring-1 ring-orange-400/50">
              <Train className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base lg:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-railway-orangeLight bg-clip-text text-transparent">
                  {APP_NAME}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-railway-orange/20 text-railway-orangeLight border border-railway-orange/30">
                  OPTIMIZER v2.4
                </span>
              </div>
              <p className="text-[11px] text-railway-muted hidden md:block">
                AI-Assisted Corridor Maintenance Block Optimization & Conflict Resolution
              </p>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-railway-bg/80 border border-railway-border/60">
            <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs font-mono font-semibold text-cyan-800 dark:text-cyan-300">{timeStr}</span>
          </div>
        </div>

        {/* Center: Conflict Status Banner / Quick Auto-Resolve */}
        {stats.conflictCount > 0 && (
          <div className="hidden lg:flex header-conflict-alert">
            <ShieldAlert className="w-4 h-4 alert-icon shrink-0" />
            <div className="text-xs leading-tight">
              <span className="font-bold alert-title">
                {stats.conflictCount} Schedule Conflict Detected!
              </span>
              <span className="alert-subtitle ml-1.5 text-[11px] font-medium">
                Vande Bharat #22436
              </span>
            </div>
            <button
              onClick={autoResolveConflicts}
              disabled={isAutoResolving}
              className="btn-brand-orange ml-1"
              title="1-Click AI slot shifting to eliminate schedule conflict"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAutoResolving ? 'Resolving...' : 'AI Auto-Resolve'}</span>
            </button>
          </div>
        )}

        {/* Right: Role Switcher & Actions */}
        <div className="flex items-center gap-3">
          
          {/* Simulated Data Badge */}
          <div className="hidden sm:block">
            <SimulatedBadge text="SIMULATED PROTOTYPE" />
          </div>

          {/* Scenario Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-railway-card hover:bg-railway-cardHover border border-railway-border text-xs text-slate-200 transition"
              title="Change Traffic & Weather Scenario"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline font-medium">Scenario:</span>
              <span className="font-semibold text-cyan-300 truncate max-w-[90px]">{selectedScenario.name.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showScenarioMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-railway-card border border-railway-border rounded-xl shadow-2xl p-2 z-50">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 border-b border-railway-border/60 mb-1">
                  Synthetic Scenario Presets
                </div>
                {SCENARIO_PRESETS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setSelectedScenario(sc);
                      setShowScenarioMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition mb-1 flex flex-col gap-0.5 ${
                      selectedScenario.id === sc.id
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                        : 'hover:bg-railway-cardHover text-slate-300'
                    }`}
                  >
                    <span className="font-semibold">{sc.name}</span>
                    <span className="text-[10px] text-slate-400">{sc.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Logged-In User Read-Only Badge */}
          <div className="flex items-center gap-2 bg-railway-card px-3 py-1.5 rounded-xl border border-railway-border text-xs">
            <div className="w-6 h-6 rounded-lg bg-railway-surface border border-railway-border/80 flex items-center justify-center text-cyan-400">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="font-bold text-white text-[11px] truncate max-w-[120px] sm:max-w-[160px]">
                {currentUser?.name || 'Authorized User'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {currentUser?.department || 'Rail Operations'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-railway-card hover:bg-rose-500/20 border border-railway-border hover:border-rose-500/40 text-slate-300 hover:text-rose-300 transition cursor-pointer"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Notification Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-railway-card hover:bg-railway-cardHover border border-railway-border text-slate-300 transition"
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-railway-card hover:bg-railway-cardHover border border-railway-border text-slate-300 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-railway-orange text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-railway-card border border-railway-border rounded-xl shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-railway-border/60">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-railway-orange" />
                    <span className="text-xs font-bold text-slate-200">System Telemetry & Alerts</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{notifications.length} active</span>
                </div>
                <div className="mt-2 space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No active alerts. All corridors operating smoothly.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-lg border text-xs relative group ${
                          n.type === 'alert'
                            ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                            : n.type === 'success'
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                        }`}
                      >
                        <p className="pr-4 leading-relaxed text-[11px]">{n.title}</p>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
                          <span>{n.time}</span>
                          <button
                            onClick={() => dismissNotification(n.id)}
                            className="text-slate-400 hover:text-white underline cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Role Context Bar Sub-header */}
      <div className="mt-2 pt-2 border-t border-railway-border/40 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Active Persona:</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${currentRoleConfig.color}`}>
            {currentRoleConfig.icon}
            {currentRoleConfig.label}
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">— {currentRoleConfig.desc}</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-slate-600 dark:text-slate-400">
            Pending: <strong className="text-amber-700 dark:text-amber-400 font-bold">{stats.pendingCount}</strong>
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            High Risk: <strong className="text-red-700 dark:text-red-400 font-bold">{stats.highRiskCount}</strong>
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            Approved: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{stats.approvedTodayCount}</strong>
          </span>
          <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">
            Corridor Util: <strong className="text-cyan-700 dark:text-cyan-400 font-bold">{stats.corridorUtilization}%</strong>
          </span>
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { APP_NAME } from '../../constants/appConfig';
import { DEMO_USERS } from '../../data/mockData';
import { 
  Train, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  KeyRound
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);

    // Minor timeout for responsive UI feel
    setTimeout(async () => {
      const success = await login(username, password);
      if (!success) {
        setError('Invalid username or password. Please select a demo account below.');
        setIsSubmitting(false);
      }
    }, 200);
  };

  const handleSelectDemoUser = async (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setError(null);
    await login(demoUsername, demoPassword);
  };

  return (
    <div className="min-h-screen bg-railway-bg text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-railway-orange selection:text-white railway-grid-pattern">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-railway-orange/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-railway-orange to-amber-600 shadow-glow-orange mb-3">
            <Train className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            South East Central Railway
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            <strong className="text-white font-semibold">{APP_NAME}</strong> — AI-Assisted Corridor Maintenance Block Optimization System
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
            <ShieldCheck className="w-3 h-3" />
            <span>Secure Departmental Sign-In</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-railway-border/80 shadow-2xl bg-railway-surface/95 backdrop-blur-md space-y-5">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Sign In to Your Console
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your railway divisional credentials to continue
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username / Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. control_officer"
                  className="w-full pl-9 pr-3 py-2.5 bg-railway-card border border-railway-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-railway-orange/50 focus:border-railway-orange transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-railway-card border border-railway-border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-railway-orange/50 focus:border-railway-orange transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-railway-orange to-amber-600 hover:from-railway-orangeLight hover:to-orange-500 text-white text-xs font-bold shadow-glow-orange flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-Fill Demo Accounts Box for Hackathon Judges */}
          <div className="pt-4 border-t border-railway-border/60">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-railway-orange" />
                <span>Demo Accounts (Click to Instant Login)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">pwd: demo123</span>
            </div>

            <div className="space-y-1.5">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectDemoUser(user.username, user.password)}
                  className="w-full p-2 rounded-xl bg-railway-card hover:bg-railway-cardHover border border-railway-border/70 hover:border-railway-orange/50 flex items-center justify-between text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-railway-surface border border-railway-border flex items-center justify-center text-[10px] font-bold text-cyan-300 shrink-0">
                      {user.department.substring(0, 2).toUpperCase()}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {user.department} • <span className="font-mono text-slate-500">@{user.username}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold bg-railway-surface/80 text-railway-orange border border-railway-orange/20 shrink-0">
                    {user.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prototype Disclaimer */}
        <p className="text-center text-[11px] text-slate-500 mt-4 flex items-center justify-center gap-1">
          <KeyRound className="w-3 h-3" />
          <span>Client-only prototype session persisted in localStorage</span>
        </p>
      </div>
    </div>
  );
};

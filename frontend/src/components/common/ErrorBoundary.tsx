import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-railway-bg text-slate-100 flex items-center justify-center p-6 railway-grid-pattern">
          <div className="max-w-md w-full glass-panel p-6 sm:p-8 rounded-3xl border border-rose-500/40 bg-railway-surface/95 backdrop-blur-md shadow-2xl space-y-5 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-glow-red">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {this.props.fallbackTitle || 'Interface Render Notice'}
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                A component error was caught. Your session and data remain safe.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-left font-mono text-[11px] text-rose-300 max-h-28 overflow-y-auto">
                  {this.state.error.message || 'Unknown render error'}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-railway-orange to-amber-600 hover:from-railway-orange/90 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-glow-orange"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload View</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

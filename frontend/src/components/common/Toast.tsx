import React from 'react';
import { CheckCircle2, Info, AlertTriangle, ShieldAlert, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'alert';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const toastConfig: Record<ToastType, { border: string; icon: React.ReactNode; iconBg: string }> = {
  success: {
    border: 'border-l-4 border-l-emerald-500',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10'
  },
  info: {
    border: 'border-l-4 border-l-blue-500',
    icon: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />,
    iconBg: 'bg-blue-50 dark:bg-blue-500/10'
  },
  warning: {
    border: 'border-l-4 border-l-amber-500',
    icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
    iconBg: 'bg-amber-50 dark:bg-amber-500/10'
  },
  alert: {
    border: 'border-l-4 border-l-rose-500',
    icon: <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
    iconBg: 'bg-rose-50 dark:bg-rose-500/10'
  }
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const config = toastConfig[toast.type] || toastConfig.info;

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${config.border} shadow-xl shadow-slate-900/10 dark:shadow-black/40 transition-all animate-toast-in`}
          >
            <div className={`p-1.5 rounded-lg ${config.iconBg}`}>
              {config.icon}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-0.5">
                  {toast.title}
                </div>
              )}
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                {toast.message}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer shrink-0"
              title="Close notification"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};

import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

interface AccessRestrictedProps {
  moduleName: string;
  onReturn?: () => void;
  standalone?: boolean;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({
  moduleName,
  onReturn,
  standalone = false,
}) => {
  const { role, setActiveView } = useApp();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (onReturn) {
      onReturn();
    } else {
      setActiveView('dashboard');
      navigate('/');
    }
  };

  const cardContent = (
    <div className="glass-panel p-8 sm:p-12 rounded-2xl border border-rose-500/30 text-center max-w-lg mx-auto space-y-4 shadow-2xl">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Access Restricted</h2>
        <p className="text-xs text-slate-300 mt-1 font-medium">
          Access restricted for your department ({role.toUpperCase()}).
        </p>
        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
          The {moduleName} module requires elevated authorization (Control Office / Admin permissions).
        </p>
      </div>
      <div className="pt-2">
        <button
          type="button"
          onClick={handleReturn}
          className="px-4 py-2 rounded-xl bg-railway-surface hover:bg-slate-800 border border-railway-border text-xs font-semibold text-white inline-flex items-center gap-1.5 transition cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );

  if (standalone) {
    return (
      <div className="min-h-screen bg-railway-bg flex items-center justify-center p-4 railway-grid-pattern text-slate-100">
        {cardContent}
      </div>
    );
  }

  return <div className="mt-12">{cardContent}</div>;
};

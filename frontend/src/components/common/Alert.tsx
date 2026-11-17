import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const styles = {
    info: {
      container: 'bg-navy-50/80 border-navy-200 text-navy-950 border-l-4 border-l-navy-800',
      icon: <Info className="h-4 w-4 text-navy-700 shrink-0 mt-0.5" />,
    },
    success: {
      container: 'bg-emerald-50/80 border-emerald-200 text-emerald-950 border-l-4 border-l-emerald-600',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />,
    },
    warning: {
      container: 'bg-amber-50/80 border-amber-200 text-amber-950 border-l-4 border-l-gold-600',
      icon: <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />,
    },
    error: {
      container: 'bg-crimson-50/80 border-crimson-200 text-crimson-950 border-l-4 border-l-crimson-700',
      icon: <AlertCircle className="h-4 w-4 text-crimson-700 shrink-0 mt-0.5" />,
    },
  };

  const current = styles[type];

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3.5 text-xs transition-colors ${current.container} ${className}`}
      role="alert"
    >
      {current.icon}
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <div className="text-slate-700 leading-relaxed break-words">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 -mr-1 -mt-1 p-1 rounded-md"
          aria-label="Dismiss alert"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};


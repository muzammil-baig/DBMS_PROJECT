import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  badge?: React.ReactNode;
  trend?: {
    text: string;
    positive?: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  description,
  badge,
  trend,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-colors ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:bg-slate-50/50' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {badge}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-3xl font-semibold tracking-tight text-slate-900 font-tabular">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.positive ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            {trend.text}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{description}</p>
      )}
    </div>
  );
};


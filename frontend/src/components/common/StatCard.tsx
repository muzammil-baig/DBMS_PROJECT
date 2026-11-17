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
      className={`relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-xs transition-all duration-150 border-t-2 border-t-navy-800 ${
        onClick
          ? 'cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm'
          : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {badge}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-3xl font-bold tracking-tight text-navy-950 font-tabular">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.positive ? 'text-emerald-700' : 'text-slate-500'
            }`}
          >
            {trend.text}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-1.5 text-xs text-slate-500 line-clamp-1">{description}</p>
      )}
    </div>
  );
};


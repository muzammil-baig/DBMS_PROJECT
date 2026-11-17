import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
  dotColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  dot = false,
  dotColor,
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-900 border-amber-200/80',
    danger: 'bg-crimson-50 text-crimson-800 border-crimson-200/80',
    info: 'bg-navy-50 text-navy-800 border-navy-200/80',
    neutral: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium tracking-tight',
    md: 'text-xs px-2.5 py-1 rounded-md font-medium tracking-tight',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            dotColor || (variant === 'danger' ? 'bg-rose-500' : 'bg-current')
          }`}
        />
      )}
      {children}
    </span>
  );
};


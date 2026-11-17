import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants = {
    primary:
      'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 shadow-xs border border-navy-950/20 hover:shadow-sm',
    secondary:
      'bg-navy-50 text-navy-900 hover:bg-navy-100 active:bg-navy-200 border border-navy-200/60',
    outline:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs active:bg-slate-100',
    destructive:
      'bg-crimson-700 text-white hover:bg-crimson-800 shadow-xs active:bg-crimson-900 border border-crimson-900/20',
    ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
    link: 'text-navy-700 hover:text-navy-950 underline-offset-4 hover:underline p-0 h-auto',
  };

  const sizes = {
    sm: 'text-xs h-8 px-3 gap-1.5',
    md: 'text-sm h-9 px-4 gap-2',
    lg: 'text-base h-11 px-5 gap-2.5',
    icon: 'h-9 w-9 p-0',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};


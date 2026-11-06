import React, { useEffect, useState } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
  title?: string;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileMenu, title }) => {
  const { user, logout } = useAuth();
  const [backendReady, setBackendReady] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        await authService.checkReadiness();
        if (isMounted) setBackendReady(true);
      } catch {
        if (isMounted) setBackendReady(false);
      }
    };
    check();
    const interval = setInterval(check, 30000); // periodically ping readiness
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="text-base font-semibold text-slate-900 hidden sm:block">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Backend health pill */}
        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-slate-50">
          <span
            className={`h-2 w-2 rounded-full ${
              backendReady === true
                ? 'bg-emerald-500'
                : backendReady === false
                ? 'bg-rose-500'
                : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span className="hidden md:inline">Backend API:</span>
          <span className="text-slate-800">
            {backendReady === true ? 'Ready' : backendReady === false ? 'Offline' : 'Checking'}
          </span>
        </div>

        {/* User Info & Avatar */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
              {user.display_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-medium text-slate-800 leading-none">
                {user.display_name}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                {user.roles?.[0]?.replace(/_/g, ' ') || 'User'}
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="ml-1 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

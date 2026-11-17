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
        const res = await authService.checkReadiness();
        if (isMounted) {
          setBackendReady(res?.status === 'ready' || res?.status === 'ok');
        }
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
    <header className="sticky top-0 z-30 flex flex-col border-b border-slate-200 bg-white/95 backdrop-blur-xs">
      {/* Institutional Top Accent Ribbon (JSSSTU Academic Colors) */}
      <div className="h-1 w-full bg-gradient-to-r from-navy-950 via-navy-800 to-gold-500" />

      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:block">
            {title ? (
              <h1 className="text-base font-bold text-navy-950">
                {title}
              </h1>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-tight text-navy-900 uppercase">
                  Campus Memory Portal
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-[11px] text-slate-500">
                  Official Incident & Provenance Repository
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Institutional Telemetry / Backend Health Pill */}
          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 bg-slate-50">
            <span
              className={`h-2 w-2 rounded-full ${
                backendReady === true
                  ? 'bg-emerald-600'
                  : backendReady === false
                  ? 'bg-crimson-600'
                  : 'bg-gold-500 animate-pulse'
              }`}
            />
            <span className="hidden md:inline font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
              Core Engine:
            </span>
            <span className="font-semibold text-navy-950">
              {backendReady === true ? 'Active' : backendReady === false ? 'Offline' : 'Connecting'}
            </span>
          </div>

          {/* User Info & Avatar */}
          {user && (
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white border border-gold-400/60 shadow-xs">
                {user.display_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-navy-950 leading-none">
                  {user.display_name}
                </div>
                <div className="text-[10px] font-semibold text-gold-700 leading-tight mt-0.5 uppercase tracking-wide">
                  {user.roles?.[0]?.replace(/_/g, ' ') || 'Officer'}
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="ml-1 rounded-md p-1.5 text-slate-400 hover:bg-crimson-50 hover:text-crimson-700 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

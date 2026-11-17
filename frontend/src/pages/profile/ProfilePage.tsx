import React, { useEffect, useState } from 'react';
import {
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { API_BASE_URL } from '../../services/apiClient';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatRoleName, getRoleBadgeClass } from '../../utils/formatters';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [healthInfo, setHealthInfo] = useState<any>(null);

  useEffect(() => {
    authService.checkHealth().then((h) => setHealthInfo(h)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-navy-800">
          PERSONNEL & JURISDICTIONAL CREDENTIALS
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy-950 font-serif">
          Officer Profile & Security Policy
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Authenticated identity, institutional role authorizations, and API operational status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Identity Card */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg border border-slate-200 border-t-4 border-t-navy-950 bg-white p-6 shadow-2xs space-y-5">
            <h2 className="text-sm font-bold text-navy-950 border-b border-slate-100 pb-2.5">
              Identity & Account Profile
            </h2>

            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-950 text-xl font-bold text-gold-400 ring-2 ring-gold-500/50 shadow-xs font-serif">
                {user?.display_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-950">
                  {user?.display_name}
                </h3>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {user?.roles?.map((r) => (
                    <span
                      key={r}
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold border ${getRoleBadgeClass(
                        r
                      )}`}
                    >
                      {formatRoleName(r)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium uppercase tracking-wider text-[11px]">Application User ID</span>
                <span className="font-mono text-navy-900 font-semibold text-[11px] select-all">
                  {user?.user_id || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium uppercase tracking-wider text-[11px]">Authentication Authority</span>
                <span className="text-slate-800 font-medium">
                  Supabase Auth via FastAPI Proxy
                </span>
              </div>
            </div>
          </div>

          {/* Role Authorization Guide */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-navy-950 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Shield className="h-4 w-4 text-navy-800" />
              Role Authorization Policy
            </h2>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-md border border-slate-200 border-l-4 border-l-slate-400 bg-slate-50/70">
                <span className="font-bold text-navy-950 block mb-0.5">event_reporter</span>
                Permitted to report new campus incidents, view public and internal incident records, and observe timeline updates.
              </div>
              <div className="p-3.5 rounded-md border border-slate-200 border-l-4 border-l-navy-800 bg-slate-50/70">
                <span className="font-bold text-navy-950 block mb-0.5">event_investigator</span>
                Authorized to advance status workflows, link causal relationships, record quantifiable impacts, and attach corroborating evidence.
              </div>
              <div className="p-3.5 rounded-md border border-slate-200 border-l-4 border-l-gold-600 bg-slate-50/70">
                <span className="font-bold text-navy-950 block mb-0.5">decision_maker / administrator</span>
                Access to institutional summaries, recurrence trends, administrative settings, and complete forensic export capabilities.
              </div>
            </div>
          </div>
        </div>

        {/* Backend Connectivity Status */}
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950 border-b border-slate-100 pb-2.5">
              System Environment
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider">API Base URL</span>
                <span className="font-mono text-[11px] text-navy-900 font-medium break-all">
                  {API_BASE_URL}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Backend Service</span>
                <span className="font-medium text-slate-900">
                  {healthInfo?.service || 'CAMPUS MEMORY API'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Runtime Environment</span>
                <span className="font-mono text-navy-900 font-semibold uppercase">
                  {healthInfo?.environment || 'development'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-1">Database Connected</span>
                <Badge variant={healthInfo?.database_configured ? 'success' : 'neutral'}>
                  {healthInfo?.database_configured ? 'Configured' : 'Offline'}
                </Badge>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider mb-1">Auth Provider</span>
                <Badge variant={healthInfo?.auth_configured ? 'success' : 'neutral'}>
                  {healthInfo?.auth_configured ? 'Configured' : 'Offline'}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Button
                variant="destructive"
                className="w-full"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Sign Out Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

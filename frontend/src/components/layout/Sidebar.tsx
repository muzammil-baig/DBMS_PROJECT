import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileSearch,
  GitBranch,
  Layers,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  User as UserIcon,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatRoleName, getRoleBadgeClass } from '../../utils/formatters';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', path: '/events', icon: CalendarDays },
    { name: 'Investigations', path: '/investigations', icon: FileSearch },
    { name: 'Relationships', path: '/relationships', icon: GitBranch },
    { name: 'Evidence', path: '/evidence', icon: Layers },
    { name: 'Impacts', path: '/impacts', icon: Zap },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Reference Data', path: '/references', icon: BookOpen },
    { name: 'Profile', path: '/profile', icon: UserIcon },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-slate-200 bg-white shadow-xs transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Institutional Masthead */}
        <div className="flex h-18 items-center justify-between border-b border-navy-900/10 bg-navy-950 px-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 border border-gold-500/40 text-gold-400 shadow-xs">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-white font-sans">
                CAMPUS MEMORY
              </span>
              <span className="block text-[9px] font-semibold uppercase tracking-widest text-gold-400">
                Institutional Repository
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-navy-900 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User Institutional ID Badge */}
        {user && (
          <div className="border-b border-slate-200/80 bg-slate-50/70 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white border-2 border-gold-400/50 shadow-xs">
                {user.display_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-slate-900">
                  {user.display_name}
                </div>
                <div className="truncate text-[11px] text-slate-500">{user.email}</div>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {user.roles?.map((r) => (
                <span
                  key={r}
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold border ${getRoleBadgeClass(
                    r
                  )}`}
                >
                  {formatRoleName(r)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operational Intelligence
            </div>
            <div className="space-y-0.5">
              {navigationItems.slice(0, 3).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-navy-900 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-navy-950'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 text-current opacity-80" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Provenance & Evidence
            </div>
            <div className="space-y-0.5">
              {navigationItems.slice(3, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-navy-900 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-navy-950'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 text-current opacity-80" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Governance & Registry
            </div>
            <div className="space-y-0.5">
              {navigationItems.slice(6).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-navy-900 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-navy-950'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 text-current opacity-80" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Bottom Institutional Info & Logout */}
        <div className="border-t border-slate-200 p-3 bg-slate-50/50">
          <div className="mb-2 px-3 py-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>Security Level 3</span>
            <span className="font-mono font-medium text-navy-800">PORTAL v2.4</span>
          </div>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-crimson-700 hover:bg-crimson-50 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};


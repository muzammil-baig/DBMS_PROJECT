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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & App Name */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-teal-400 shadow-xs">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-bold tracking-tight text-slate-900">
                CAMPUS MEMORY
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Incident & Provenance
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User Card in Sidebar */}
        {user && (
          <div className="border-b border-slate-100 p-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                {user.display_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-slate-900">
                  {user.display_name}
                </div>
                <div className="truncate text-[11px] text-slate-500">{user.email}</div>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {user.roles?.map((r) => (
                <span
                  key={r}
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium border ${getRoleBadgeClass(
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
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            System Modules
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Logout Area */}
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};


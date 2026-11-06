import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { reportService } from '../../services/reportService';
import { eventService } from '../../services/eventService';
import { DashboardSummary } from '../../types';
import { extractErrorMessage } from '../../services/apiClient';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/common/Alert';
import {
  formatDate,
  getStatusBadgeProps,
  getSeverityBadgeProps,
} from '../../utils/formatters';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444', // red-500
  high: '#f97316',     // orange-500
  medium: '#f59e0b',   // amber-500
  low: '#10b981',      // emerald-500
};

const CATEGORY_COLORS = ['#0f172a', '#2563eb', '#0d9488', '#6366f1', '#8b5cf6', '#ec4899'];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [totalEventsCount, setTotalEventsCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumData, eventsData] = await Promise.all([
        reportService.getDashboardSummary(),
        eventService.listEvents({ page: 1, page_size: 5 }),
      ]);
      setSummary(sumData);
      setTotalEventsCount(eventsData.total);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load dashboard metrics from backend.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const criticalCount =
    summary?.open_by_severity?.find((s) => s.code.toLowerCase() === 'critical')?.event_count || 0;
  const highCount =
    summary?.open_by_severity?.find((s) => s.code.toLowerCase() === 'high')?.event_count || 0;

  const currentDateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  if (isLoading) {
    return <LoadingSpinner label="Loading campus incident intelligence..." fullHeight />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            Operational Console
          </div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.display_name || 'Officer'}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {currentDateFormatted} — Campus Incident Memory & Investigation System
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/events/create')}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Report Incident
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          title="Backend Connection Notice"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Incidents"
          value={totalEventsCount !== null ? totalEventsCount : '—'}
          description="Total recorded campus events"
          onClick={() => navigate('/events')}
        />
        <StatCard
          label="Active Open Incidents"
          value={summary?.open_event_count ?? 0}
          description="Under review or investigation"
          badge={
            (summary?.open_event_count ?? 0) > 0 ? (
              <Badge variant="warning" dot>
                Action Required
              </Badge>
            ) : (
              <Badge variant="success">All Clear</Badge>
            )
          }
          onClick={() => navigate('/events?status_code=reported')}
        />
        <StatCard
          label="Critical Severity"
          value={criticalCount}
          description="Immediate hazard or major breach"
          badge={
            criticalCount > 0 ? (
              <Badge variant="danger" dot dotColor="bg-red-500">
                High Priority
              </Badge>
            ) : (
              <Badge variant="neutral">None</Badge>
            )
          }
        />
        <StatCard
          label="High Severity"
          value={highCount}
          description="Significant operational impact"
          badge={
            highCount > 0 ? (
              <Badge variant="warning">Attention</Badge>
            ) : (
              <Badge variant="neutral">None</Badge>
            )
          }
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Open Incidents by Severity
              </h2>
              <p className="text-xs text-slate-500">
                Distribution across threat levels
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {summary?.open_by_severity?.length || 0} levels
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            {summary?.open_by_severity && summary.open_by_severity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary.open_by_severity}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="display_name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="event_count" name="Open Incidents" radius={[4, 4, 0, 0]}>
                    {summary.open_by_severity.map((entry) => (
                      <Cell
                        key={entry.code}
                        fill={SEVERITY_COLORS[entry.code.toLowerCase()] || '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No active severity data recorded
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Open Incidents by Category
              </h2>
              <p className="text-xs text-slate-500">
                Categorical breakdown of campus occurrences
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {summary?.open_by_category?.length || 0} categories
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            {summary?.open_by_category && summary.open_by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={summary.open_by_category}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="display_name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="event_count"
                    name="Open Incidents"
                    fill="#0f172a"
                    radius={[0, 4, 4, 0]}
                  >
                    {summary.open_by_category.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No active categorical incidents recorded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Open Incidents Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Open Incidents
            </h2>
            <p className="text-xs text-slate-500">
              Latest reported and ongoing campus events
            </p>
          </div>
          <Link
            to="/events"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            <span>View All Incidents</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Event Code</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Started At</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {summary?.recent_open_events && summary.recent_open_events.length > 0 ? (
                summary.recent_open_events.map((evt: any) => {
                  const statusProps = getStatusBadgeProps(evt.status_code || evt.status_name);
                  const severityProps = getSeverityBadgeProps(evt.severity_code || evt.severity_name);

                  return (
                    <tr
                      key={evt.event_id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => navigate(`/events/${evt.event_id}`)}
                    >
                      <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                        {evt.event_code}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-900 max-w-[220px] truncate">
                        {evt.title}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {evt.category_name || evt.category_code || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border ${severityProps.bg} ${severityProps.text} ${severityProps.border}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${severityProps.dotColor}`} />
                          {severityProps.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${statusProps.bg} ${statusProps.text} ${statusProps.border}`}
                        >
                          {statusProps.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {evt.location_name || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-tabular">
                        {formatDate(evt.started_at)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/events/${evt.event_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No open incidents at this time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

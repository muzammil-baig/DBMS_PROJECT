import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  History,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { referenceService } from '../../services/referenceService';
import {
  EventAsOfItem,
  EventSummary,
  Page,
  ReferenceCategory,
  ReferenceSeverityLevel,
  ReferenceStatus,
} from '../../types';
import { extractErrorMessage } from '../../services/apiClient';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  formatDate,
  getSeverityBadgeProps,
  getStatusBadgeProps,
  toIsoWithTz,
} from '../../utils/formatters';

export const EventsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [eventsPage, setEventsPage] = useState<Page<EventSummary> | null>(null);
  const [asOfEvents, setAsOfEvents] = useState<Page<EventAsOfItem> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters from URL or local state
  const keyword = searchParams.get('keyword') || '';
  const categoryCode = searchParams.get('category_code') || '';
  const severityCode = searchParams.get('severity_code') || '';
  const statusCode = searchParams.get('status_code') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 15;

  // As-Of Temporal Reconstruction Mode
  const [isAsOfMode, setIsAsOfMode] = useState(false);
  const [asOfTimestamp, setAsOfTimestamp] = useState<string>(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  // Reference lists for filter dropdowns
  const [categories, setCategories] = useState<ReferenceCategory[]>([]);
  const [severities, setSeverities] = useState<ReferenceSeverityLevel[]>([]);
  const [statuses, setStatuses] = useState<ReferenceStatus[]>([]);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [catList, sevList, statList] = await Promise.all([
          referenceService.getCategories(),
          referenceService.getSeverityLevels(),
          referenceService.getStatuses(),
        ]);
        setCategories(catList);
        setSeverities(sevList);
        setStatuses(statList);
      } catch {
        // non-blocking
      }
    };
    loadReferences();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isAsOfMode) {
        const dateObj = new Date(asOfTimestamp);
        const data = await eventService.getEventsAsOf({
          at: toIsoWithTz(dateObj),
          category_code: categoryCode || undefined,
          status_code: statusCode || undefined,
          page: currentPage,
          page_size: pageSize,
        });
        setAsOfEvents(data);
        setEventsPage(null);
      } else {
        const data = await eventService.listEvents({
          keyword: keyword || undefined,
          category_code: categoryCode || undefined,
          severity_code: severityCode || undefined,
          status_code: statusCode || undefined,
          page: currentPage,
          page_size: pageSize,
        });
        setEventsPage(data);
        setAsOfEvents(null);
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to retrieve events.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [keyword, categoryCode, severityCode, statusCode, currentPage, isAsOfMode]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const totalItems = isAsOfMode ? asOfEvents?.total ?? 0 : eventsPage?.total ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Campus Incidents & Events
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Search, filter, and track recorded campus safety, IT, and operational incidents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isAsOfMode ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setIsAsOfMode(!isAsOfMode)}
            leftIcon={<History className="h-3.5 w-3.5" />}
          >
            {isAsOfMode ? 'Exit As-Of Reconstruction' : 'Temporal As-Of Query'}
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

      {isAsOfMode && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-900">
                <Clock className="h-4 w-4 text-teal-600" />
                Temporal Provenance Reconstruction
              </div>
              <p className="mt-0.5 text-xs text-teal-700">
                Reconstruct the status of incidents exactly as they were recorded at a past point in time.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={asOfTimestamp}
                onChange={(e) => setAsOfTimestamp(e.target.value)}
                className="rounded-lg border border-teal-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <Button size="sm" onClick={loadEvents}>
                Reconstruct
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <Alert
          type="error"
          title="Error Loading Events"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, code or keyword..."
              value={keyword}
              onChange={(e) => updateFilter('keyword', e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryCode}
              onChange={(e) => updateFilter('category_code', e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-700 focus:border-slate-400 focus:outline-none bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityCode}
              onChange={(e) => updateFilter('severity_code', e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-700 focus:border-slate-400 focus:outline-none bg-white"
            >
              <option value="">All Severities</option>
              {severities.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusCode}
              onChange={(e) => updateFilter('status_code', e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-700 focus:border-slate-400 focus:outline-none bg-white"
            >
              <option value="">All Statuses</option>
              {statuses.map((st) => (
                <option key={st.code} value={st.code}>
                  {st.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter status tags */}
        {(keyword || categoryCode || severityCode || statusCode) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Active filters:</span>
            {keyword && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                "{keyword}"
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => updateFilter('keyword', '')}
                />
              </span>
            )}
            {categoryCode && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                Category: {categoryCode}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => updateFilter('category_code', '')}
                />
              </span>
            )}
            {severityCode && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                Severity: {severityCode}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => updateFilter('severity_code', '')}
                />
              </span>
            )}
            {statusCode && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                Status: {statusCode}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => updateFilter('status_code', '')}
                />
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="ml-auto text-xs text-blue-600 hover:underline"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Events Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12">
            <LoadingSpinner label="Loading incidents..." />
          </div>
        ) : isAsOfMode ? (
          /* As-Of Historical Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Event Code</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Historical Status</th>
                  <th className="px-5 py-3 font-medium">Recorded At</th>
                  <th className="px-5 py-3 font-medium">Transition Reason</th>
                  <th className="px-5 py-3 font-medium">Reconstruction Note</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {asOfEvents?.items && asOfEvents.items.length > 0 ? (
                  asOfEvents.items.map((item) => {
                    const statusProps = getStatusBadgeProps(item.status_as_recorded);
                    return (
                      <tr
                        key={item.event_id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => navigate(`/events/${item.event_id}`)}
                      >
                        <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                          {item.event_code}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-900 max-w-[200px] truncate">
                          {item.title}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${statusProps.bg} ${statusProps.text} ${statusProps.border}`}
                          >
                            {statusProps.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-tabular">
                          {formatDate(item.status_recorded_at)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 max-w-[200px] truncate">
                          {item.history_reason || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-[11px] max-w-[200px] truncate">
                          {item.reconstruction_note}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            to={`/events/${item.event_id}`}
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
                    <td colSpan={7} className="px-5 py-12">
                      <EmptyState
                        title="No Historical Events Found"
                        description="No incidents matched the selected timestamp and filters."
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Standard Events Table */
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
                {eventsPage?.items && eventsPage.items.length > 0 ? (
                  eventsPage.items.map((event) => {
                    const statusProps = getStatusBadgeProps(event.status_code);
                    const severityProps = getSeverityBadgeProps(event.severity_code);

                    return (
                      <tr
                        key={event.event_id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => navigate(`/events/${event.event_id}`)}
                      >
                        <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                          {event.event_code}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-900 max-w-[220px] truncate">
                          {event.title}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {event.category_name || event.category_code}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border ${severityProps.bg} ${severityProps.text} ${severityProps.border}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${severityProps.dotColor}`}
                            />
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
                          {event.location_name || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-tabular">
                          {formatDate(event.started_at)}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <Link
                            to={`/events/${event.event_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-12">
                      <EmptyState
                        title="No Incidents Found"
                        description={
                          keyword || categoryCode || severityCode || statusCode
                            ? 'No events match the active search criteria.'
                            : 'No incidents have been recorded yet in CAMPUS MEMORY.'
                        }
                        actionLabel="Report New Incident"
                        onAction={() => navigate('/events/create')}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500 bg-slate-50/50">
            <div>
              Showing <span className="font-medium text-slate-800">{totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
              <span className="font-medium text-slate-800">
                {Math.min(currentPage * pageSize, totalItems)}
              </span>{' '}
              of <span className="font-medium text-slate-800">{totalItems}</span> incidents
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
              >
                Previous
              </Button>
              <span className="px-2 font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

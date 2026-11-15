import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { eventService } from '../../services/eventService';
import { referenceService } from '../../services/referenceService';
import {
  ReferenceAsset,
  ReferenceCategory,
  ReferenceDataClass,
  ReferenceEventType,
  ReferenceLocation,
  ReferenceScheduledActivity,
  ReferenceService,
  ReferenceSeverityLevel,
} from '../../types';
import { extractErrorMessage } from '../../services/apiClient';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import {
  getActiveReferenceItems,
  getDefaultDataClassCode,
  toIsoWithTz,
} from '../../utils/formatters';

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [eventCode, setEventCode] = useState(`EVT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [eventTypeId, setEventTypeId] = useState('');
  const [severityCode, setSeverityCode] = useState('');
  const [dataClassCode, setDataClassCode] = useState('');
  const [startedAt, setStartedAt] = useState(new Date().toISOString().slice(0, 16));

  // Context Selection (at least one required by backend)
  const [contextType, setContextType] = useState<'location' | 'asset' | 'service' | 'activity'>('location');
  const [locationId, setLocationId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [scheduledActivityId, setScheduledActivityId] = useState('');

  // Reference lists
  const [categories, setCategories] = useState<ReferenceCategory[]>([]);
  const [allEventTypes, setAllEventTypes] = useState<ReferenceEventType[]>([]);
  const [severities, setSeverities] = useState<ReferenceSeverityLevel[]>([]);
  const [dataClasses, setDataClasses] = useState<ReferenceDataClass[]>([]);
  const [locations, setLocations] = useState<ReferenceLocation[]>([]);
  const [assets, setAssets] = useState<ReferenceAsset[]>([]);
  const [services, setServices] = useState<ReferenceService[]>([]);
  const [activities, setActivities] = useState<ReferenceScheduledActivity[]>([]);

  const [, setIsLoadingReferences] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchRefs = async () => {
      try {
        const [cats, evTypes, sevs, dClasses, locs, asts, srvs, acts] = await Promise.all([
          referenceService.getCategories(),
          referenceService.getEventTypes(),
          referenceService.getSeverityLevels(),
          referenceService.getDataClasses(),
          referenceService.getLocations(),
          referenceService.getAssets(),
          referenceService.getServices(),
          referenceService.getScheduledActivities(),
        ]);
        const activeCats = getActiveReferenceItems(cats);
        const activeEvTypes = getActiveReferenceItems(evTypes);
        const activeSevs = getActiveReferenceItems(sevs);
        const activeDClasses = getActiveReferenceItems(dClasses);
        const activeLocs = getActiveReferenceItems(locs);

        setCategories(activeCats);
        setAllEventTypes(activeEvTypes);
        setSeverities(activeSevs);
        setDataClasses(activeDClasses);
        setLocations(activeLocs);
        setAssets(asts);
        setServices(srvs);
        setActivities(acts);

        if (activeCats.length > 0) setCategoryCode(activeCats[0].code);
        if (activeSevs.length > 0) setSeverityCode(activeSevs[0].code);
        const defaultDc = getDefaultDataClassCode(activeDClasses);
        if (defaultDc) setDataClassCode(defaultDc);
        if (activeLocs.length > 0) setLocationId(activeLocs[0].location_id);
      } catch (err) {
        setErrorMessage('Failed to load system reference options from backend.');
      } finally {
        setIsLoadingReferences(false);
      }
    };
    fetchRefs();
  }, []);

  // Filter event types when category changes
  const availableEventTypes = allEventTypes.filter(
    (et) => !categoryCode || et.category_code === categoryCode
  );

  useEffect(() => {
    if (availableEventTypes.length > 0) {
      setEventTypeId(availableEventTypes[0].event_type_id);
    } else {
      setEventTypeId('');
    }
  }, [categoryCode, allEventTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!eventCode.trim()) {
      setErrorMessage('Event code is required.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Title is required.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Description is required.');
      return;
    }
    if (!categoryCode) {
      setErrorMessage('Please select a category.');
      return;
    }
    if (!eventTypeId) {
      setErrorMessage('Please select an event type.');
      return;
    }
    if (!severityCode) {
      setErrorMessage('Please select a severity level.');
      return;
    }
    if (!dataClassCode) {
      setErrorMessage('Please select a data classification.');
      return;
    }

    // Ensure at least one context entity is provided
    let loc = contextType === 'location' && locationId ? locationId : null;
    let ast = contextType === 'asset' && assetId ? assetId : null;
    let srv = contextType === 'service' && serviceId ? serviceId : null;
    let act = contextType === 'activity' && scheduledActivityId ? scheduledActivityId : null;

    if (!loc && !ast && !srv && !act) {
      setErrorMessage('At least one operational context (location, asset, service, or activity) must be linked.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        event_code: eventCode.trim(),
        title: title.trim(),
        description: description.trim(),
        category_code: categoryCode,
        event_type_id: eventTypeId,
        severity_code: severityCode,
        location_id: loc,
        asset_id: ast,
        service_id: srv,
        scheduled_activity_id: act,
        started_at: toIsoWithTz(new Date(startedAt)),
        data_class_code: dataClassCode,
      };

      const createdEvent = await eventService.createEvent(payload);
      navigate(`/events/${createdEvent.event_id}`, { replace: true });
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Failed to create event. Please verify all fields.');
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Header */}
      <div>
        <Breadcrumbs
          items={[
            { label: 'Events', path: '/events' },
            { label: 'Report Incident' },
          ]}
        />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/events')}
              aria-label="Back to events"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Report Campus Incident
              </h1>
              <p className="text-xs text-slate-500">
                Record a verified campus occurrence into the temporal provenance ledger.
              </p>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <Alert
          type="error"
          title="Submission Error"
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
            1. Core Incident Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Event Code *
              </label>
              <input
                type="text"
                required
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                placeholder="EVT-2026-001"
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs font-mono focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Incident Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary, e.g., Library 2nd Floor Power Outage"
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Detailed Description *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a factual summary of what occurred, observations, and immediate safety responses..."
              className="w-full rounded-lg border border-slate-300 p-3 text-xs focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Category *
              </label>
              <select
                required
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Event Type *
              </label>
              <select
                required
                value={eventTypeId}
                onChange={(e) => setEventTypeId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
              >
                {availableEventTypes.map((et) => (
                  <option key={et.event_type_id} value={et.event_type_id}>
                    {et.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Severity Level *
              </label>
              <select
                required
                value={severityCode}
                onChange={(e) => setSeverityCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
              >
                {severities.map((sev) => (
                  <option key={sev.code} value={sev.code}>
                    {sev.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Classification */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Data Classification *
              </label>
              <select
                required
                value={dataClassCode}
                onChange={(e) => setDataClassCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
              >
                {dataClasses.map((dc) => (
                  <option key={dc.code} value={dc.code}>
                    {dc.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Started At (Date & Time) *
            </label>
            <input
              type="datetime-local"
              required
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              className="rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-slate-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Backend records UTC timestamp with timezone provenance.
            </p>
          </div>
        </div>

        {/* Operational Context Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
              2. Operational Context Linkage *
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Every campus event must be anchored to at least one physical location, asset, critical service, or scheduled activity.
            </p>
          </div>

          {/* Context Type Selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'location', label: 'Campus Location' },
              { id: 'asset', label: 'Campus Asset' },
              { id: 'service', label: 'Campus Service' },
              { id: 'activity', label: 'Scheduled Activity' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setContextType(tab.id as any)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                  contextType === tab.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Context Options */}
          <div>
            {contextType === 'location' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Campus Location
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
                >
                  <option value="">-- Choose Location --</option>
                  {locations.map((loc) => (
                    <option key={loc.location_id} value={loc.location_id}>
                      {loc.name} ({loc.location_code} • {loc.location_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {contextType === 'asset' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Campus Asset
                </label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map((ast) => (
                    <option key={ast.asset_id} value={ast.asset_id}>
                      {ast.name} ({ast.asset_code} • {ast.asset_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {contextType === 'service' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Campus Service
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
                >
                  <option value="">-- Choose Service --</option>
                  {services.map((srv) => (
                    <option key={srv.service_id} value={srv.service_id}>
                      {srv.name} ({srv.service_code} • {srv.service_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {contextType === 'activity' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Scheduled Activity
                </label>
                <select
                  value={scheduledActivityId}
                  onChange={(e) => setScheduledActivityId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
                >
                  <option value="">-- Choose Activity --</option>
                  {activities.map((act) => (
                    <option key={act.scheduled_activity_id} value={act.scheduled_activity_id}>
                      {act.title} ({act.activity_code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/events')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
          >
            Submit Incident Report
          </Button>
        </div>
      </form>
    </div>
  );
};

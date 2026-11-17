import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  RefreshCw,
} from 'lucide-react';
import { impactService } from '../../services/impactService';
import { eventService } from '../../services/eventService';
import { referenceService } from '../../services/referenceService';
import {
  EventSummary,
  ImpactRead,
  ReferenceAsset,
  ReferenceDataClass,
  ReferenceDepartment,
  ReferenceImpactType,
  ReferenceLocation,
  ReferenceMeasurementUnit,
  ReferenceScheduledActivity,
  ReferenceService,
} from '../../types';
import { extractErrorMessage } from '../../services/apiClient';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Alert } from '../../components/common/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  buildValidatedImpactPayload,
  formatAffectedTargetName,
  formatDate,
  getActiveReferenceItems,
  getDefaultDataClassCode,
  getDefaultUnitForImpactType,
  ImpactTargetKind,
} from '../../utils/formatters';

export const ImpactsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedEventId = searchParams.get('event_id') || '';

  const [eventsList, setEventsList] = useState<EventSummary[]>([]);
  const [impacts, setImpacts] = useState<ImpactRead[]>([]);
  const [impactTypes, setImpactTypes] = useState<ReferenceImpactType[]>([]);
  const [units, setUnits] = useState<ReferenceMeasurementUnit[]>([]);
  const [dataClasses, setDataClasses] = useState<ReferenceDataClass[]>([]);
  const [locations, setLocations] = useState<ReferenceLocation[]>([]);
  const [assets, setAssets] = useState<ReferenceAsset[]>([]);
  const [services, setServices] = useState<ReferenceService[]>([]);
  const [departments, setDepartments] = useState<ReferenceDepartment[]>([]);
  const [scheduledActivities, setScheduledActivities] = useState<ReferenceScheduledActivity[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add Impact Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [typeCode, setTypeCode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitCode, setUnitCode] = useState('');
  const [dataClassCode, setDataClassCode] = useState('');
  const [verifStatus, setVerifStatus] = useState<'verified' | 'estimated'>('verified');
  const [estimateBasis, setEstimateBasis] = useState('');
  const [objectDesc, setObjectDesc] = useState('');
  const [targetKind, setTargetKind] = useState<ImpactTargetKind>('description');
  const [targetId, setTargetId] = useState('');
  const [addModalError, setAddModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Impact Modal
  const [editModalImpact, setEditModalImpact] = useState<ImpactRead | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnitCode, setEditUnitCode] = useState('');
  const [editVerifStatus, setEditVerifStatus] = useState<'verified' | 'estimated'>('verified');
  const [editEstimateBasis, setEditEstimateBasis] = useState('');
  const [editObjectDesc, setEditObjectDesc] = useState('');
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);

  const loadReferenceData = async (forceFresh = false) => {
    const [itRes, muRes, dcRes, locRes, astRes, srvRes, deptRes, actRes] = await Promise.allSettled([
      referenceService.getReference<ReferenceImpactType>('impact_types', forceFresh),
      referenceService.getReference<ReferenceMeasurementUnit>('measurement_units', forceFresh),
      referenceService.getReference<ReferenceDataClass>('data_classes', forceFresh),
      referenceService.getReference<ReferenceLocation>('locations', forceFresh),
      referenceService.getReference<ReferenceAsset>('assets', forceFresh),
      referenceService.getReference<ReferenceService>('services', forceFresh),
      referenceService.getReference<ReferenceDepartment>('departments', forceFresh),
      referenceService.getReference<ReferenceScheduledActivity>('scheduled_activities', forceFresh),
    ]);

    const activeTypes = itRes.status === 'fulfilled' ? getActiveReferenceItems(itRes.value) : [];
    const activeUnits = muRes.status === 'fulfilled' ? getActiveReferenceItems(muRes.value) : [];
    const activeDataClasses = dcRes.status === 'fulfilled' ? getActiveReferenceItems(dcRes.value) : [];
    const activeLocations = locRes.status === 'fulfilled' ? getActiveReferenceItems(locRes.value) : [];
    const loadedAssets = astRes.status === 'fulfilled' ? astRes.value : [];
    const loadedServices = srvRes.status === 'fulfilled' ? srvRes.value : [];
    const activeDepartments = deptRes.status === 'fulfilled' ? getActiveReferenceItems(deptRes.value) : [];
    const loadedActivities = actRes.status === 'fulfilled' ? actRes.value : [];

    if (itRes.status === 'fulfilled') setImpactTypes(activeTypes);
    if (muRes.status === 'fulfilled') setUnits(activeUnits);
    if (dcRes.status === 'fulfilled') setDataClasses(activeDataClasses);
    if (locRes.status === 'fulfilled') setLocations(activeLocations);
    if (astRes.status === 'fulfilled') setAssets(loadedAssets);
    if (srvRes.status === 'fulfilled') setServices(loadedServices);
    if (deptRes.status === 'fulfilled') setDepartments(activeDepartments);
    if (actRes.status === 'fulfilled') setScheduledActivities(loadedActivities);

    if (itRes.status === 'fulfilled' && activeTypes.length > 0) {
      const nextType = activeTypes.some((t) => t.code === typeCode) ? typeCode : activeTypes[0].code;
      setTypeCode(nextType);
      if (muRes.status === 'fulfilled' && activeUnits.length > 0) {
        setUnitCode((prev) =>
          activeUnits.some((u) => u.code === prev)
            ? prev
            : getDefaultUnitForImpactType(nextType, activeTypes, activeUnits)
        );
      }
    } else if (muRes.status === 'fulfilled' && activeUnits.length > 0) {
      setUnitCode((prev) => (activeUnits.some((u) => u.code === prev) ? prev : activeUnits[0].code));
    }

    if (dcRes.status === 'fulfilled') {
      const defaultDc = getDefaultDataClassCode(activeDataClasses);
      if (defaultDc) {
        setDataClassCode((prev) => (activeDataClasses.some((d) => d.code === prev) ? prev : defaultDc));
      }
    }

    const failed = [itRes, muRes, dcRes, locRes, astRes, srvRes, deptRes, actRes].find(
      (r) => r.status === 'rejected'
    ) as PromiseRejectedResult | undefined;

    return { failed };
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [evPage, refs] = await Promise.all([
          eventService.listEvents({ page: 1, page_size: 100 }),
          loadReferenceData(),
        ]);

        setEventsList(evPage.items);

        if (refs.failed) {
          setError(extractErrorMessage(refs.failed.reason, 'Failed to load impact reference data.'));
        }

        if (!selectedEventId && evPage.items.length > 0) {
          setSearchParams({ event_id: evPage.items[0].event_id });
        }
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to initialize impact data.'));
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const fetchImpacts = async () => {
    if (!selectedEventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await impactService.listImpacts(selectedEventId);
      setImpacts(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load impacts.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchImpacts();
    }
  }, [selectedEventId]);

  const handleImpactTypeChange = (nextTypeCode: string) => {
    setTypeCode(nextTypeCode);
    const defaultUnit = getDefaultUnitForImpactType(nextTypeCode, impactTypes, units);
    if (defaultUnit) {
      setUnitCode(defaultUnit);
    }
  };

  const openAddModal = async () => {
    setAddModalError(null);
    setQuantity('1');
    setEstimateBasis('');
    setObjectDesc('');
    setTargetId('');
    setAddModalOpen(true);

    const defaultDc = getDefaultDataClassCode(dataClasses);
    if (defaultDc) {
      setDataClassCode(defaultDc);
    }
    if (impactTypes.length > 0) {
      const nextType = impactTypes.some((t) => t.code === typeCode) ? typeCode : impactTypes[0].code;
      setTypeCode(nextType);
      const defaultUnit = getDefaultUnitForImpactType(nextType, impactTypes, units);
      if (defaultUnit) setUnitCode(defaultUnit);
    }

    if (
      impactTypes.length === 0 ||
      units.length === 0 ||
      dataClasses.length === 0 ||
      departments.length === 0
    ) {
      const refs = await loadReferenceData(true);
      if (refs.failed) {
        setAddModalError(extractErrorMessage(refs.failed.reason, 'Failed to load reference collections.'));
      }
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddModalError(null);

    if (!selectedEventId) {
      setAddModalError('Please select a focus event before recording an impact.');
      return;
    }

    const { payload, error: validationError } = buildValidatedImpactPayload({
      impactTypeCode: typeCode,
      unitCode,
      dataClassCode,
      quantity,
      verificationStatus: verifStatus,
      estimateBasis,
      targetKind,
      targetId,
      objectDescription: objectDesc,
      impactTypes,
      units,
      dataClasses,
      locations,
      assets,
      services,
      activities: scheduledActivities,
      departments,
    });

    if (validationError || !payload) {
      setAddModalError(validationError || 'Invalid impact form input.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await impactService.addImpact(selectedEventId, payload);

      setAddModalOpen(false);
      setQuantity('1');
      setEstimateBasis('');
      setObjectDesc('');
      setTargetId('');
      setAddModalError(null);
      setSuccessMessage('Impact successfully recorded.');
      await fetchImpacts();
    } catch (err) {
      setAddModalError(extractErrorMessage(err, 'Failed to record impact.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (imp: ImpactRead) => {
    setEditModalError(null);
    setEditModalImpact(imp);
    setEditQuantity(String(imp.quantity));
    setEditUnitCode(imp.unit_code);
    setEditVerifStatus(imp.verification_status);
    setEditEstimateBasis(imp.estimate_basis || '');
    setEditObjectDesc(imp.affected_object_description || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditModalError(null);
    if (!editModalImpact) return;

    if (editVerifStatus !== 'verified' && editVerifStatus !== 'estimated') {
      setEditModalError('Verification status must be verified or estimated.');
      return;
    }
    if (editVerifStatus === 'estimated' && !editEstimateBasis.trim()) {
      setEditModalError('An estimate basis is required when verification status is estimated.');
      return;
    }
    if (editUnitCode && !units.some((u) => u.code === editUnitCode)) {
      setEditModalError('Selected measurement unit does not exist or is inactive.');
      return;
    }

    const qty = Number(editQuantity.trim());
    if (!editQuantity.trim() || !Number.isFinite(qty) || qty < 0) {
      setEditModalError('Quantity must be a valid non-negative number.');
      return;
    }

    const hasStructuredTarget = Boolean(
      editModalImpact.affected_location_id ||
        editModalImpact.affected_asset_id ||
        editModalImpact.affected_service_id ||
        editModalImpact.affected_activity_id ||
        editModalImpact.affected_department_id
    );
    if (!hasStructuredTarget && !editObjectDesc.trim()) {
      setEditModalError('An object description is required when no structured entity is attached.');
      return;
    }

    setIsEditingSubmitting(true);
    setError(null);
    try {
      await impactService.updateImpact(editModalImpact.impact_id, {
        quantity: qty,
        unit_code: editUnitCode || undefined,
        verification_status: editVerifStatus,
        estimate_basis: editVerifStatus === 'estimated' ? editEstimateBasis.trim() : null,
        affected_object_description: editObjectDesc.trim() || undefined,
      });

      setEditModalImpact(null);
      setEditModalError(null);
      setSuccessMessage('Impact successfully updated.');
      await fetchImpacts();
    } catch (err) {
      setEditModalError(extractErrorMessage(err, 'Failed to update impact.'));
    } finally {
      setIsEditingSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-xs border-t-4 border-t-navy-950">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gold-700">
            <span className="h-2 w-2 rounded-full bg-gold-600" />
            Institutional Damage & Disruption Ledger
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-950">
            Campus Impact Accounting
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Audit and verify quantifiable damages, operational downtime, casualties, and financial impacts across campus facilities.
          </p>
        </div>

        <Button
          size="sm"
          onClick={openAddModal}
          leftIcon={<Plus className="h-3.5 w-3.5" />}
        >
          Record Impact
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          title="Notice"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Event Selector */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t-2 border-t-navy-800">
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-navy-950 mb-1.5">
            Focus Event for Impact Accounting
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSearchParams({ event_id: e.target.value })}
            className="w-full rounded-md border border-slate-300 py-2 px-3 text-xs font-medium bg-white text-navy-950 focus:border-navy-700 focus:outline-none"
          >
            {eventsList.map((e) => (
              <option key={e.event_id} value={e.event_id}>
                [{e.event_code}] {e.title}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchImpacts}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Refresh Impacts
        </Button>
      </div>

      {/* Impacts Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden border-t-2 border-t-navy-800">
        <div className="border-b border-slate-100 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-navy-950">
              Verified & Estimated Impacts
            </h2>
            <p className="text-xs text-slate-500">
              Granular impact units associated with the selected incident.
            </p>
          </div>
          <Badge variant="neutral">
            {impacts.length} record(s)
          </Badge>
        </div>

        {isLoading ? (
          <div className="p-12">
            <LoadingSpinner label="Compiling impact records..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-3.5">Impact Type</th>
                  <th className="px-5 py-3.5">Quantity</th>
                  <th className="px-5 py-3.5">Unit</th>
                  <th className="px-5 py-3.5">Verification</th>
                  <th className="px-5 py-3.5">Classification</th>
                  <th className="px-5 py-3.5">Affected Target / Description</th>
                  <th className="px-5 py-3.5">Estimate Basis</th>
                  <th className="px-5 py-3.5">Recorded Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {impacts.length > 0 ? (
                  impacts.map((imp) => {
                    const target = formatAffectedTargetName(imp, {
                      locations,
                      assets,
                      services,
                      activities: scheduledActivities,
                      departments,
                    });
                    return (
                      <tr key={imp.impact_id} className="hover:bg-navy-50/30 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-navy-950">
                          {imp.impact_type_name || imp.impact_type_code}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-navy-950 text-sm">
                          {imp.quantity}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">
                          {imp.unit_name || imp.unit_code}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-xs font-semibold border ${
                              imp.verification_status === 'verified'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-amber-50 text-amber-900 border-amber-200'
                            }`}
                          >
                            {imp.verification_status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 uppercase font-bold text-slate-700 text-[11px]">
                          {imp.data_class_code}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 max-w-[240px]">
                          <div className="truncate font-semibold text-slate-900" title={target.name}>
                            {target.name}
                          </div>
                          {target.kindLabel && (
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{target.kindLabel}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 max-w-[200px] truncate" title={imp.estimate_basis || ''}>
                          {imp.estimate_basis || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-tabular">
                          {formatDate(imp.recorded_at)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => openEditModal(imp)}
                            className="font-bold text-xs text-navy-800 hover:text-navy-950 underline"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-5 py-12">
                      <EmptyState
                        title="No Impacts Recorded"
                        description="No verified or estimated campus impact units are recorded for this event."
                        actionLabel="Record Impact"
                        onAction={openAddModal}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record Impact */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setAddModalError(null);
        }}
        title="Record Incident Impact"
        description="Quantify financial loss, downtime, injured persons, or damaged property."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {addModalError && (
            <Alert
              type="error"
              title="Impact Submission Failed"
              message={addModalError}
              onClose={() => setAddModalError(null)}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="impact-page-type"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Impact Type *
              </label>
              <select
                id="impact-page-type"
                required
                value={typeCode}
                onChange={(e) => handleImpactTypeChange(e.target.value)}
                disabled={impactTypes.length === 0}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
              >
                {impactTypes.length === 0 && (
                  <option value="">Loading impact types...</option>
                )}
                {impactTypes.map((it) => (
                  <option key={it.code} value={it.code}>
                    {it.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="impact-page-unit"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Measurement Unit *
              </label>
              <select
                id="impact-page-unit"
                required
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
                disabled={units.length === 0}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
              >
                {units.length === 0 && (
                  <option value="">Loading units...</option>
                )}
                {units.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.display_name} ({u.symbol || u.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="impact-page-quantity"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Quantity *
              </label>
              <input
                id="impact-page-quantity"
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="impact-page-verification"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Verification Status *
              </label>
              <select
                id="impact-page-verification"
                required
                value={verifStatus}
                onChange={(e) => setVerifStatus(e.target.value as 'verified' | 'estimated')}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
              >
                <option value="verified">Verified (Official documentation)</option>
                <option value="estimated">Estimated (Preliminary assessment)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="impact-page-data-class"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Data Classification *
              </label>
              <select
                id="impact-page-data-class"
                required
                value={dataClassCode}
                onChange={(e) => setDataClassCode(e.target.value)}
                disabled={dataClasses.length === 0}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
              >
                {dataClasses.length === 0 && (
                  <option value="">Loading classifications...</option>
                )}
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
              Affected Entity Type *
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(
                [
                  { id: 'description', label: 'Free Text' },
                  { id: 'location', label: 'Location' },
                  { id: 'asset', label: 'Asset' },
                  { id: 'service', label: 'Service' },
                  { id: 'activity', label: 'Scheduled Activity' },
                  { id: 'dept', label: 'Department' },
                ] as { id: ImpactTargetKind; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTargetKind(t.id);
                    setTargetId('');
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium border ${
                    targetKind === t.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {targetKind === 'description' && (
              <input
                id="impact-page-object-desc"
                type="text"
                required
                value={objectDesc}
                onChange={(e) => setObjectDesc(e.target.value)}
                placeholder="e.g., Computer Science Lab Equipment, 1st Floor Hallway"
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-slate-500 focus:outline-none"
              />
            )}

            {targetKind === 'location' && (
              <select
                id="impact-page-target-location"
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
              >
                <option value="">-- Choose Location --</option>
                {locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.name} ({loc.location_code})
                  </option>
                ))}
              </select>
            )}

            {targetKind === 'asset' && (
              <select
                id="impact-page-target-asset"
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
              >
                <option value="">-- Choose Asset --</option>
                {assets.map((ast) => (
                  <option key={ast.asset_id} value={ast.asset_id}>
                    {ast.name} ({ast.asset_code})
                  </option>
                ))}
              </select>
            )}

            {targetKind === 'service' && (
              <select
                id="impact-page-target-service"
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
              >
                <option value="">-- Choose Service --</option>
                {services.map((srv) => (
                  <option key={srv.service_id} value={srv.service_id}>
                    {srv.name} ({srv.service_code})
                  </option>
                ))}
              </select>
            )}

            {targetKind === 'activity' && (
              <select
                id="impact-page-target-activity"
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
              >
                <option value="">-- Choose Scheduled Activity --</option>
                {scheduledActivities.map((act) => (
                  <option key={act.scheduled_activity_id} value={act.scheduled_activity_id}>
                    {act.title} ({act.activity_code})
                  </option>
                ))}
              </select>
            )}

            {targetKind === 'dept' && (
              <select
                id="impact-page-target-dept"
                required
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
              >
                <option value="">-- Choose Department --</option>
                {departments.map((dept) => (
                  <option key={dept.department_id} value={dept.department_id}>
                    {dept.name} ({dept.department_code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {verifStatus === 'estimated' && (
            <div>
              <label
                htmlFor="impact-page-estimate-basis"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Estimate Basis *
              </label>
              <input
                id="impact-page-estimate-basis"
                type="text"
                required
                value={estimateBasis}
                onChange={(e) => setEstimateBasis(e.target.value)}
                placeholder="Methodology or source used to calculate estimate..."
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-slate-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAddModalOpen(false);
                setAddModalError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              disabled={!typeCode || !unitCode || !dataClassCode}
            >
              Save Impact
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Impact */}
      <Modal
        isOpen={editModalImpact !== null}
        onClose={() => {
          setEditModalImpact(null);
          setEditModalError(null);
        }}
        title="Update Impact Record"
        description="Modify quantity, unit, or verification parameters."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editModalError && (
            <Alert
              type="error"
              title="Update Failed"
              message={editModalError}
              onClose={() => setEditModalError(null)}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Quantity *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Unit
              </label>
              <select
                value={editUnitCode}
                onChange={(e) => setEditUnitCode(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
              >
                {units.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.display_name} ({u.symbol || u.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Verification Status
            </label>
            <select
              value={editVerifStatus}
              onChange={(e) => setEditVerifStatus(e.target.value as 'verified' | 'estimated')}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
            >
              <option value="verified">Verified</option>
              <option value="estimated">Estimated</option>
            </select>
          </div>

          {editVerifStatus === 'estimated' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Estimate Basis *
              </label>
              <input
                type="text"
                required
                value={editEstimateBasis}
                onChange={(e) => setEditEstimateBasis(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-slate-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Object Description
            </label>
            <input
              type="text"
              value={editObjectDesc}
              onChange={(e) => setEditObjectDesc(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditModalImpact(null);
                setEditModalError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isEditingSubmitting}>
              Update Impact
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

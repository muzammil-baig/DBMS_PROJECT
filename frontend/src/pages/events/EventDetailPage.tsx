import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Building,
  Calendar,
  CheckCircle2,
  Edit,
  ExternalLink,
  FileCheck,
  FileSearch,
  GitBranch,
  History,
  Plus,
  RefreshCw,
  Shield,
  XCircle,
  Zap,
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { relationshipService } from '../../services/relationshipService';
import { impactService } from '../../services/impactService';
import { evidenceService } from '../../services/evidenceService';
import { investigationService } from '../../services/investigationService';
import { referenceService } from '../../services/referenceService';
import {
  EventDetail,
  EventStatusHistoryItem,
  ImpactRead,
  InvestigationResult,
  ReferenceAsset,
  ReferenceDataClass,
  ReferenceDepartment,
  ReferenceEvidenceType,
  ReferenceImpactType,
  ReferenceLocation,
  ReferenceMeasurementUnit,
  ReferenceScheduledActivity,
  ReferenceService,
  ReferenceStatusTransition,
  RelationshipRead,
} from '../../types';
import { extractErrorMessage } from '../../services/apiClient';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Alert } from '../../components/common/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import {
  buildValidatedImpactPayload,
  formatAffectedTargetName,
  formatConfidence,
  formatDate,
  getActiveReferenceItems,
  getDefaultDataClassCode,
  getDefaultUnitForImpactType,
  getSeverityBadgeProps,
  getStatusBadgeProps,
  ImpactTargetKind,
} from '../../utils/formatters';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // Core Data
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [historyItems, setHistoryItems] = useState<EventStatusHistoryItem[]>([]);
  const [relationships, setRelationships] = useState<RelationshipRead[]>([]);
  const [impacts, setImpacts] = useState<ImpactRead[]>([]);
  const [rootCauses, setRootCauses] = useState<InvestigationResult | null>(null);
  const [validTransitions, setValidTransitions] = useState<ReferenceStatusTransition[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'relationships' | 'impacts' | 'investigation' | 'history'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Status Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Close / Void Modal State
  const [terminalModalType, setTerminalModalType] = useState<'close' | 'void' | null>(null);
  const [terminalReason, setTerminalReason] = useState('');
  const [isTerminalSubmitting, setIsTerminalSubmitting] = useState(false);

  // Add Impact Modal State
  const [addImpactOpen, setAddImpactOpen] = useState(false);
  const [impactTypeCode, setImpactTypeCode] = useState('');
  const [impactQty, setImpactQty] = useState('1');
  const [impactUnitCode, setImpactUnitCode] = useState('');
  const [impactDataClassCode, setImpactDataClassCode] = useState('');
  const [impactVerifStatus, setImpactVerifStatus] = useState<'verified' | 'estimated'>('verified');
  const [impactEstimateBasis, setImpactEstimateBasis] = useState('');
  const [impactObjectDesc, setImpactObjectDesc] = useState('');
  const [impactTargetKind, setImpactTargetKind] = useState<ImpactTargetKind>('description');
  const [impactTargetId, setImpactTargetId] = useState('');
  const [impactError, setImpactError] = useState<string | null>(null);
  const [impactTypes, setImpactTypes] = useState<ReferenceImpactType[]>([]);
  const [measurementUnits, setMeasurementUnits] = useState<ReferenceMeasurementUnit[]>([]);
  const [locations, setLocations] = useState<ReferenceLocation[]>([]);
  const [assets, setAssets] = useState<ReferenceAsset[]>([]);
  const [services, setServices] = useState<ReferenceService[]>([]);
  const [departments, setDepartments] = useState<ReferenceDepartment[]>([]);
  const [scheduledActivities, setScheduledActivities] = useState<ReferenceScheduledActivity[]>([]);
  const [isSubmittingImpact, setIsSubmittingImpact] = useState(false);

  // Add Evidence Modal State (attached to a relationship)
  const [evidenceModalRelId, setEvidenceModalRelId] = useState<string | null>(null);
  const [evidenceTypeCode, setEvidenceTypeCode] = useState('');
  const [evidenceDataClassCode, setEvidenceDataClassCode] = useState('');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [evidenceRef, setEvidenceRef] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceTypes, setEvidenceTypes] = useState<ReferenceEvidenceType[]>([]);
  const [dataClasses, setDataClasses] = useState<ReferenceDataClass[]>([]);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

  // Relationship Confirm / Downgrade Modal State
  const [relActionModal, setRelActionModal] = useState<{
    relId: string;
    type: 'confirm' | 'downgrade';
  } | null>(null);
  const [relActionReason, setRelActionReason] = useState('');
  const [relDowngradeStatus, setRelDowngradeStatus] = useState<'suspected' | 'rejected_unrelated'>('suspected');
  const [isSubmittingRelAction, setIsSubmittingRelAction] = useState(false);

  const loadEvidenceReferences = async (forceFresh = false) => {
    const [evRes, dcRes, itRes, muRes, locRes, astRes, srvRes, deptRes, actRes] = await Promise.allSettled([
      referenceService.getReference<ReferenceEvidenceType>('evidence_types', forceFresh),
      referenceService.getReference<ReferenceDataClass>('data_classes', forceFresh),
      referenceService.getReference<ReferenceImpactType>('impact_types', forceFresh),
      referenceService.getReference<ReferenceMeasurementUnit>('measurement_units', forceFresh),
      referenceService.getReference<ReferenceLocation>('locations', forceFresh),
      referenceService.getReference<ReferenceAsset>('assets', forceFresh),
      referenceService.getReference<ReferenceService>('services', forceFresh),
      referenceService.getReference<ReferenceDepartment>('departments', forceFresh),
      referenceService.getReference<ReferenceScheduledActivity>('scheduled_activities', forceFresh),
    ]);

    if (evRes.status === 'fulfilled') {
      const activeEvTypes = getActiveReferenceItems(evRes.value);
      setEvidenceTypes(activeEvTypes);
      if (activeEvTypes.length > 0) {
        setEvidenceTypeCode((prev) =>
          activeEvTypes.some((t) => t.code === prev) ? prev : activeEvTypes[0].code
        );
      }
    }

    if (dcRes.status === 'fulfilled') {
      const activeDataClasses = getActiveReferenceItems(dcRes.value);
      setDataClasses(activeDataClasses);
      const defaultDc = getDefaultDataClassCode(activeDataClasses);
      if (defaultDc) {
        setEvidenceDataClassCode((prev) =>
          activeDataClasses.some((d) => d.code === prev) ? prev : defaultDc
        );
        setImpactDataClassCode((prev) =>
          activeDataClasses.some((d) => d.code === prev) ? prev : defaultDc
        );
      }
    }

    const activeTypes = itRes.status === 'fulfilled' ? getActiveReferenceItems(itRes.value) : [];
    const activeUnits = muRes.status === 'fulfilled' ? getActiveReferenceItems(muRes.value) : [];

    if (itRes.status === 'fulfilled') setImpactTypes(activeTypes);
    if (muRes.status === 'fulfilled') setMeasurementUnits(activeUnits);
    if (locRes.status === 'fulfilled') setLocations(getActiveReferenceItems(locRes.value));
    if (astRes.status === 'fulfilled') setAssets(astRes.value);
    if (srvRes.status === 'fulfilled') setServices(srvRes.value);
    if (deptRes.status === 'fulfilled') setDepartments(getActiveReferenceItems(deptRes.value));
    if (actRes.status === 'fulfilled') setScheduledActivities(actRes.value);

    if (itRes.status === 'fulfilled' && activeTypes.length > 0) {
      const nextType = activeTypes.some((t) => t.code === impactTypeCode) ? impactTypeCode : activeTypes[0].code;
      setImpactTypeCode(nextType);
      if (muRes.status === 'fulfilled' && activeUnits.length > 0) {
        setImpactUnitCode((prev) =>
          activeUnits.some((u) => u.code === prev)
            ? prev
            : getDefaultUnitForImpactType(nextType, activeTypes, activeUnits)
        );
      }
    } else if (muRes.status === 'fulfilled' && activeUnits.length > 0) {
      setImpactUnitCode((prev) => (activeUnits.some((u) => u.code === prev) ? prev : activeUnits[0].code));
    }

    return { evRes, dcRes, itRes, muRes, deptRes };
  };

  const loadAllEventData = async () => {
    if (!eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [evtData, histData, relsData, impsData, transitions] = await Promise.all([
        eventService.getEvent(eventId),
        eventService.getStatusHistory(eventId).catch(() => []),
        relationshipService.listEventRelationships(eventId).catch(() => []),
        impactService.listImpacts(eventId).catch(() => []),
        referenceService.getStatusTransitions().catch(() => []),
      ]);

      setEvent(evtData);
      setHistoryItems(histData);
      setRelationships(relsData);
      setImpacts(impsData);

      // Find valid transitions from current status
      const currStatus = evtData.status_code;
      const available = transitions.filter(
        (t) => t.from_status_code === currStatus && t.is_active
      );
      setValidTransitions(available);
      if (available.length > 0) {
        setTargetStatus(available[0].to_status_code);
      }

      // Pre-load reference lists for impacts and evidence
      await loadEvidenceReferences();

      // Root causes for investigation
      investigationService
        .getRootCauses(eventId, 'confirmed_only')
        .then((rc) => setRootCauses(rc))
        .catch(() => setRootCauses(null));
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load incident record.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllEventData();
  }, [eventId]);

  // Handle Non-terminal Status Change
  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !targetStatus || !statusReason.trim()) return;

    setIsUpdatingStatus(true);
    setError(null);
    try {
      const updated = await eventService.changeStatus(eventId, targetStatus, statusReason.trim());
      setEvent(updated);
      setStatusModalOpen(false);
      setStatusReason('');
      setSuccessMessage(`Status updated to ${targetStatus}.`);
      loadAllEventData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to update event status.'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Terminal Close / Void
  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !terminalModalType || !terminalReason.trim()) return;

    setIsTerminalSubmitting(true);
    setError(null);
    try {
      let updated: EventDetail;
      if (terminalModalType === 'close') {
        updated = await eventService.closeEvent(eventId, terminalReason.trim());
        setSuccessMessage('Incident has been officially closed.');
      } else {
        updated = await eventService.voidEvent(eventId, terminalReason.trim());
        setSuccessMessage('Incident has been marked void in provenance history.');
      }
      setEvent(updated);
      setTerminalModalType(null);
      setTerminalReason('');
      loadAllEventData();
    } catch (err) {
      setError(extractErrorMessage(err, `Failed to ${terminalModalType} event.`));
    } finally {
      setIsTerminalSubmitting(false);
    }
  };

  const handleImpactTypeChange = (nextTypeCode: string) => {
    setImpactTypeCode(nextTypeCode);
    const defaultUnit = getDefaultUnitForImpactType(nextTypeCode, impactTypes, measurementUnits);
    if (defaultUnit) {
      setImpactUnitCode(defaultUnit);
    }
  };

  const openAddImpactModal = async () => {
    setImpactError(null);
    setImpactQty('1');
    setImpactEstimateBasis('');
    setImpactObjectDesc('');
    setImpactTargetId('');
    const defaultDc = getDefaultDataClassCode(dataClasses);
    if (defaultDc) {
      setImpactDataClassCode(defaultDc);
    }
    if (impactTypes.length > 0) {
      const nextType = impactTypes.some((t) => t.code === impactTypeCode)
        ? impactTypeCode
        : impactTypes[0].code;
      setImpactTypeCode(nextType);
      const defaultUnit = getDefaultUnitForImpactType(nextType, impactTypes, measurementUnits);
      if (defaultUnit) setImpactUnitCode(defaultUnit);
    }
    setAddImpactOpen(true);

    if (
      impactTypes.length === 0 ||
      measurementUnits.length === 0 ||
      dataClasses.length === 0 ||
      departments.length === 0
    ) {
      const refs = await loadEvidenceReferences(true);
      const failed = [refs.itRes, refs.muRes, refs.dcRes, refs.deptRes].find(
        (r) => r.status === 'rejected'
      ) as PromiseRejectedResult | undefined;
      if (failed) {
        setImpactError(extractErrorMessage(failed.reason, 'Failed to load impact reference data.'));
      }
    }
  };

  // Handle Add Impact
  const handleAddImpactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImpactError(null);
    if (!eventId) return;

    const { payload, error: validationError } = buildValidatedImpactPayload({
      impactTypeCode,
      unitCode: impactUnitCode,
      dataClassCode: impactDataClassCode,
      quantity: impactQty,
      verificationStatus: impactVerifStatus,
      estimateBasis: impactEstimateBasis,
      targetKind: impactTargetKind,
      targetId: impactTargetId,
      objectDescription: impactObjectDesc,
      impactTypes,
      units: measurementUnits,
      dataClasses,
      locations,
      assets,
      services,
      activities: scheduledActivities,
      departments,
    });

    if (validationError || !payload) {
      setImpactError(validationError || 'Invalid impact form input.');
      return;
    }

    setIsSubmittingImpact(true);
    setError(null);
    try {
      await impactService.addImpact(eventId, payload);
      setAddImpactOpen(false);
      setImpactQty('1');
      setImpactEstimateBasis('');
      setImpactObjectDesc('');
      setImpactTargetId('');
      setImpactError(null);
      setSuccessMessage('Impact record added successfully.');
      await loadAllEventData();
    } catch (err) {
      setImpactError(extractErrorMessage(err, 'Failed to record impact.'));
    } finally {
      setIsSubmittingImpact(false);
    }
  };

  const openEvidenceModal = async (relId: string) => {
    setEvidenceError(null);
    setEvidenceDesc('');
    setEvidenceRef('');
    setEvidenceUrl('');
    const defaultDc = getDefaultDataClassCode(dataClasses);
    if (defaultDc) {
      setEvidenceDataClassCode(defaultDc);
    }
    setEvidenceModalRelId(relId);

    if (dataClasses.length === 0 || evidenceTypes.length === 0) {
      const refs = await loadEvidenceReferences(true);
      if (refs.dcRes.status === 'rejected') {
        setEvidenceError(extractErrorMessage(refs.dcRes.reason, 'Failed to load data classifications.'));
      } else if (refs.evRes.status === 'rejected') {
        setEvidenceError(extractErrorMessage(refs.evRes.reason, 'Failed to load evidence types.'));
      }
    }
  };

  const closeEvidenceModal = () => {
    setEvidenceModalRelId(null);
    setEvidenceError(null);
  };

  const selectedEvidenceType = evidenceTypes.find((et) => et.code === evidenceTypeCode);

  // Handle Add Evidence to Relationship
  const handleAddEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvidenceError(null);

    if (!evidenceModalRelId) {
      setEvidenceError('No relationship selected.');
      return;
    }
    if (!evidenceTypeCode) {
      setEvidenceError('Evidence type is required.');
      return;
    }
    if (!evidenceDataClassCode) {
      setEvidenceError('Data classification is required.');
      return;
    }
    if (!evidenceDesc.trim()) {
      setEvidenceError('Evidence description is required.');
      return;
    }
    if (selectedEvidenceType?.requires_reference && !evidenceRef.trim() && !evidenceUrl.trim()) {
      setEvidenceError('This evidence type requires a source reference or source URL.');
      return;
    }

    setIsSubmittingEvidence(true);
    setError(null);
    try {
      await evidenceService.addEvidence(evidenceModalRelId, {
        evidence_type_code: evidenceTypeCode,
        description: evidenceDesc.trim(),
        source_reference: evidenceRef.trim() || null,
        source_url: evidenceUrl.trim() || null,
        data_class_code: evidenceDataClassCode,
      });
      setEvidenceModalRelId(null);
      setEvidenceDesc('');
      setEvidenceRef('');
      setEvidenceUrl('');
      setEvidenceError(null);
      setSuccessMessage('Evidence attached to relationship successfully.');
      await loadAllEventData();
    } catch (err) {
      setEvidenceError(extractErrorMessage(err, 'Failed to attach evidence.'));
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  // Handle Relationship Confirm or Downgrade
  const handleRelActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relActionModal || !relActionReason.trim()) return;

    setIsSubmittingRelAction(true);
    setError(null);
    try {
      if (relActionModal.type === 'confirm') {
        await relationshipService.confirmRelationship(
          relActionModal.relId,
          relActionReason.trim()
        );
        setSuccessMessage('Relationship confirmed.');
      } else {
        await relationshipService.downgradeRelationship(
          relActionModal.relId,
          relDowngradeStatus,
          relActionReason.trim()
        );
        setSuccessMessage(`Relationship status updated to ${relDowngradeStatus}.`);
      }
      setRelActionModal(null);
      setRelActionReason('');
      loadAllEventData();
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to update relationship status.'));
    } finally {
      setIsSubmittingRelAction(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading incident dossier..." fullHeight />;
  }

  if (!event) {
    return (
      <EmptyState
        title="Incident Record Not Found"
        description="The requested campus event ID does not exist or has been removed."
        actionLabel="Back to Events"
        onAction={() => navigate('/events')}
      />
    );
  }

  const statusBadge = getStatusBadgeProps(event.status_code);
  const severityBadge = getSeverityBadgeProps(event.severity_code);
  const isTerminal = event.is_terminal || event.status_code === 'closed' || event.status_code === 'void';

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Incident Registry', path: '/events' },
          { label: event.event_code },
        ]}
      />

      {/* Institutional Dossier Header Banner */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs border-t-4 border-t-navy-950">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-navy-900 bg-navy-50 px-2 py-0.5 rounded border border-navy-200/80">
                {event.event_code}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold border ${severityBadge.bg} ${severityBadge.text} ${severityBadge.border}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${severityBadge.dotColor}`} />
                {severityBadge.label} Severity
              </span>
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
              >
                {statusBadge.label}
              </span>
              <span className="text-[11px] text-gold-700 uppercase tracking-widest font-bold">
                {event.category_name || event.category_code}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-navy-950">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-navy-700" />
                <span>Recorded:</span> <span className="font-tabular text-slate-800">{formatDate(event.started_at)}</span>
              </span>
              {event.location_name && (
                <span className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-navy-700" />
                  <span className="text-slate-800">{event.location_name}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-navy-700" />
                <span>Classification:</span> <span className="uppercase font-bold text-navy-900 bg-slate-100 px-1.5 py-0.2 rounded">{event.data_class_code}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/events/${event.event_id}/edit`)}
              disabled={isTerminal}
              leftIcon={<Edit className="h-3.5 w-3.5" />}
            >
              Edit Dossier
            </Button>

            {!isTerminal && validTransitions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusModalOpen(true)}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Advance Status
              </Button>
            )}

            {!isTerminal && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTerminalModalType('close')}
                leftIcon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />}
              >
                Close Event
              </Button>
            )}

            {!isTerminal && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setTerminalModalType('void')}
                leftIcon={<XCircle className="h-3.5 w-3.5" />}
              >
                Void
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={loadAllEventData}
              title="Reload details"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          title="Operation Notice"
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

      {/* University Academic Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview & Context', icon: FileCheck },
            { id: 'relationships', label: `Relationships (${relationships.length})`, icon: GitBranch },
            { id: 'impacts', label: `Impacts (${impacts.length})`, icon: Zap },
            { id: 'investigation', label: 'Root Cause & Radius', icon: FileSearch },
            { id: 'history', label: `Audit Timeline (${historyItems.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 border-b-2 py-3 text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-navy-950 text-navy-950 font-bold'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-navy-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-navy-900' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: Overview & Context */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs border-t-2 border-t-navy-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950 border-b border-slate-100 pb-2">
                Official Incident Description
              </h2>
              <p className="mt-3 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
              {event.source_note && (
                <div className="mt-4 rounded-md bg-navy-50/60 p-3 text-xs text-navy-950 border border-navy-200/60">
                  <span className="font-bold text-navy-900">Intake Source Note: </span>
                  {event.source_note}
                </div>
              )}
            </div>

            {/* Quick Investigation Report Card */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs flex items-center justify-between border-t-2 border-t-navy-800">
              <div>
                <h3 className="text-sm font-bold text-navy-950">
                  Institutional Investigation Dossier & Provenance Report
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full synthesized report including graph traversal, timeline provenance, and quantitative impacts.
                </p>
              </div>
              <Link
                to={`/reports/investigation/${event.event_id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-navy-900 bg-navy-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-navy-800 shadow-xs transition-colors shrink-0"
              >
                <span>View Full Dossier</span>
                <ExternalLink className="h-3.5 w-3.5 text-gold-400" />
              </Link>
            </div>
          </div>

          {/* Operational Context Sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs space-y-4 border-t-2 border-t-navy-800">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-navy-950 border-b border-slate-100 pb-2">
                Linked Context Entities
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="block text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Campus Location</span>
                  <span className="font-semibold text-navy-950">
                    {event.location_name || '—'}
                  </span>
                </div>

                <div>
                  <span className="block text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Linked Physical Asset</span>
                  <span className="font-semibold text-navy-950">
                    {event.asset_name || '—'}
                  </span>
                </div>

                <div>
                  <span className="block text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Critical Campus Service</span>
                  <span className="font-semibold text-navy-950">
                    {event.service_name || '—'}
                  </span>
                </div>

                <div>
                  <span className="block text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Scheduled Academic Activity</span>
                  <span className="font-semibold text-navy-950">
                    {event.scheduled_activity_title || '—'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="block text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Last Ledger Modification</span>
                  <span className="font-mono text-[11px] font-medium text-slate-700">
                    {formatDate(event.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Relationships */}
      {activeTab === 'relationships' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy-950">
                Event Causal Relationships & Cascading Provenance
              </h2>
              <p className="text-xs text-slate-500">
                Directed connections identifying upstream causes and downstream cascading consequences.
              </p>
            </div>
            <Link
              to={`/relationships?cause_event_id=${event.event_id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-navy-800 shadow-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Link Relationship</span>
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden border-t-2 border-t-navy-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-5 py-3.5">Causal Role</th>
                    <th className="px-5 py-3.5">Connected Event</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Confidence</th>
                    <th className="px-5 py-3.5">Explanation</th>
                    <th className="px-5 py-3.5">Evidence</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {relationships.length > 0 ? (
                    relationships.map((rel) => {
                      const isCause = rel.cause_event_id === event.event_id;
                      const otherEventId = isCause ? rel.effect_event_id : rel.cause_event_id;
                      const otherEventCode = isCause ? rel.effect_event_code : rel.cause_event_code;
                      const otherEventTitle = isCause ? rel.effect_title : rel.cause_title;

                      return (
                        <tr key={rel.relationship_id} className="hover:bg-navy-50/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold border ${
                                isCause
                                  ? 'bg-gold-50 text-gold-900 border-gold-300'
                                  : 'bg-navy-50 text-navy-900 border-navy-200'
                              }`}
                            >
                              {isCause ? 'Cause → Effect' : 'Effect ← Cause'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <Link
                              to={`/events/${otherEventId}`}
                              className="font-mono font-bold text-navy-900 hover:underline"
                            >
                              {otherEventCode || 'Event'}
                            </Link>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px] font-medium">
                              {otherEventTitle}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-xs font-semibold border ${
                                rel.relationship_status_code === 'confirmed'
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                  : rel.relationship_status_code === 'suspected'
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {rel.relationship_status_code}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold font-tabular text-navy-950">
                            {formatConfidence(rel.confidence_score)}
                          </td>
                          <td className="px-5 py-3.5 max-w-[200px] text-slate-600 truncate">
                            {rel.explanation}
                          </td>
                          <td className="px-5 py-3.5 font-tabular font-semibold text-slate-800">
                            {rel.evidence_count ?? 0}
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => openEvidenceModal(rel.relationship_id)}
                              className="text-xs font-bold text-navy-800 hover:text-navy-950 underline"
                            >
                              + Evidence
                            </button>
                            {rel.relationship_status_code !== 'confirmed' && (
                              <button
                                onClick={() =>
                                  setRelActionModal({
                                    relId: rel.relationship_id,
                                    type: 'confirm',
                                  })
                                }
                                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
                              >
                                Confirm
                              </button>
                            )}
                            {rel.relationship_status_code === 'confirmed' && (
                              <button
                                onClick={() =>
                                  setRelActionModal({
                                    relId: rel.relationship_id,
                                    type: 'downgrade',
                                  })
                                }
                                className="text-xs font-bold text-amber-800 hover:text-amber-950 underline"
                              >
                                Downgrade
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                        No causal relationships linked to this event yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Impacts */}
      {activeTab === 'impacts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy-950">
                Recorded Campus Impacts & Disruptions
              </h2>
              <p className="text-xs text-slate-500">
                Quantifiable disruptions, financial estimates, downtime, and affected campus assets.
              </p>
            </div>
            <Button
              size="sm"
              onClick={openAddImpactModal}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Impact
            </Button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden border-t-2 border-t-navy-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-5 py-3.5">Impact Type</th>
                    <th className="px-5 py-3.5">Quantity</th>
                    <th className="px-5 py-3.5">Unit</th>
                    <th className="px-5 py-3.5">Verification</th>
                    <th className="px-5 py-3.5">Classification</th>
                    <th className="px-5 py-3.5">Affected Target / Entity</th>
                    <th className="px-5 py-3.5">Basis</th>
                    <th className="px-5 py-3.5">Recorded At</th>
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
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                        No impact records linked to this incident.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Investigation & Root Causes */}
      {activeTab === 'investigation' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs border-t-2 border-t-navy-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950 border-b border-slate-100 pb-2">
              Recursive Root Cause Analysis
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Recursive graph analysis traversing backward in time across confirmed causal relationships.
            </p>

            {rootCauses && rootCauses.nodes && rootCauses.nodes.length > 0 ? (
              <div className="mt-4 space-y-3">
                <div className="text-xs text-slate-600 italic bg-navy-50/50 p-2.5 rounded border border-navy-100">
                  {rootCauses.uniqueness_note}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {rootCauses.nodes.map((node) => (
                    <div
                      key={node.event_id}
                      className="rounded-md border border-slate-200 p-4 bg-slate-50 hover:border-navy-300 hover:bg-navy-50/20 transition-all shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/events/${node.event_id}`}
                          className="font-mono text-xs font-bold text-navy-900 bg-navy-50 px-2 py-0.5 rounded border border-navy-200/80 hover:underline"
                        >
                          {node.event_code}
                        </Link>
                        <Badge variant="info">Depth: {node.minimum_depth}</Badge>
                      </div>
                      <div className="mt-2 text-xs font-bold text-navy-950">
                        {node.title}
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500 font-medium">
                        Causal Path Steps: <span className="font-semibold text-slate-700">{node.path_event_ids?.length || 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-slate-400">
                No upstream root causes identified through confirmed relationships.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Status History Timeline */}
      {activeTab === 'history' && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs border-t-2 border-t-navy-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950 border-b border-slate-100 pb-2">
            Provenance Audit History & Immutable Transitions
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Immutable transition audit trail recorded with forensic operational reasoning.
          </p>

          <div className="mt-6 flow-root">
            <ul className="-mb-8">
              {historyItems.map((item, idx) => {
                const isLast = idx === historyItems.length - 1;
                const statusProps = getStatusBadgeProps(item.new_status_code);

                return (
                  <li key={item.history_id}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span
                          className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-navy-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-navy-950 text-gold-400 flex items-center justify-center ring-8 ring-white text-xs font-bold shadow-xs">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-xs font-semibold text-navy-950">
                              Status transitioned to{' '}
                              <span
                                className={`inline-block rounded px-2 py-0.5 text-xs font-bold border ${statusProps.bg} ${statusProps.text} ${statusProps.border}`}
                              >
                                {statusProps.label}
                              </span>
                              {item.old_status_code && (
                                <span className="text-slate-400 font-normal">
                                  {' '}
                                  (from {item.old_status_code})
                                </span>
                              )}
                            </p>
                            <p className="mt-1.5 text-xs text-slate-800 bg-navy-50/50 p-3 rounded-md border border-navy-100/80 leading-relaxed">
                              "{item.reason}"
                            </p>
                          </div>
                          <div className="whitespace-nowrap text-right text-xs text-slate-500 font-tabular">
                            {formatDate(item.changed_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Modal: Advance Status */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Advance Incident Status"
        description="Select a permitted workflow transition and record mandatory operational reasoning."
      >
        <form onSubmit={handleStatusChangeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-950 mb-1.5">
              Target Status
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="w-full rounded-md border border-slate-300 py-2 px-3 text-xs font-medium text-slate-800 bg-white focus:border-navy-700 focus:outline-none"
            >
              {validTransitions.map((t) => (
                <option key={t.to_status_code} value={t.to_status_code}>
                  {t.to_status_code} {t.description ? `— ${t.description}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-950 mb-1.5">
              Operational Reason *
            </label>
            <textarea
              required
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="State the findings or rationale for this status progression..."
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-navy-700 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isUpdatingStatus}>
              Confirm Transition
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Terminal Action (Close / Void) */}
      <Modal
        isOpen={terminalModalType !== null}
        onClose={() => setTerminalModalType(null)}
        title={terminalModalType === 'close' ? 'Close Incident' : 'Void Incident'}
        description={
          terminalModalType === 'close'
            ? 'Closing marks the incident as formally concluded. A closing reason is recorded in provenance history.'
            : 'Voiding marks an erroneous or voided report. Events cannot be hard deleted.'
        }
      >
        <form onSubmit={handleTerminalSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Mandatory Reason *
            </label>
            <textarea
              required
              rows={3}
              value={terminalReason}
              onChange={(e) => setTerminalReason(e.target.value)}
              placeholder={
                terminalModalType === 'close'
                  ? 'Resolution details, remedial actions completed...'
                  : 'Reason for voiding this incident record...'
              }
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTerminalModalType(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={terminalModalType === 'close' ? 'primary' : 'destructive'}
              isLoading={isTerminalSubmitting}
            >
              Confirm {terminalModalType === 'close' ? 'Closure' : 'Void'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Impact */}
      <Modal
        isOpen={addImpactOpen}
        onClose={() => {
          setAddImpactOpen(false);
          setImpactError(null);
        }}
        title="Record Incident Impact"
        description="Quantify damages, operational disruption, financial loss, or safety consequences."
      >
        <form onSubmit={handleAddImpactSubmit} className="space-y-4">
          {impactError && (
            <Alert
              type="error"
              title="Impact Submission Failed"
              message={impactError}
              onClose={() => setImpactError(null)}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="event-detail-impact-type"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Impact Type *
              </label>
              <select
                id="event-detail-impact-type"
                required
                value={impactTypeCode}
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
                htmlFor="event-detail-impact-unit"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Measurement Unit *
              </label>
              <select
                id="event-detail-impact-unit"
                required
                value={impactUnitCode}
                onChange={(e) => setImpactUnitCode(e.target.value)}
                disabled={measurementUnits.length === 0}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
              >
                {measurementUnits.length === 0 && (
                  <option value="">Loading units...</option>
                )}
                {measurementUnits.map((mu) => (
                  <option key={mu.code} value={mu.code}>
                    {mu.display_name} ({mu.symbol || mu.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="event-detail-impact-quantity"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Quantity *
              </label>
              <input
                id="event-detail-impact-quantity"
                type="number"
                step="any"
                min="0"
                required
                value={impactQty}
                onChange={(e) => setImpactQty(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="event-detail-impact-verification"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Verification Status *
              </label>
              <select
                id="event-detail-impact-verification"
                required
                value={impactVerifStatus}
                onChange={(e) => setImpactVerifStatus(e.target.value as 'verified' | 'estimated')}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
              >
                <option value="verified">Verified</option>
                <option value="estimated">Estimated</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="event-detail-impact-data-class"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Data Classification *
              </label>
              <select
                id="event-detail-impact-data-class"
                required
                value={impactDataClassCode}
                onChange={(e) => setImpactDataClassCode(e.target.value)}
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
                    setImpactTargetKind(t.id);
                    setImpactTargetId('');
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium border ${
                    impactTargetKind === t.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {impactTargetKind === 'description' && (
              <input
                id="event-detail-impact-object-desc"
                type="text"
                required
                value={impactObjectDesc}
                onChange={(e) => setImpactObjectDesc(e.target.value)}
                placeholder="e.g., Server Rack B, East Wing Classrooms"
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-slate-500 focus:outline-none"
              />
            )}

            {impactTargetKind === 'location' && (
              <select
                id="event-detail-impact-target-location"
                required
                value={impactTargetId}
                onChange={(e) => setImpactTargetId(e.target.value)}
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

            {impactTargetKind === 'asset' && (
              <select
                id="event-detail-impact-target-asset"
                required
                value={impactTargetId}
                onChange={(e) => setImpactTargetId(e.target.value)}
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

            {impactTargetKind === 'service' && (
              <select
                id="event-detail-impact-target-service"
                required
                value={impactTargetId}
                onChange={(e) => setImpactTargetId(e.target.value)}
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

            {impactTargetKind === 'activity' && (
              <select
                id="event-detail-impact-target-activity"
                required
                value={impactTargetId}
                onChange={(e) => setImpactTargetId(e.target.value)}
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

            {impactTargetKind === 'dept' && (
              <select
                id="event-detail-impact-target-dept"
                required
                value={impactTargetId}
                onChange={(e) => setImpactTargetId(e.target.value)}
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

          {impactVerifStatus === 'estimated' && (
            <div>
              <label
                htmlFor="event-detail-impact-estimate-basis"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Estimate Basis * (Required for Estimated Impacts)
              </label>
              <input
                id="event-detail-impact-estimate-basis"
                type="text"
                required
                value={impactEstimateBasis}
                onChange={(e) => setImpactEstimateBasis(e.target.value)}
                placeholder="e.g., Preliminary facilities damage quote, attendance log"
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
                setAddImpactOpen(false);
                setImpactError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmittingImpact}
              disabled={!impactTypeCode || !impactUnitCode || !impactDataClassCode}
            >
              Save Impact
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Evidence to Relationship */}
      <Modal
        isOpen={evidenceModalRelId !== null}
        onClose={closeEvidenceModal}
        title="Attach Evidence to Relationship"
        description="Link documents, logs, sensor data, or witness testimony supporting this causal relationship."
      >
        <form onSubmit={handleAddEvidenceSubmit} className="space-y-4">
          {evidenceError && (
            <Alert
              type="error"
              title="Evidence Submission Failed"
              message={evidenceError}
              onClose={() => setEvidenceError(null)}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="event-detail-evidence-type"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Evidence Type *
              </label>
              <select
                id="event-detail-evidence-type"
                required
                value={evidenceTypeCode}
                onChange={(e) => setEvidenceTypeCode(e.target.value)}
                disabled={evidenceTypes.length === 0}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
              >
                {evidenceTypes.length === 0 && (
                  <option value="">Loading evidence types...</option>
                )}
                {evidenceTypes.map((et) => (
                  <option key={et.code} value={et.code}>
                    {et.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="event-detail-evidence-data-class"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Data Classification *
              </label>
              <select
                id="event-detail-evidence-data-class"
                required
                value={evidenceDataClassCode}
                onChange={(e) => setEvidenceDataClassCode(e.target.value)}
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
            <label
              htmlFor="event-detail-evidence-description"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Evidence Description *
            </label>
            <textarea
              id="event-detail-evidence-description"
              required
              rows={3}
              value={evidenceDesc}
              onChange={(e) => setEvidenceDesc(e.target.value)}
              placeholder="State what this evidence demonstrates regarding the causal link..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="event-detail-evidence-source-ref"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Source Reference / Document ID{selectedEvidenceType?.requires_reference ? ' *' : ''}
            </label>
            <input
              id="event-detail-evidence-source-ref"
              type="text"
              value={evidenceRef}
              onChange={(e) => setEvidenceRef(e.target.value)}
              placeholder="e.g., DEMO-MAINT-2026-001, Security Dispatch Audio #12"
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-slate-500 focus:outline-none"
            />
            {selectedEvidenceType?.requires_reference && (
              <p className="mt-1 text-[11px] text-slate-500">
                Required for this evidence type unless a Source URL is provided.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="event-detail-evidence-source-url"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Source URL (Optional)
            </label>
            <input
              id="event-detail-evidence-source-url"
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://intranet.campus.edu/evidence/..."
              className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeEvidenceModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmittingEvidence}
              disabled={!evidenceTypeCode || !evidenceDataClassCode}
            >
              Attach Evidence
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm or Downgrade Relationship */}
      <Modal
        isOpen={relActionModal !== null}
        onClose={() => setRelActionModal(null)}
        title={
          relActionModal?.type === 'confirm'
            ? 'Confirm Causal Relationship'
            : 'Downgrade Causal Relationship'
        }
        description={
          relActionModal?.type === 'confirm'
            ? 'Confirming verifies that this relationship has supporting evidence.'
            : 'Downgrade to suspected or rejected with mandatory reason.'
        }
      >
        <form onSubmit={handleRelActionSubmit} className="space-y-4">
          {relActionModal?.type === 'downgrade' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                New Relationship Status
              </label>
              <select
                value={relDowngradeStatus}
                onChange={(e) => setRelDowngradeStatus(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 py-2 px-3 text-xs bg-white focus:border-slate-500 focus:outline-none"
              >
                <option value="suspected">Suspected (Preliminary)</option>
                <option value="rejected_unrelated">Rejected (Unrelated)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Operational Reason *
            </label>
            <textarea
              required
              rows={3}
              value={relActionReason}
              onChange={(e) => setRelActionReason(e.target.value)}
              placeholder="State the justification for this relationship status change..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRelActionModal(null)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmittingRelAction}>
              {relActionModal?.type === 'confirm' ? 'Confirm Relationship' : 'Downgrade Relationship'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

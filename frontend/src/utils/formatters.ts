import type {
  ImpactCreate,
  ImpactRead,
  ReferenceAsset,
  ReferenceDataClass,
  ReferenceDepartment,
  ReferenceImpactType,
  ReferenceLocation,
  ReferenceMeasurementUnit,
  ReferenceScheduledActivity,
  ReferenceService,
} from '../types';

/**
 * Formatting and helper utilities for CAMPUS MEMORY
 */

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Ensures timestamp has a timezone offset as required by backend Pydantic validator
 */
export function toIsoWithTz(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Maps event status codes to human readable labels and color styles
 */
export function getStatusBadgeProps(statusCode: string | null | undefined): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  const code = (statusCode || '').toLowerCase();
  switch (code) {
    case 'reported':
      return {
        label: 'Reported',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
    case 'under_investigation':
      return {
        label: 'Under Investigation',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    case 'resolved':
      return {
        label: 'Resolved',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'closed':
      return {
        label: 'Closed',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300',
      };
    case 'void':
      return {
        label: 'Voided',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    default:
      return {
        label: statusCode || 'Unknown',
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200',
      };
  }
}

/**
 * Maps severity codes to visual indicator badges
 */
export function getSeverityBadgeProps(severityCode: string | null | undefined): {
  label: string;
  bg: string;
  text: string;
  border: string;
  dotColor: string;
} {
  const code = (severityCode || '').toLowerCase();
  switch (code) {
    case 'critical':
      return {
        label: 'Critical',
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        dotColor: 'bg-red-500',
      };
    case 'high':
      return {
        label: 'High',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        dotColor: 'bg-orange-500',
      };
    case 'medium':
      return {
        label: 'Medium',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dotColor: 'bg-amber-500',
      };
    case 'low':
      return {
        label: 'Low',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dotColor: 'bg-emerald-500',
      };
    default:
      return {
        label: severityCode || 'Normal',
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-200',
        dotColor: 'bg-slate-400',
      };
  }
}

export function formatConfidence(score: number | string | null | undefined): string {
  if (score === null || score === undefined) return '—';
  const num = typeof score === 'string' ? parseFloat(score) : score;
  if (isNaN(num)) return '—';
  return `${Math.round(num * 100)}%`;
}

export function formatRoleName(roleCode: string): string {
  switch (roleCode) {
    case 'administrator':
      return 'Administrator';
    case 'event_reporter':
      return 'Incident Reporter';
    case 'event_investigator':
      return 'Incident Investigator';
    case 'decision_maker':
      return 'Decision Maker';
    default:
      return roleCode.replace(/_/g, ' ');
  }
}

export function getRoleBadgeClass(roleCode: string): string {
  switch (roleCode) {
    case 'administrator':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'event_investigator':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'decision_maker':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'event_reporter':
    default:
      return 'bg-teal-50 text-teal-700 border-teal-200';
  }
}

/**
 * Filters reference records to active entries (when is_active is provided).
 */
export function getActiveReferenceItems<T extends { is_active?: boolean }>(items: T[]): T[] {
  return items.filter((item) => item.is_active !== false);
}

/**
 * Selects the default data classification code from loaded reference options,
 * preferring 'synthetic' for demonstration evidence when present.
 */
export function getDefaultDataClassCode<T extends { code: string; is_active?: boolean }>(
  dataClasses: T[],
  preferredCode = 'synthetic'
): string {
  const active = getActiveReferenceItems(dataClasses);
  const preferred = active.find((dc) => dc.code === preferredCode);
  return preferred ? preferred.code : active[0]?.code || '';
}

export type ImpactTargetKind = 'description' | 'location' | 'asset' | 'service' | 'activity' | 'dept';

/**
 * Resolves the default active measurement unit code for a selected impact type.
 */
export function getDefaultUnitForImpactType(
  impactTypeCode: string,
  impactTypes: ReferenceImpactType[],
  units: ReferenceMeasurementUnit[]
): string {
  const activeUnits = getActiveReferenceItems(units);
  const selectedType = getActiveReferenceItems(impactTypes).find((it) => it.code === impactTypeCode);
  if (
    selectedType?.default_unit_code &&
    activeUnits.some((u) => u.code === selectedType.default_unit_code)
  ) {
    return selectedType.default_unit_code;
  }
  return activeUnits[0]?.code || '';
}

/**
 * Resolves a human-readable target name and entity kind label from an ImpactRead record.
 */
export function formatAffectedTargetName(
  imp: ImpactRead,
  refs: {
    locations?: ReferenceLocation[];
    assets?: ReferenceAsset[];
    services?: ReferenceService[];
    activities?: ReferenceScheduledActivity[];
    departments?: ReferenceDepartment[];
  }
): { name: string; kindLabel: string | null } {
  if (imp.affected_department_id) {
    const dept = refs.departments?.find((d) => d.department_id === imp.affected_department_id);
    return {
      name: dept ? dept.name : `Department (${imp.affected_department_id.slice(0, 8)}...)`,
      kindLabel: 'Department',
    };
  }
  if (imp.affected_location_id) {
    const loc = refs.locations?.find((l) => l.location_id === imp.affected_location_id);
    return {
      name: loc ? loc.name : `Location (${imp.affected_location_id.slice(0, 8)}...)`,
      kindLabel: 'Location',
    };
  }
  if (imp.affected_asset_id) {
    const ast = refs.assets?.find((a) => a.asset_id === imp.affected_asset_id);
    return {
      name: ast ? ast.name : `Asset (${imp.affected_asset_id.slice(0, 8)}...)`,
      kindLabel: 'Asset',
    };
  }
  if (imp.affected_service_id) {
    const srv = refs.services?.find((s) => s.service_id === imp.affected_service_id);
    return {
      name: srv ? srv.name : `Service (${imp.affected_service_id.slice(0, 8)}...)`,
      kindLabel: 'Service',
    };
  }
  if (imp.affected_activity_id) {
    const act = refs.activities?.find((a) => a.scheduled_activity_id === imp.affected_activity_id);
    return {
      name: act ? act.title : `Activity (${imp.affected_activity_id.slice(0, 8)}...)`,
      kindLabel: 'Scheduled Activity',
    };
  }
  if (imp.affected_object_description?.trim()) {
    return {
      name: imp.affected_object_description.trim(),
      kindLabel: 'Free Text',
    };
  }
  return { name: '—', kindLabel: null };
}

/**
 * Validates impact form inputs against active reference records and constructs
 * an ImpactCreate payload with at most one structured affected-object UUID.
 */
export function buildValidatedImpactPayload(input: {
  impactTypeCode: string;
  unitCode: string;
  dataClassCode: string;
  quantity: string;
  verificationStatus: string;
  estimateBasis: string;
  targetKind: ImpactTargetKind;
  targetId: string;
  objectDescription: string;
  impactTypes: ReferenceImpactType[];
  units: ReferenceMeasurementUnit[];
  dataClasses: ReferenceDataClass[];
  locations: ReferenceLocation[];
  assets: ReferenceAsset[];
  services: ReferenceService[];
  activities: ReferenceScheduledActivity[];
  departments: ReferenceDepartment[];
}): { payload?: ImpactCreate; error?: string } {
  const activeTypes = getActiveReferenceItems(input.impactTypes);
  const activeUnits = getActiveReferenceItems(input.units);
  const activeDataClasses = getActiveReferenceItems(input.dataClasses);

  if (!input.impactTypeCode || !activeTypes.some((it) => it.code === input.impactTypeCode)) {
    return { error: 'Please select a valid active impact type.' };
  }
  if (!input.unitCode || !activeUnits.some((u) => u.code === input.unitCode)) {
    return { error: 'Please select a valid active measurement unit.' };
  }
  if (!input.dataClassCode || !activeDataClasses.some((dc) => dc.code === input.dataClassCode)) {
    return { error: 'Please select a valid active data classification.' };
  }

  const trimmedQty = input.quantity.trim();
  const qty = Number(trimmedQty);
  if (!trimmedQty || !Number.isFinite(qty) || qty < 0) {
    return { error: 'Quantity must be a valid non-negative number.' };
  }

  if (input.verificationStatus !== 'verified' && input.verificationStatus !== 'estimated') {
    return { error: 'Verification status must be verified or estimated.' };
  }
  const trimmedBasis = input.estimateBasis.trim();
  if (input.verificationStatus === 'estimated' && !trimmedBasis) {
    return { error: 'An estimate basis is mandatory when verification status is estimated.' };
  }

  const trimmedDesc = input.objectDescription.trim();
  let affectedLocationId: string | null = null;
  let affectedAssetId: string | null = null;
  let affectedServiceId: string | null = null;
  let affectedActivityId: string | null = null;
  let affectedDepartmentId: string | null = null;
  let affectedObjectDescription: string | null = null;

  if (input.targetKind === 'description') {
    if (!trimmedDesc) {
      return { error: 'Please provide an affected object description or choose a structured entity.' };
    }
    affectedObjectDescription = trimmedDesc;
  } else {
    const id = input.targetId.trim();
    if (!id) {
      return { error: 'Please select a specific affected entity from the list.' };
    }

    if (input.targetKind === 'location') {
      const exists = getActiveReferenceItems(input.locations).some((l) => l.location_id === id);
      if (!exists) return { error: 'Selected location does not exist or is inactive.' };
      affectedLocationId = id;
    } else if (input.targetKind === 'asset') {
      const exists = input.assets.some((a) => a.asset_id === id);
      if (!exists) return { error: 'Selected asset does not exist.' };
      affectedAssetId = id;
    } else if (input.targetKind === 'service') {
      const exists = input.services.some((s) => s.service_id === id);
      if (!exists) return { error: 'Selected service does not exist.' };
      affectedServiceId = id;
    } else if (input.targetKind === 'activity') {
      const exists = input.activities.some((a) => a.scheduled_activity_id === id);
      if (!exists) return { error: 'Selected scheduled activity does not exist.' };
      affectedActivityId = id;
    } else if (input.targetKind === 'dept') {
      const exists = getActiveReferenceItems(input.departments).some((d) => d.department_id === id);
      if (!exists) return { error: 'Selected department does not exist or is inactive.' };
      affectedDepartmentId = id;
    }
  }

  const structuredIds = [
    affectedLocationId,
    affectedAssetId,
    affectedServiceId,
    affectedActivityId,
    affectedDepartmentId,
  ].filter(Boolean);

  if (structuredIds.length > 1) {
    return { error: 'At most one structured affected-object ID may be submitted.' };
  }
  if (structuredIds.length === 0 && !affectedObjectDescription) {
    return { error: 'Either one structured affected entity or a description is required.' };
  }

  return {
    payload: {
      impact_type_code: input.impactTypeCode,
      affected_location_id: affectedLocationId,
      affected_asset_id: affectedAssetId,
      affected_service_id: affectedServiceId,
      affected_activity_id: affectedActivityId,
      affected_department_id: affectedDepartmentId,
      affected_object_description: affectedObjectDescription,
      quantity: qty,
      unit_code: input.unitCode,
      verification_status: input.verificationStatus,
      estimate_basis: input.verificationStatus === 'estimated' ? trimmedBasis : null,
      data_class_code: input.dataClassCode,
    },
  };
}




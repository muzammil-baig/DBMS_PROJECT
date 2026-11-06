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


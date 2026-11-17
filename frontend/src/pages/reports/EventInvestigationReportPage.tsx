import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { EventInvestigationReport } from '../../types';
import { extractErrorMessage } from '../../services/apiClient';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import {
  formatDate,
  getSeverityBadgeProps,
  getStatusBadgeProps,
} from '../../utils/formatters';

export const EventInvestigationReportPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<EventInvestigationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await reportService.getEventInvestigationReport(eventId);
        setReport(data);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to generate investigation report.'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [eventId]);

  if (isLoading) {
    return <LoadingSpinner label="Compiling forensic investigation report..." fullHeight />;
  }

  if (!report) {
    return (
      <div className="p-8 text-center text-slate-500">
        Investigation report could not be loaded.
      </div>
    );
  }

  const { event, root_causes, blast_radius, evidence, raw_impact_totals_by_type_unit } = report;
  const statusBadge = getStatusBadgeProps(event.status_code);
  const severityBadge = getSeverityBadgeProps(event.severity_code);

  return (
    <div className="space-y-6">
      {/* Printable / Navigation Actions */}
      <div className="flex items-center justify-between no-print">
        <Breadcrumbs
          items={[
            { label: 'Reports', path: '/reports' },
            { label: 'Investigation Report' },
            { label: event.event_code },
          ]}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <Button
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Print Dossier
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          title="Notice"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Main Document Wrapper (Print-Optimized) */}
      <div className="rounded-lg border border-slate-300 border-t-4 border-t-navy-950 bg-white p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Report Official Banner */}
        <div className="border-b-2 border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-navy-900 border-b-2 border-gold-500 inline-block pb-0.5 mb-2">
              CAMPUS MEMORY • INSTITUTIONAL INVESTIGATION DOSSIER
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-950 font-serif">
              {event.title}
            </h1>
            <p className="mt-1 text-xs text-slate-500 font-mono">
              Event Code: <span className="font-semibold text-navy-900">{event.event_code}</span> • Report ID: {event.event_id}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1.5 sm:text-right">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border ${severityBadge.bg} ${severityBadge.text} ${severityBadge.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${severityBadge.dotColor}`} />
              {severityBadge.label} Severity
            </span>
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
            >
              {statusBadge.label} Status
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Certified: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Reconstruction Limitation Notice from Backend */}
        {report.reconstruction_limitation && (
          <div className="rounded-md bg-amber-50/80 p-4 border-l-4 border-amber-600 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <span className="font-bold text-amber-950">Provenance Limitation Notice: </span>
            {report.reconstruction_limitation}
          </div>
        )}

        {/* Section 1: Event Summary & Metadata */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950 border-b border-navy-100 pb-1.5">
            1. Incident Overview & Target Context
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50/70 p-4 rounded-md border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Category</span>
              <span className="font-semibold text-slate-900">
                {event.category_name || event.category_code}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Location</span>
              <span className="font-semibold text-slate-900">
                {event.location_name || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Associated Asset</span>
              <span className="font-semibold text-slate-900">
                {event.asset_name || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Classification</span>
              <span className="font-semibold uppercase text-navy-900">
                {event.data_class_code}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Started At</span>
              <span className="font-mono text-slate-800 font-medium">
                {formatDate(event.started_at)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider">Ended At</span>
              <span className="font-mono text-slate-800 font-medium">
                {event.ended_at ? formatDate(event.ended_at) : 'Active / Ongoing'}
              </span>
            </div>
          </div>

          <div className="mt-3 rounded-md bg-white p-4 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs">
            <span className="font-bold text-navy-950 block mb-1 text-[11px] uppercase tracking-wider">
              Factual Incident Statement:
            </span>
            {event.description}
          </div>
        </div>

        {/* Section 2: Upstream Root Cause Nodes */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950 border-b border-navy-100 pb-1.5 flex items-center justify-between">
            <span>2. Upstream Root Cause Provenance</span>
            <span className="text-[11px] font-mono font-normal text-slate-500 lowercase">
              mode: {root_causes?.link_mode}
            </span>
          </h2>

          {root_causes?.nodes && root_causes.nodes.length > 0 ? (
            <div className="space-y-2">
              {root_causes.nodes.map((node) => (
                <div
                  key={node.event_id}
                  className="rounded-md border border-slate-200 border-l-4 border-l-navy-800 p-3 text-xs bg-slate-50/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-navy-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {node.event_code}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-semibold text-slate-900">{node.title}</span>
                  </div>
                  <Badge variant="info">Depth: {node.minimum_depth}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">
              No preceding causal incidents identified through confirmed relationships.
            </div>
          )}
        </div>

        {/* Section 3: Downstream Blast Radius & Cumulative Impacts */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950 border-b border-navy-100 pb-1.5">
            3. Cascading Blast Radius & Downstream Impacts
          </h2>

          {blast_radius?.nodes && blast_radius.nodes.length > 0 ? (
            <div className="space-y-2">
              {blast_radius.nodes.map((node) => (
                <div
                  key={node.event_id}
                  className="rounded-md border border-slate-200 border-l-4 border-l-gold-600 p-3 text-xs bg-slate-50/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {node.event_code}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-semibold text-slate-900">{node.title}</span>
                  </div>
                  <Badge variant="warning">Depth: {node.minimum_depth}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">
              No cascading downstream incidents recorded.
            </div>
          )}

          {/* Aggregated Raw Impact Totals */}
          {raw_impact_totals_by_type_unit && raw_impact_totals_by_type_unit.length > 0 && (
            <div className="mt-4 pt-2">
              <h3 className="text-xs font-semibold text-navy-950 mb-2 uppercase tracking-wider">
                Raw Impact Totals by Type & Unit:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {raw_impact_totals_by_type_unit.map((tot, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border border-slate-200 border-t-2 border-t-navy-800 bg-white p-3 text-xs shadow-2xs"
                  >
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      {tot.impact_type_name || tot.impact_type_code}
                    </div>
                    <div className="text-base font-mono font-bold text-navy-950 mt-1">
                      {tot.total_quantity} <span className="text-xs font-normal text-slate-500">{tot.unit_name || tot.unit_code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Attached Corroborating Evidence */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy-950 border-b border-navy-100 pb-1.5">
            4. Attached Evidentiary Records
          </h2>

          {evidence && evidence.length > 0 ? (
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-navy-900/5 text-navy-950 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5">Source Reference</th>
                    <th className="px-4 py-2.5">Recorded Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {evidence.map((ev) => (
                    <tr key={ev.evidence_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-navy-950">
                        {ev.evidence_type_code}
                      </td>
                      <td className="px-4 py-2.5 max-w-sm">{ev.description}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                        {ev.source_reference || '—'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">
                        {formatDate(ev.recorded_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">
              No corroborating physical or digital evidence attached.
            </div>
          )}
        </div>

        {/* Sign-off Footer */}
        <div className="border-t-2 border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-serif">
          <div>CAMPUS MEMORY • Official Academic Incident Provenance Repository</div>
          <div className="font-mono text-[11px] text-slate-400 uppercase tracking-wider">Official Certified Archive Copy</div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { api } from '../services/api';
import {
  ApplicationCaseDetail,
  ObservationCategory,
  ObservationSeverity,
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  UserCheck,
  ArrowLeft,
  FileText,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Send,
  History,
  ShieldAlert,
  Clock,
  PlusCircle,
  RefreshCw,
  FileSearch,
} from 'lucide-react';

export const ReviewerCaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { session, showToast } = useDemo();

  const [caseData, setCaseData] = useState<ApplicationCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Action States
  const [actionInProgress, setActionInProgress] = useState(false);

  // Request Clarification Modal
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false);
  const [clarificationMessage, setClarificationMessage] = useState('');
  const [clarificationDocType, setClarificationDocType] = useState<string>('');

  // Observation Modal
  const [observationModalOpen, setObservationModalOpen] = useState(false);
  const [obsCategory, setObsCategory] = useState<ObservationCategory>('DOCUMENTATION');
  const [obsSeverity, setObsSeverity] = useState<ObservationSeverity>('INFO');
  const [obsNotes, setObsNotes] = useState('');

  // Preliminary Review Outcome Modal
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [outcomeStatus, setOutcomeStatus] = useState<'NEEDS_CLARIFICATION' | 'PRELIMINARY_REVIEW_COMPLETE'>('PRELIMINARY_REVIEW_COMPLETE');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const fetchCase = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCase(id, session);
      setCaseData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch application case.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [id, session]);

  const handleMarkUnderReview = async () => {
    if (!caseData) return;
    setActionInProgress(true);
    try {
      const updated = await api.markUnderReview(caseData.id, session);
      setCaseData(updated);
      showToast('Case marked as UNDER_REVIEW.');
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRequestClarificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !clarificationMessage.trim()) return;

    setActionInProgress(true);
    try {
      await api.requestClarification(
        caseData.id,
        {
          request_message: clarificationMessage.trim(),
          target_doc_type: clarificationDocType || undefined,
        },
        session
      );
      showToast('Clarification notice issued to institution. Status updated to NEEDS_CLARIFICATION.');
      setClarificationModalOpen(false);
      setClarificationMessage('');
      setClarificationDocType('');
      fetchCase();
    } catch (err: any) {
      alert(`Clarification issue failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleAddObservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !obsNotes.trim()) return;

    setActionInProgress(true);
    try {
      await api.addObservation(
        caseData.id,
        {
          category: obsCategory,
          severity: obsSeverity,
          notes: obsNotes.trim(),
        },
        session
      );
      showToast('Reviewer observation recorded.');
      setObservationModalOpen(false);
      setObsNotes('');
      fetchCase();
    } catch (err: any) {
      alert(`Observation recording failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRecordOutcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData) return;

    setActionInProgress(true);
    try {
      const updated = await api.recordReviewOutcome(
        caseData.id,
        outcomeStatus,
        outcomeNotes.trim(),
        session
      );
      setCaseData(updated);
      showToast(`Review outcome recorded: ${outcomeStatus}.`);
      setOutcomeModalOpen(false);
      setOutcomeNotes('');
    } catch (err: any) {
      alert(`Outcome recording failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm">Loading scrutiny case detail...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center text-red-700 space-y-4 max-w-xl mx-auto">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm font-semibold">{error || 'Case not found'}</p>
        <Link
          to="/reviewer"
          className="inline-block text-xs bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Return to Queue
        </Link>
      </div>
    );
  }

  const canMarkUnderReview = caseData.status === 'SUBMITTED' || caseData.status === 'RESUBMITTED';
  const canReview = caseData.status === 'UNDER_REVIEW';

  return (
    <div className="space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/reviewer"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Scrutiny Queue</span>
        </Link>
        <button
          onClick={fetchCase}
          className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-indigo-600 transition"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh Details</span>
        </button>
      </div>

      {/* Case Header & Scrutiny Action Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold font-mono text-slate-900">{caseData.case_ref}</h1>
              <StatusBadge status={caseData.status} size="lg" />
            </div>
            <p className="text-xs text-slate-600 mt-1">
              <span className="font-semibold text-slate-900">{caseData.institution_name}</span> ({caseData.institution_ref})
              • Academic Session: <span className="font-semibold text-slate-900">{caseData.academic_year}</span>
            </p>
          </div>

          {/* Reviewer Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {canMarkUnderReview && (
              <button
                type="button"
                disabled={actionInProgress}
                onClick={handleMarkUnderReview}
                className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs shadow transition disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                <span>Mark Under Review</span>
              </button>
            )}

            <button
              type="button"
              disabled={actionInProgress}
              onClick={() => setClarificationModalOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 font-medium px-3.5 py-2 rounded-lg text-xs transition disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Request Clarification</span>
            </button>

            <button
              type="button"
              disabled={actionInProgress}
              onClick={() => setObservationModalOpen(true)}
              className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3.5 py-2 rounded-lg text-xs transition disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4 text-slate-600" />
              <span>Add Observation</span>
            </button>

            {canReview && (
              <button
                type="button"
                disabled={actionInProgress}
                onClick={() => setOutcomeModalOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-xs shadow transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Record Review Outcome</span>
              </button>
            )}
          </div>
        </div>

        {/* Institution Info Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Program Category</span>
            <span className="font-medium text-slate-800">{caseData.category}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Discipline</span>
            <span className="font-medium text-slate-800">{caseData.program_type}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Contact Details</span>
            <span className="font-medium text-slate-800 truncate block" title={caseData.contact_email}>
              {caseData.contact_email} • {caseData.contact_phone}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Location</span>
            <span className="font-medium text-slate-800">{caseData.campus_location || 'Not Specified'}</span>
          </div>
        </div>
      </div>

      {/* Uploaded Documents Scrutiny Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSearch className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Submitted Documents & Cryptographic Hashes</h2>
          </div>
          <span className="text-xs text-slate-500">
            {caseData.documents.length} total file record(s)
          </span>
        </div>

        {caseData.documents.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No documents have been uploaded for this case.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Document Category</th>
                  <th className="py-2.5 px-3">Uploaded Filename</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">SHA-256 Digest</th>
                  <th className="py-2.5 px-3">MIME / Format Check</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Inspection Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {caseData.documents.map((doc) => (
                  <tr key={doc.id} className={doc.is_active ? 'bg-white' : 'bg-slate-50/50 opacity-70'}>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      {doc.title}
                      {doc.is_active && (
                        <span className="ml-1.5 text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 truncate max-w-[150px]">
                      {doc.original_filename}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">v{doc.version}</td>
                    <td className="py-3 px-3 font-mono text-[10px] text-slate-500 truncate max-w-[140px]" title={doc.sha256_hash}>
                      {doc.sha256_hash.substring(0, 16)}...
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ {doc.mime_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(doc.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={api.getDocumentDownloadUrl(caseData.id, doc.id, session)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded border border-indigo-200 font-medium transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Inspect File</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reviewer Preliminary Observations Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">Preliminary Review Observations & Findings</h2>
          </div>
          <button
            type="button"
            onClick={() => setObservationModalOpen(true)}
            className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Observation</span>
          </button>
        </div>

        {caseData.observations.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">No preliminary observations recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {caseData.observations.map((obs) => {
              const severityBadge = {
                INFO: 'bg-blue-50 text-blue-700 border-blue-200',
                WARNING: 'bg-amber-50 text-amber-800 border-amber-200',
                DEFICIENCY: 'bg-red-50 text-red-700 border-red-200',
              }[obs.severity];

              return (
                <div key={obs.id} className="border border-slate-200 rounded-lg p-3.5 text-xs space-y-1.5 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${severityBadge}`}>
                        {obs.severity}
                      </span>
                      <span className="font-semibold text-slate-800">{obs.category}</span>
                      <span className="text-slate-400">• Recorded by: {obs.reviewer_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(obs.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{obs.notes}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clarification Notices Log */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">Clarification Notices & Responses</h2>
          </div>
          <span className="text-xs text-slate-500">
            {caseData.clarifications.length} notice(s)
          </span>
        </div>

        {caseData.clarifications.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">No clarification notices issued for this case.</p>
        ) : (
          <div className="space-y-4">
            {caseData.clarifications.map((cl) => (
              <div key={cl.id} className="border border-slate-200 rounded-lg p-4 text-xs space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        cl.status === 'RESPONDED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {cl.status}
                    </span>
                    <span className="text-slate-600">Reviewer: {cl.reviewer_name}</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">{new Date(cl.requested_at).toLocaleString()}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-0.5">Deficiency Query:</span>
                  <p className="text-slate-700">{cl.request_message}</p>
                </div>

                {cl.response_message ? (
                  <div className="bg-purple-50/60 p-3 rounded border border-purple-200 space-y-1">
                    <div className="flex items-center justify-between text-purple-900 font-semibold">
                      <span>Institution Response ({cl.responded_by}):</span>
                      <span className="text-[10px] text-purple-700">
                        {cl.responded_at ? new Date(cl.responded_at).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-slate-800">{cl.response_message}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-800 italic">
                    ⏳ Awaiting applicant response from institution.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Case Timeline / Audit History */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Case Audit Event Log</h2>
        </div>
        <p className="text-xs text-slate-500">
          Immutable event log tracing every status transition, document intake, and reviewer decision.
        </p>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {caseData.audit_events.map((evt) => (
            <div key={evt.id} className="relative text-xs">
              <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white"></span>
              <div className="flex items-baseline space-x-2">
                <span className="font-bold text-slate-900 font-mono">{evt.action}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(evt.created_at).toLocaleString()}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                  {evt.actor_role} • {evt.actor_name}
                </span>
              </div>
              {evt.details && <p className="text-slate-600 mt-0.5">{evt.details}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Clarification Modal */}
      {clarificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Issue Clarification / Deficiency Notice</span>
              </h3>
              <button
                type="button"
                onClick={() => setClarificationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestClarificationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Targeted Document Category (Optional)
                </label>
                <select
                  value={clarificationDocType}
                  onChange={(e) => setClarificationDocType(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="">General Application Query</option>
                  <option value="LAND_BUILDING_DEED">Land & Building Ownership / Lease Deed</option>
                  <option value="PREVIOUS_EOA_LETTER">Previous Academic Year EoA Letter</option>
                  <option value="FACULTY_SALARY_STATEMENT">Faculty Salary Disbursement Statement</option>
                  <option value="FIRE_SAFETY_CERTIFICATE">Fire Safety Certificate / NOC</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deficiency Details & Specific Clarification Required *
                </label>
                <textarea
                  required
                  rows={4}
                  value={clarificationMessage}
                  onChange={(e) => setClarificationMessage(e.target.value)}
                  placeholder="Specify exact clauses, missing stamps, date discrepancies or required re-attestation..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                Notice: Issuing this clarification will immediately transition the case status to <strong>NEEDS_CLARIFICATION</strong> and alert the institution representative.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setClarificationModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress || !clarificationMessage.trim()}
                  className="inline-flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Issue Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Observation Modal */}
      {observationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Preliminary Observation</h3>
              <button
                type="button"
                onClick={() => setObservationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddObservationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={obsCategory}
                  onChange={(e) => setObsCategory(e.target.value as ObservationCategory)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="DOCUMENTATION">DOCUMENTATION</option>
                  <option value="REGULATORY_AFFILIATION">REGULATORY_AFFILIATION</option>
                  <option value="FACULTY_CADRE">FACULTY_CADRE</option>
                  <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                  <option value="GENERAL">GENERAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                <select
                  value={obsSeverity}
                  onChange={(e) => setObsSeverity(e.target.value as ObservationSeverity)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="INFO">INFO (Informational)</option>
                  <option value="WARNING">WARNING (Minor Attention)</option>
                  <option value="DEFICIENCY">DEFICIENCY (Mandatory Fix)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observation Findings / Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={obsNotes}
                  onChange={(e) => setObsNotes(e.target.value)}
                  placeholder="Record factual observation regarding institutional documentation..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setObservationModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress || !obsNotes.trim()}
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition disabled:opacity-50"
                >
                  <span>Save Observation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outcome Modal */}
      {outcomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Preliminary Review Outcome</h3>
              <button
                type="button"
                onClick={() => setOutcomeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordOutcomeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Outcome Determination *
                </label>
                <select
                  value={outcomeStatus}
                  onChange={(e) => setOutcomeStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="PRELIMINARY_REVIEW_COMPLETE">Preliminary Review Complete</option>
                  <option value="NEEDS_CLARIFICATION">Needs Clarification (Flagged)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scrutiny Remarks & Final Reviewer Notes *
                </label>
                <textarea
                  required
                  rows={4}
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="Record summary of verified checklist items, preliminary consistency findings, and scrutiny notes..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600">
                Note: In Stage 1, this records human preliminary scrutiny completion. Final regulatory approval remains subject to statutory Council guidelines.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setOutcomeModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress || !outcomeNotes.trim()}
                  className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submit Outcome</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

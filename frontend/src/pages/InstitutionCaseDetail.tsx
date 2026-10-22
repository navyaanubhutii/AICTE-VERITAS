import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { api } from '../services/api';
import { ApplicationCaseDetail, DocumentType, ApplicationDocument } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Building2,
  ArrowLeft,
  UploadCloud,
  FileText,
  FileCheck2,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Send,
  History,
  Shield,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

const CHECKLIST_ITEMS: {
  docType: DocumentType;
  title: string;
  description: string;
  mandatory: boolean;
}[] = [
  {
    docType: 'LAND_BUILDING_DEED',
    title: 'Land & Building Registered Title / Lease Deed',
    description: 'Registered title deed or registered lease deed (minimum 30 years) with survey numbers and registrar endorsement.',
    mandatory: true,
  },
  {
    docType: 'PREVIOUS_EOA_LETTER',
    title: 'Previous Academic Year AICTE Approval / EoA Letter',
    description: 'Official AICTE grant letter for previous academic session specifying approved programs and intake capacity.',
    mandatory: true,
  },
  {
    docType: 'FACULTY_SALARY_STATEMENT',
    title: 'Faculty Cadre & Salary Bank Statement',
    description: 'Bank certified salary disbursement statement along with cadre ratio adherence certificate.',
    mandatory: true,
  },
  {
    docType: 'FIRE_SAFETY_CERTIFICATE',
    title: 'Municipal / State Fire Safety Certificate & NOC',
    description: 'Valid Occupancy Certificate and Fire Safety NOC issued by competent state/municipal authority.',
    mandatory: false,
  },
];

export const InstitutionCaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { session, showToast } = useDemo();

  const [caseData, setCaseData] = useState<ApplicationCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('LAND_BUILDING_DEED');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Clarification response state
  const [selectedClarificationId, setSelectedClarificationId] = useState<string | null>(null);
  const [clarificationResponseText, setClarificationResponseText] = useState('');
  const [respondingClarification, setRespondingClarification] = useState(false);

  // Case submission state
  const [submittingCase, setSubmittingCase] = useState(false);

  const fetchCase = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCase(id, session);
      setCaseData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [id, session]);

  const handleOpenUpload = (docType: DocumentType) => {
    setSelectedDocType(docType);
    setSelectedFile(null);
    setUploadError(null);
    setUploadModalOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !selectedFile) return;

    // Client-side extension validation
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.png', '.jpg', '.jpeg'].includes(ext)) {
      setUploadError('Invalid file type. Only PDF, PNG, and JPG/JPEG files are accepted.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds maximum size of 10MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const uploadedDoc = await api.uploadDocument(
        caseData.id,
        selectedFile,
        selectedDocType,
        undefined,
        session
      );
      showToast(`Document "${uploadedDoc.title}" uploaded (v${uploadedDoc.version}).`);
      setUploadModalOpen(false);
      fetchCase();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!caseData) return;
    if (caseData.documents.length === 0) {
      alert('Please upload at least one required supporting document before submitting.');
      return;
    }

    if (!window.confirm('Are you sure you want to formally submit this application case to AICTE for review?')) {
      return;
    }

    setSubmittingCase(true);
    try {
      const updated = await api.submitCase(caseData.id, session);
      setCaseData(updated);
      showToast(`Application ${updated.case_ref} submitted successfully.`);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmittingCase(false);
    }
  };

  const handleClarificationResponseSubmit = async (clarificationId: string) => {
    if (!caseData || !clarificationResponseText.trim()) return;

    setRespondingClarification(true);
    try {
      await api.respondToClarification(caseData.id, clarificationId, clarificationResponseText.trim(), session);
      showToast('Clarification response submitted. Application resubmitted for reviewer scrutiny.');
      setSelectedClarificationId(null);
      setClarificationResponseText('');
      fetchCase();
    } catch (err: any) {
      alert(`Response error: ${err.message}`);
    } finally {
      setRespondingClarification(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
        <p className="text-sm">Loading application case detail...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center text-red-700 space-y-4 max-w-xl mx-auto">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm font-semibold">{error || 'Case not found'}</p>
        <Link
          to="/institution"
          className="inline-block text-xs bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Active documents map
  const activeDocsMap = new Map<string, ApplicationDocument>();
  caseData.documents.forEach((d) => {
    if (d.is_active && !activeDocsMap.has(d.doc_type)) {
      activeDocsMap.set(d.doc_type, d);
    }
  });

  const openClarifications = caseData.clarifications.filter((cl) => cl.status === 'OPEN');

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/institution"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Applications</span>
        </Link>
        <button
          onClick={fetchCase}
          className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-600 transition"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh Details</span>
        </button>
      </div>

      {/* Case Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold font-mono text-slate-900">{caseData.case_ref}</h1>
              <StatusBadge status={caseData.status} size="lg" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Category: <span className="font-semibold text-slate-800">{caseData.category}</span> • Academic Year: <span className="font-semibold text-slate-800">{caseData.academic_year}</span>
            </p>
          </div>

          {/* Action buttons depending on status */}
          <div className="flex items-center space-x-3">
            {caseData.status === 'DRAFT' && (
              <button
                onClick={handleSubmitApplication}
                disabled={submittingCase || caseData.documents.length === 0}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs shadow transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submittingCase ? 'Submitting...' : 'Submit Application'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Institution Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
          <div>
            <span className="text-slate-400 block mb-0.5">Institution Name</span>
            <span className="font-medium text-slate-800">{caseData.institution_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Demo Institution ID</span>
            <span className="font-mono font-medium text-slate-800">{caseData.institution_ref}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Program Type</span>
            <span className="font-medium text-slate-800">{caseData.program_type}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Campus Location</span>
            <span className="font-medium text-slate-800">{caseData.campus_location || 'Not Specified'}</span>
          </div>
        </div>
      </div>

      {/* Prominent Clarification Alert Banner (if NEEDS_CLARIFICATION) */}
      {openClarifications.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-base font-bold text-amber-900">
                Action Required: Reviewer Clarification Notice
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                The AICTE scrutiny officer has identified deficiency items that require clarification or replacement documentation.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {openClarifications.map((cl) => (
              <div key={cl.id} className="bg-white border border-amber-300 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">Issued by: {cl.reviewer_name}</span>
                  <span>{new Date(cl.requested_at).toLocaleString()}</span>
                </div>
                <div className="text-xs text-slate-800 bg-amber-50/70 p-3 rounded border border-amber-200">
                  <span className="font-semibold text-amber-900 block mb-1">Deficiency Query:</span>
                  {cl.request_message}
                </div>

                {/* Respond Box */}
                {selectedClarificationId === cl.id ? (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Institution Response / Rectification Note:
                    </label>
                    <textarea
                      rows={3}
                      value={clarificationResponseText}
                      onChange={(e) => setClarificationResponseText(e.target.value)}
                      placeholder="Enter detailed clarification explaining how the requirement has been fulfilled..."
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Tip: You may also upload a replacement document in the checklist below.
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClarificationId(null);
                            setClarificationResponseText('');
                          }}
                          className="text-xs px-3 py-1.5 text-slate-600 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={respondingClarification || !clarificationResponseText.trim()}
                          onClick={() => handleClarificationResponseSubmit(cl.id)}
                          className="inline-flex items-center space-x-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{respondingClarification ? 'Submitting...' : 'Submit Clarification'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 flex items-center justify-end space-x-2">
                    {cl.target_doc_type && (
                      <button
                        type="button"
                        onClick={() => handleOpenUpload(cl.target_doc_type as DocumentType)}
                        className="inline-flex items-center space-x-1 text-xs border border-blue-600 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Revised Document</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClarificationId(cl.id);
                        setClarificationResponseText('');
                      }}
                      className="inline-flex items-center space-x-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-1.5 rounded-lg transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Write Clarification Response</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Checklist Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden space-y-4 p-6">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Mandatory Supporting Documents Checklist</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload institutional evidence. Files must be PDF, PNG, or JPG/JPEG (maximum 10MB). SHA-256 integrity hash is computed immediately upon intake.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 pt-2">
          {CHECKLIST_ITEMS.map((item) => {
            const activeDoc = activeDocsMap.get(item.docType);
            const isUploaded = !!activeDoc;

            return (
              <div
                key={item.docType}
                className={`border rounded-xl p-4 flex flex-col justify-between transition ${
                  isUploaded ? 'bg-slate-50/60 border-slate-300' : 'bg-white border-dashed border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                        <span>{item.title}</span>
                        {item.mandatory && (
                          <span className="text-[10px] text-red-600 font-semibold">*Required</span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{item.description}</p>
                    </div>

                    {isUploaded ? (
                      <span className="inline-flex items-center text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                        <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                        Uploaded (v{activeDoc.version})
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex-shrink-0">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Active Document Details */}
                  {isUploaded && activeDoc && (
                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-mono text-slate-700">
                        <span className="truncate max-w-[200px]" title={activeDoc.original_filename}>
                          {activeDoc.original_filename}
                        </span>
                        <span>{(activeDoc.file_size_bytes / 1024).toFixed(0)} KB</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate" title={activeDoc.sha256_hash}>
                        SHA-256: {activeDoc.sha256_hash.substring(0, 20)}...
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-emerald-700 font-medium">
                          ✓ Magic byte signature verified ({activeDoc.mime_type})
                        </span>
                        <a
                          href={api.getDocumentDownloadUrl(caseData.id, activeDoc.id, session)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View/Download</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload action */}
                <div className="pt-3 mt-2 border-t border-slate-200/60 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenUpload(item.docType)}
                    className="inline-flex items-center space-x-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg transition"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isUploaded ? 'Upload New Version' : 'Upload Document'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Uploaded Documents List with Version History */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">Document Repository & Version Log</h2>
          </div>
          <span className="text-xs text-slate-500">
            {caseData.documents.length} recorded version(s)
          </span>
        </div>

        {caseData.documents.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No documents have been uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Document Title</th>
                  <th className="py-2.5 px-3">Original Filename</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">SHA-256 Digest</th>
                  <th className="py-2.5 px-3">Intake Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {caseData.documents.map((doc) => (
                  <tr key={doc.id} className={doc.is_active ? 'bg-white' : 'bg-slate-50/50 opacity-70'}>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {doc.title}
                      {doc.is_active && (
                        <span className="ml-1.5 text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 truncate max-w-[150px]">
                      {doc.original_filename}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">v{doc.version}</td>
                    <td className="py-2.5 px-3 text-slate-600">{(doc.file_size_bytes / 1024).toFixed(0)} KB</td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 truncate max-w-[140px]" title={doc.sha256_hash}>
                      {doc.sha256_hash.substring(0, 16)}...
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(doc.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <a
                        href={api.getDocumentDownloadUrl(caseData.id, doc.id, session)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Case Timeline / Audit History */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">Application Lifecycle Audit Events</h2>
        </div>
        <p className="text-xs text-slate-500">
          Server-side immutable record of state transitions, uploads, and reviewer actions.
        </p>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {caseData.audit_events.map((evt) => (
            <div key={evt.id} className="relative text-xs">
              <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white"></span>
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

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Upload Supporting Document</h3>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Category
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  {CHECKLIST_ITEMS.map((item) => (
                    <option key={item.docType} value={item.docType}>
                      {item.title}
                    </option>
                  ))}
                  <option value="OTHER_SUPPORTING">Other Supporting Affidavit / NOC</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select File (PDF, PNG, JPG/JPEG - Max 10MB) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              {selectedFile && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-semibold text-slate-800">File Selected:</p>
                  <p className="font-mono text-slate-600 truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400">
                    Size: {(selectedFile.size / 1024).toFixed(1)} KB • Type: {selectedFile.type || 'auto-detect'}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs transition disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploading ? 'Validating & Uploading...' : 'Upload Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

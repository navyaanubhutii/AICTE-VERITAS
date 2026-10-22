import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { api } from '../services/api';
import { ApplicationCaseSummary } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Building2,
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Files,
  Search,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export const InstitutionDashboard: React.FC = () => {
  const { session, showToast } = useDemo();
  const navigate = useNavigate();

  const [cases, setCases] = useState<ApplicationCaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCases(session, {
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        search: search.trim() || undefined,
      });
      setCases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [session, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  // Metrics
  const totalCases = cases.length;
  const underReviewCount = cases.filter((c) => c.status === 'UNDER_REVIEW').length;
  const requiringActionCount = cases.filter((c) => c.status === 'NEEDS_CLARIFICATION' || c.status === 'DRAFT').length;
  const completedCount = cases.filter((c) => c.status === 'PRELIMINARY_REVIEW_COMPLETE').length;

  return (
    <div className="space-y-8">
      {/* Institution Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">{session.institutionName}</h1>
              <span className="bg-blue-100 text-blue-800 text-xs font-mono font-medium px-2 py-0.5 rounded">
                {session.institutionRef}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Institutional Application Desk • Academic Year 2026–2027 Regulatory Filing
            </p>
          </div>
        </div>

        <Link
          to="/institution/new-case"
          className="inline-flex items-center justify-center space-x-2 bg-[#0B192C] hover:bg-slate-800 text-white font-medium px-4 py-2.5 rounded-lg text-sm shadow transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Application</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Total Applications</span>
            <Files className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCases}</div>
          <p className="text-[11px] text-slate-400 mt-1">Assigned to institution</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 text-xs mb-1">
            <span>Under Review</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{underReviewCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Under official scrutiny</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 text-xs mb-1">
            <span>Requiring Action</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{requiringActionCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Draft or clarification needed</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 text-xs mb-1">
            <span>Completed Review</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{completedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Preliminary review complete</p>
        </div>
      </div>

      {/* Cases Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search case reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </form>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <div className="text-xs text-slate-500">Filter:</div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="NEEDS_CLARIFICATION">Needs Clarification</option>
              <option value="RESUBMITTED">Resubmitted</option>
              <option value="PRELIMINARY_REVIEW_COMPLETE">Preliminary Review Complete</option>
            </select>
            <button
              onClick={fetchCases}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
              title="Refresh case table"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
            <span>Loading application records...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">
            <p>Error: {error}</p>
            <button
              onClick={fetchCases}
              className="mt-2 text-xs text-blue-600 underline font-medium"
            >
              Retry
            </button>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-3">
            <Files className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-medium text-slate-700">No applications found for this institution.</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click “New Application” to initiate an Extension of Approval (EoA) case for this institution.
            </p>
            <Link
              to="/institution/new-case"
              className="inline-flex items-center space-x-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Application</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Case Reference</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Academic Year</th>
                  <th className="py-3 px-4">Documents</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Next Action</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cases.map((c) => {
                  let nextActionText = 'Awaiting review';
                  if (c.status === 'DRAFT') nextActionText = 'Upload docs & submit';
                  else if (c.status === 'NEEDS_CLARIFICATION') nextActionText = 'Respond to clarification query';
                  else if (c.status === 'RESUBMITTED') nextActionText = 'Under revised scrutiny';
                  else if (c.status === 'PRELIMINARY_REVIEW_COMPLETE') nextActionText = 'Preliminary check completed';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-blue-700">
                        <Link to={`/institution/cases/${c.id}`} className="hover:underline flex items-center space-x-1">
                          <span>{c.case_ref}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{c.category}</td>
                      <td className="py-3.5 px-4 text-slate-600">{c.academic_year}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-medium text-slate-900">{c.document_count}</span> active doc(s)
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-medium ${c.status === 'NEEDS_CLARIFICATION' ? 'text-amber-800' : 'text-slate-600'}`}>
                          {nextActionText}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/institution/cases/${c.id}`}
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

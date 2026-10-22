import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { api } from '../services/api';
import { ApplicationCaseSummary } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  UserCheck,
  Search,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const ReviewerDashboard: React.FC = () => {
  const { session } = useDemo();

  const [cases, setCases] = useState<ApplicationCaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'AWAITING' | 'CLARIFICATION' | 'COMPLETED'>('ALL');

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCases(session, {
        search: search.trim() || undefined,
      });
      setCases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviewer queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [session]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  // Filter cases based on active tab
  const filteredCases = cases.filter((c) => {
    if (activeTab === 'AWAITING') return c.status === 'SUBMITTED' || c.status === 'RESUBMITTED';
    if (activeTab === 'CLARIFICATION') return c.status === 'NEEDS_CLARIFICATION';
    if (activeTab === 'COMPLETED') return c.status === 'PRELIMINARY_REVIEW_COMPLETE';
    return true;
  });

  const awaitingCount = cases.filter((c) => c.status === 'SUBMITTED' || c.status === 'RESUBMITTED').length;
  const clarificationCount = cases.filter((c) => c.status === 'NEEDS_CLARIFICATION').length;
  const completedCount = cases.filter((c) => c.status === 'PRELIMINARY_REVIEW_COMPLETE').length;

  return (
    <div className="space-y-8">
      {/* Reviewer Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 flex-shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">AICTE Reviewer Scrutiny Desk</h1>
              <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-0.5 rounded">
                Official Scrutiny Queue
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active Reviewer: <span className="font-semibold text-slate-700">{session.userName}</span> • Preliminary Validation & Human Review
            </p>
          </div>
        </div>

        <button
          onClick={fetchCases}
          className="inline-flex items-center space-x-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-slate-500 text-xs mb-1">Total Queue Cases</div>
          <div className="text-2xl font-bold text-slate-900">{cases.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">All submitted applications</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-blue-600 text-xs mb-1 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Awaiting Review</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">{awaitingCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Submitted / Resubmitted</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-amber-700 text-xs mb-1 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Needs Clarification</span>
          </div>
          <div className="text-2xl font-bold text-amber-700">{clarificationCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Pending applicant answer</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-emerald-700 text-xs mb-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Preliminary Check Done</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{completedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Scrutiny recorded</p>
        </div>
      </div>

      {/* Queue Table with Tab Filters */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Tab Selection */}
        <div className="border-b border-slate-200 flex flex-col md:flex-row items-center justify-between px-4 pt-2 gap-3">
          <div className="flex space-x-2 text-xs font-medium">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`py-3 px-3 border-b-2 transition ${
                activeTab === 'ALL'
                  ? 'border-indigo-600 text-indigo-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              All Cases ({cases.length})
            </button>
            <button
              onClick={() => setActiveTab('AWAITING')}
              className={`py-3 px-3 border-b-2 transition ${
                activeTab === 'AWAITING'
                  ? 'border-indigo-600 text-indigo-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Awaiting Scrutiny ({awaitingCount})
            </button>
            <button
              onClick={() => setActiveTab('CLARIFICATION')}
              className={`py-3 px-3 border-b-2 transition ${
                activeTab === 'CLARIFICATION'
                  ? 'border-indigo-600 text-indigo-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Clarifications ({clarificationCount})
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`py-3 px-3 border-b-2 transition ${
                activeTab === 'COMPLETED'
                  ? 'border-indigo-600 text-indigo-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72 pb-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search case or institution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            <span>Fetching scrutiny queue from backend...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">{error}</div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium text-slate-700">No applications match this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Case Reference</th>
                  <th className="py-3 px-4">Institution Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Documents</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Scrutiny Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-medium text-indigo-700">
                      <Link to={`/reviewer/cases/${c.id}`} className="hover:underline">
                        {c.case_ref}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900 block">{c.institution_name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{c.institution_ref}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.category}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {c.submitted_at ? new Date(c.submitted_at).toLocaleDateString() : 'Draft Mode'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-semibold text-slate-900">{c.document_count}</span> active file(s)
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/reviewer/cases/${c.id}`}
                        className="inline-flex items-center space-x-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium px-2.5 py-1.5 rounded-md border border-indigo-200 transition"
                      >
                        <span>Inspect Case</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

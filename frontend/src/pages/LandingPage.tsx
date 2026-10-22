import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import {
  Building2,
  UserCheck,
  ShieldAlert,
  FileCheck2,
  ArrowRight,
  Database,
  Lock,
  GitBranch,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { switchRole } = useDemo();
  const navigate = useNavigate();

  const handleSelectRole = (role: 'institution' | 'reviewer') => {
    switchRole(role);
    if (role === 'institution') {
      navigate('/institution');
    } else {
      navigate('/reviewer');
    }
  };

  return (
    <div className="space-y-10 py-4 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-900 px-3.5 py-1.5 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>Smart India Hackathon • SIH Problem Statement 26261</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B192C] tracking-tight">
          AICTE VERITAS
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          AI-Powered Institutional Application Validation, Document Authentication & Regulatory Compliance Verification
        </p>
      </div>

      {/* Role Selection Demonstration Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Card 1: Institution Portal */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-6 sm:p-8 hover:border-blue-500 hover:shadow-lg transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">Institution Portal</h2>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                  Applicant
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Authorized Technical Institution Representative</p>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Initiate Extension of Approval (EoA) applications, upload required supporting documentation, track multi-state processing, view deficiency notices, and submit re-attested documents.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Create application cases with category & academic year</span>
              </li>
              <li className="flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Upload supporting documents (PDF/PNG/JPEG) with SHA-256</span>
              </li>
              <li className="flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Respond directly to reviewer clarification requests</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectRole('institution')}
            className="mt-6 w-full inline-flex items-center justify-center space-x-2 bg-[#0B192C] hover:bg-slate-800 text-white font-medium py-3 px-4 rounded-lg text-sm shadow transition"
          >
            <span>Enter Institution Portal (Demo)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: AICTE Reviewer Portal */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-6 sm:p-8 hover:border-indigo-500 hover:shadow-lg transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">AICTE Reviewer Portal</h2>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                  Regulatory Official
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Council Scrutiny Officer & Committee Reviewer</p>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Scrutinize submitted institutional cases, inspect document integrity & hash fingerprints, query deficiencies via clarification notices, and record preliminary human scrutiny outcomes.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>Unified case queue with status & institution filters</span>
              </li>
              <li className="flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>Authorized document download and signature verification</span>
              </li>
              <li className="flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>Issue deficiency notices & log preliminary findings</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleSelectRole('reviewer')}
            className="mt-6 w-full inline-flex items-center justify-center space-x-2 bg-indigo-700 hover:bg-indigo-800 text-white font-medium py-3 px-4 rounded-lg text-sm shadow transition"
          >
            <span>Enter Reviewer Portal (Demo)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stage 1 Foundation & Regulatory Notice */}
      <div className="bg-slate-100 border border-slate-300 rounded-xl p-5 text-xs text-slate-600 space-y-2">
        <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Stage 1 Architecture & Transparency Guarantee</span>
        </div>
        <p className="leading-relaxed">
          Stage 1 establishes the verified full-stack architecture: server-side state transitions, SHA-256 document hashing, magic byte verification, private file storage, and bidirectional clarification loop. Advanced automated OCR text extraction, multi-source cross document consistency checks, and issuing-authority verification adapters are scheduled for Stage 2.
        </p>
      </div>
    </div>
  );
};

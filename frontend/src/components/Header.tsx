import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import {
  ShieldCheck,
  Building2,
  UserCheck,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Info,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { session, switchRole, setInstitutionPreset, resetDemoData, isLoading } = useDemo();
  const navigate = useNavigate();

  const handleRoleToggle = (newRole: 'institution' | 'reviewer') => {
    switchRole(newRole);
    if (newRole === 'institution') {
      navigate('/institution');
    } else {
      navigate('/reviewer');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0B192C] text-white shadow-md">
      {/* Government Demonstration Disclaimer Banner */}
      <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between border-b border-amber-600">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5" />
          <span>
            SIH26261 PROTOTYPE DEMONSTRATION ENVIRONMENT • SYNTHETIC INSTITUTIONAL DATA ONLY • NO LIVE STATUTORY INTEGRATIONS
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="hidden sm:inline bg-amber-600/30 px-2 py-0.5 rounded text-amber-950 font-bold">
            STAGE 1: VERIFIED FOUNDATION
          </span>
          <button
            onClick={() => {
              if (window.confirm('Reset demo database with fresh synthetic cases?')) {
                resetDemoData();
              }
            }}
            disabled={isLoading}
            className="flex items-center space-x-1 underline hover:text-white transition disabled:opacity-50"
            title="Reset database to initial synthetic demo state"
          >
            <RotateCcw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:border-blue-400 transition">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg tracking-tight text-white">AICTE VERITAS</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded border border-slate-700">
                    SIH26261
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden md:block">
                  Institutional Application Validation & Regulatory Verification
                </p>
              </div>
            </Link>

            {/* Portal Badge */}
            <div className="hidden lg:flex items-center pl-4 border-l border-slate-800 text-xs text-slate-400">
              {session.role === 'institution' ? (
                <span className="flex items-center text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-md">
                  <Building2 className="w-3.5 h-3.5 mr-1.5" />
                  Institution Portal Mode
                </span>
              ) : (
                <span className="flex items-center text-blue-400 bg-blue-950/40 border border-blue-800/60 px-2.5 py-1 rounded-md">
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                  AICTE Reviewer Portal Mode
                </span>
              )}
            </div>
          </div>

          {/* Role Switching & User Info Controls */}
          <div className="flex items-center space-x-3">
            {/* Institution Switcher (when in institution role) */}
            {session.role === 'institution' && (
              <div className="hidden md:flex items-center space-x-1.5 text-xs">
                <span className="text-slate-400">Demo Inst:</span>
                <select
                  value={session.institutionRef}
                  onChange={(e) => {
                    const ref = e.target.value;
                    if (ref === 'NIT-DEMO-01') setInstitutionPreset('NIT-DEMO-01', 'Northstar Institute of Technology');
                    else if (ref === 'AAET-DEMO-02') setInstitutionPreset('AAET-DEMO-02', 'Apex Academy of Engineering & Technology');
                    else if (ref === 'VPC-DEMO-03') setInstitutionPreset('VPC-DEMO-03', 'Vanguard Polytechnic College');
                  }}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-blue-500"
                >
                  <option value="NIT-DEMO-01">Northstar Tech (NIT-DEMO-01)</option>
                  <option value="AAET-DEMO-02">Apex Academy (AAET-DEMO-02)</option>
                  <option value="VPC-DEMO-03">Vanguard Polytech (VPC-DEMO-03)</option>
                </select>
              </div>
            )}

            {/* Role Switch Pill */}
            <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700 flex items-center text-xs">
              <button
                type="button"
                onClick={() => handleRoleToggle('institution')}
                className={`px-3 py-1.5 rounded-md font-medium transition flex items-center space-x-1.5 ${
                  session.role === 'institution'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Institution Demo</span>
                <span className="sm:hidden">Inst</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleToggle('reviewer')}
                className={`px-3 py-1.5 rounded-md font-medium transition flex items-center space-x-1.5 ${
                  session.role === 'reviewer'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reviewer Demo</span>
                <span className="sm:hidden">Review</span>
              </button>
            </div>

            {/* Current Identity Avatar */}
            <div className="hidden xl:flex items-center space-x-2 pl-3 border-l border-slate-800 text-right">
              <div>
                <p className="text-xs font-medium text-slate-200">{session.userName}</p>
                <p className="text-[10px] text-slate-400">
                  {session.role === 'institution' ? session.institutionRef : 'Council Directorate'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

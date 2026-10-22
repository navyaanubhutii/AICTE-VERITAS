import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { api } from '../services/api';
import { Building2, ArrowLeft, Send, ShieldCheck, AlertCircle } from 'lucide-react';

export const CreateApplicationPage: React.FC = () => {
  const { session, showToast } = useDemo();
  const navigate = useNavigate();

  const [institutionName, setInstitutionName] = useState(session.institutionName);
  const [institutionRef, setInstitutionRef] = useState(session.institutionRef);
  const [category, setCategory] = useState('Extension of Approval (EoA)');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [programType, setProgramType] = useState('Engineering & Technology');
  const [campusLocation, setCampusLocation] = useState('Bengaluru, Karnataka');
  const [contactEmail, setContactEmail] = useState('principal@northstar-tech.edu.in');
  const [contactPhone, setContactPhone] = useState('+91-80-2852-0199');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!institutionName.trim() || !institutionRef.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const newCase = await api.createCase(
        {
          institution_name: institutionName.trim(),
          institution_ref: institutionRef.trim(),
          category,
          academic_year: academicYear,
          program_type: programType,
          campus_location: campusLocation.trim(),
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim(),
        },
        session
      );

      showToast(`Application case ${newCase.case_ref} created successfully.`);
      navigate(`/institution/cases/${newCase.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create case.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/institution"
        className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Institution Applications</span>
      </Link>

      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Initiate Institutional Application</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Technical Education Regulatory Approval Process (SIH26261 Demonstration)
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Institution Name *
              </label>
              <input
                type="text"
                required
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Permanent AICTE Demo ID *
              </label>
              <input
                type="text"
                required
                value={institutionRef}
                onChange={(e) => setInstitutionRef(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Application Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
                <option value="Increase in Intake / Additional Course">Increase in Intake / Additional Course</option>
                <option value="Establishment of New Technical Institution">Establishment of New Institution (Demo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Year *
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="2026-2027">2026-2027</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Program Type *
              </label>
              <select
                value={programType}
                onChange={(e) => setProgramType(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="Engineering & Technology">Engineering & Technology</option>
                <option value="Management (MBA / PGDM)">Management (MBA / PGDM)</option>
                <option value="Computer Applications (MCA)">Computer Applications (MCA)</option>
                <option value="Pharmacy">Pharmacy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campus Location *
              </label>
              <input
                type="text"
                required
                value={campusLocation}
                onChange={(e) => setCampusLocation(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Contact Email *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Contact Phone *
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Unique Case Reference will be generated by AICTE Veritas backend.
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-2 bg-[#0B192C] hover:bg-slate-800 text-white font-medium px-5 py-2.5 rounded-lg text-xs shadow transition disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Generating Case...' : 'Create Draft Case'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

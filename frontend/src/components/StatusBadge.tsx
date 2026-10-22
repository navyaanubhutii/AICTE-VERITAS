import React from 'react';
import { CaseStatus } from '../types';

interface StatusBadgeProps {
  status: CaseStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-medium',
  };

  switch (status) {
    case 'DRAFT':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses[size]}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
          Draft
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-500"></span>
          Submitted
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses[size]}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          Under Review
        </span>
      );
    case 'NEEDS_CLARIFICATION':
      return (
        <span className={`inline-flex items-center font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses[size]}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
          Needs Clarification
        </span>
      );
    case 'RESUBMITTED':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses[size]}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-purple-500"></span>
          Resubmitted
        </span>
      );
    case 'PRELIMINARY_REVIEW_COMPLETE':
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses[size]}`}>
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
          Preliminary Review Complete
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-600 ${sizeClasses[size]}`}>
          {status}
        </span>
      );
  }
};

import React, { ReactNode, useState } from 'react';
import type { ApplicationStatus, SchemeType } from '../../types';
import { SCHEME_LABELS } from '../../types';

// ============================================================
// Common Components — Uttarakhand Yoga Policy Portal 2025
// ============================================================

const STATUS_BADGE_COLORS: Record<ApplicationStatus, string> = {
  DRAFT:        'bg-gray-100 text-gray-700',
  SUBMITTED:    'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  QUERY_RAISED: 'bg-orange-100 text-orange-800',
  APPROVED:     'bg-green-100 text-green-800',
  REJECTED:     'bg-red-100 text-red-800',
  WAITLISTED:   'bg-purple-100 text-purple-800',
  DISBURSED:    'bg-teal-100 text-teal-800',
};

const STATUS_DISPLAY: Record<ApplicationStatus, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review',
  QUERY_RAISED: 'Query Raised', APPROVED: 'Approved', REJECTED: 'Rejected',
  WAITLISTED: 'Waitlisted', DISBURSED: 'Disbursed',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
      {STATUS_DISPLAY[status] || status}
    </span>
  );
}

const SCHEME_COLORS: Record<SchemeType, string> = {
  CAPITAL_SUBSIDY:       'bg-amber-100 text-amber-800',
  RESEARCH_GRANT:        'bg-violet-100 text-violet-800',
  TEACHER_CERTIFICATION: 'bg-sky-100 text-sky-800',
  EXISTING_INSTITUTION:  'bg-emerald-100 text-emerald-800',
};

export function SchemeBadge({ scheme }: { scheme: SchemeType }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SCHEME_COLORS[scheme] || 'bg-gray-100 text-gray-700'}`}>
      {SCHEME_LABELS[scheme] || scheme}
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>{children}</div>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
  return (
    <svg className={`animate-spin ${sz} text-current`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function FileUpload({ label, accept = '.pdf,.jpg,.jpeg,.png', required, hint, onChange }: {
  label: string; accept?: string; required?: boolean; hint?: string; onChange: (file: File | null) => void; currentUrl?: string;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileName(file?.name || null);
    onChange(file);
  };
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-600 transition-colors">
        <input type="file" accept={accept} onChange={handleChange} className="hidden" id={`file-${label}`} />
        <label htmlFor={`file-${label}`} className="cursor-pointer flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-700">{fileName || 'Click to upload'}</p>
            <p className="text-xs text-gray-500">{hint || 'PDF, JPG, PNG up to 5MB'}</p>
          </div>
        </label>
      </div>
    </div>
  );
}

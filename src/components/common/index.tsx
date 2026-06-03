import React, { ReactNode, useState } from 'react';
import type { ApplicationStatus, SchemeType } from '../../types';
import { STATUS_LABELS, SCHEME_LABELS } from '../../types';

// ============================================================
// Common Components — Uttarakhand Yoga Policy Portal 2025
// ============================================================

// ---------- StatusBadge ----------
const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT:                  'bg-gray-100 text-gray-700',
  SUBMITTED:              'bg-blue-100 text-blue-800',
  UNDER_REVIEW:           'bg-yellow-100 text-yellow-800',
  QUERY_RAISED:           'bg-orange-100 text-orange-800',
  IN_PRINCIPLE_APPROVED:  'bg-cyan-100 text-cyan-800',
  APPROVED:               'bg-green-100 text-green-800',
  REJECTED:               'bg-red-100 text-red-800',
  WAITLISTED:             'bg-purple-100 text-purple-800',
  DISBURSEMENT_PENDING:   'bg-indigo-100 text-indigo-800',
  DISBURSED:              'bg-teal-100 text-teal-800',
  CLOSED:                 'bg-gray-200 text-gray-600',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ---------- SchemeBadge ----------
const SCHEME_COLORS: Record<SchemeType, string> = {
  CAPITAL_SUBSIDY:             'bg-amber-100 text-amber-800',
  RESEARCH_GRANT:              'bg-violet-100 text-violet-800',
  TEACHER_CERTIFICATION:       'bg-sky-100 text-sky-800',
  EXISTING_INSTITUTION_SUPPORT: 'bg-emerald-100 text-emerald-800',
};

export function SchemeBadge({ scheme }: { scheme: SchemeType }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SCHEME_COLORS[scheme]}`}>
      {SCHEME_LABELS[scheme]}
    </span>
  );
}

// ---------- Card ----------
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
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

// ---------- Button ----------
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary:   'bg-[#1a6e3c] hover:bg-[#155a30] text-white',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
  ghost:     'text-[#1a6e3c] hover:bg-green-50',
  success:   'bg-emerald-500 hover:bg-emerald-600 text-white',
};

const BTN_SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  children, variant = 'primary', size = 'md',
  isLoading, leftIcon, rightIcon, className = '', disabled, ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors
        focus:outline-none focus:ring-2 focus:ring-[#1a6e3c] focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`}
      {...props}
    >
      {isLoading ? <LoadingSpinner size="sm" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}

// ---------- LoadingSpinner ----------
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
  return (
    <svg className={`animate-spin ${sz} text-current`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ---------- Input ----------
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function Input({ label, error, hint, required, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm
          focus:outline-none focus:ring-2 focus:ring-[#1a6e3c] focus:border-[#1a6e3c]
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
          disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------- Select ----------
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, required, options, placeholder, className = '', id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm bg-white
          focus:outline-none focus:ring-2 focus:ring-[#1a6e3c] focus:border-[#1a6e3c]
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
          disabled:bg-gray-50 ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---------- Textarea ----------
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  wordLimit?: number;
}

export function Textarea({ label, error, hint, required, wordLimit, className = '', id, value, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const wordCount = value ? String(value).trim().split(/\s+/).filter(Boolean).length : 0;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        value={value}
        className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm resize-none
          focus:outline-none focus:ring-2 focus:ring-[#1a6e3c] focus:border-[#1a6e3c]
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'}
          disabled:bg-gray-50 ${className}`}
        rows={4}
        {...props}
      />
      <div className="flex justify-between mt-1">
        <span>{hint && !error && <span className="text-xs text-gray-500">{hint}</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </span>
        {wordLimit && (
          <span className={`text-xs ${wordCount > wordLimit ? 'text-red-600' : 'text-gray-400'}`}>
            {wordCount}/{wordLimit} words
          </span>
        )}
      </div>
    </div>
  );
}

// ---------- Alert ----------
type AlertType = 'info' | 'success' | 'warning' | 'error';

const ALERT_STYLES: Record<AlertType, string> = {
  info:    'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error:   'bg-red-50 border-red-200 text-red-800',
};

export function Alert({ type, title, children }: { type: AlertType; title?: string; children: ReactNode }) {
  return (
    <div className={`rounded-lg border p-4 ${ALERT_STYLES[type]}`}>
      {title && <p className="font-semibold text-sm mb-1">{title}</p>}
      <div className="text-sm">{children}</div>
    </div>
  );
}

// ---------- Modal ----------
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const MODAL_SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40" onClick={onClose} />
        <div className={`relative bg-white rounded-2xl shadow-xl w-full ${MODAL_SIZES[size]} z-10`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Stepper ----------
export function Stepper({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, idx) => (
          <li key={step} className={`flex items-center ${idx < steps.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors
                ${idx < currentStep ? 'bg-[#1a6e3c] text-white' :
                  idx === currentStep ? 'bg-[#1a6e3c] text-white ring-4 ring-green-100' :
                  'bg-gray-100 text-gray-400'}`}>
                {idx < currentStep ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : idx + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block
                ${idx <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${idx < currentStep ? 'bg-[#1a6e3c]' : 'bg-gray-200'}`} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ---------- FileUpload ----------
interface FileUploadProps {
  label: string;
  accept?: string;
  required?: boolean;
  hint?: string;
  onChange: (file: File | null) => void;
  currentUrl?: string;
}

export function FileUpload({ label, accept = '.pdf,.jpg,.jpeg,.png', required, hint, onChange, currentUrl }: FileUploadProps) {
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
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#1a6e3c] transition-colors">
        <input type="file" accept={accept} onChange={handleChange} className="hidden" id={`file-${label}`} />
        <label htmlFor={`file-${label}`} className="cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#1a6e3c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[#1a6e3c]">
                {fileName || (currentUrl ? '✓ File uploaded (click to replace)' : 'Click to upload')}
              </p>
              <p className="text-xs text-gray-500">{hint || 'PDF, JPG, PNG up to 5MB'}</p>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}

// ---------- Table ----------
interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function Table<T extends Record<string, unknown>>({ columns, data, isLoading, emptyMessage }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map(col => (
              <th key={String(col.key)} className={`px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
              <LoadingSpinner size="lg" />
            </td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 text-sm">
              {emptyMessage || 'No records found'}
            </td></tr>
          ) : data.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              {columns.map(col => (
                <td key={String(col.key)} className={`px-4 py-3 text-gray-700 ${col.className || ''}`}>
                  {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- PageHeader ----------
export function PageHeader({ title, subtitle, breadcrumbs, action }: {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  action?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && (
        <nav className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              {b.href ? (
                <a href={b.href} className="hover:text-gray-600">{b.label}</a>
              ) : (
                <span className="text-gray-600">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div className="ml-4 flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

// ---------- StatCard ----------
export function StatCard({ title, value, subtitle, icon, color = 'green' }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: 'green' | 'blue' | 'purple' | 'amber' | 'red';
}) {
  const colorMap = {
    green:  'bg-green-50 text-green-700',
    blue:   'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    amber:  'bg-amber-50 text-amber-700',
    red:    'bg-red-50 text-red-700',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// ---------- Tabs ----------
export function Tabs({ tabs, activeTab, onChange }: {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex gap-1 -mb-px overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${activeTab === tab.id
                ? 'border-[#1a6e3c] text-[#1a6e3c]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`inline-flex items-center justify-center w-5 h-5 text-xs rounded-full
                ${activeTab === tab.id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

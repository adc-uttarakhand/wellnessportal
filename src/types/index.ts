// ── User & Auth ──────────────────────────────────────────────────────────
export type UserRole = 'STATE_ADMIN' | 'DISTRICT_ADMIN' | 'YOGA_CENTRE' | 'YOGA_PROFESSIONAL' | 'APPLICANT';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  full_name: string;
  mobile?: string;
  district?: DistrictName;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export const DISTRICTS = [
  'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun',
  'Haridwar', 'Nainital', 'Pauri Garhwal', 'Pithoragarh',
  'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi',
] as const;

export type DistrictName = typeof DISTRICTS[number];

export const HILLS_DISTRICTS: DistrictName[] = [
  'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Pithoragarh',
  'Rudraprayag', 'Tehri Garhwal', 'Pauri Garhwal', 'Uttarkashi',
];

export type SchemeType = 'CAPITAL_SUBSIDY' | 'RESEARCH_GRANT' | 'TEACHER_CERTIFICATION' | 'EXISTING_INSTITUTION';

export const SCHEME_LABELS: Record<SchemeType, string> = {
  CAPITAL_SUBSIDY: 'Yoga Centre Capital Subsidy',
  RESEARCH_GRANT: 'Research & Development Grant',
  TEACHER_CERTIFICATION: 'YCB Exam Fee Reimbursement',
  EXISTING_INSTITUTION: 'Promotion in Existing Institutions',
};

export type ApplicationStatus =
  | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'QUERY_RAISED'
  | 'APPROVED' | 'REJECTED' | 'WAITLISTED' | 'DISBURSED';

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: '#6b7280',
  SUBMITTED: '#3b82f6',
  UNDER_REVIEW: '#f59e0b',
  QUERY_RAISED: '#f97316',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
  WAITLISTED: '#8b5cf6',
  DISBURSED: '#059669',
};

export type YCBLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4' | 'LEVEL_5' | 'LEVEL_6' | 'LEVEL_7';

export const YCB_LEVELS: Record<YCBLevel, { name: string; fee: number; quota: number }> = {
  LEVEL_1: { name: 'Yoga Protocol Instructor', fee: 3250, quota: 50 },
  LEVEL_2: { name: 'Yoga Wellness Instructor', fee: 4750, quota: 50 },
  LEVEL_3: { name: 'Yoga Teacher and Evaluator', fee: 6250, quota: 60 },
  LEVEL_4: { name: 'Assistant Yoga Therapist', fee: 6250, quota: 70 },
  LEVEL_5: { name: 'Therapeutic Yoga Consultant', fee: 11750, quota: 80 },
  LEVEL_6: { name: 'Yoga Master', fee: 8250, quota: 90 },
  LEVEL_7: { name: 'Yoga Therapist', fee: 7250, quota: 100 },
};

export interface Application {
  id: number;
  application_number: string;
  scheme_type: SchemeType;
  applicant_user_id: number;
  applicant_name?: string;
  district?: DistrictName;
  financial_year: string;
  status: ApplicationStatus;
  submission_date?: string;
  review_date?: string;
  approval_date?: string;
  rejection_reason?: string;
  query_text?: string;
  query_response?: string;
  is_waitlisted: boolean;
  created_at: string;
  detail?: Record<string, unknown>;
}

export interface YogaCentre {
  id: number;
  user_id: number;
  centre_name: string;
  district: DistrictName;
  centre_type: string;
  area_category?: 'HILLS' | 'PLAINS';
  capacity_per_session?: number;
  is_verified: boolean;
  created_at: string;
}

export interface YogaProfessional {
  id: number;
  user_id: number;
  full_name: string;
  district: DistrictName;
  ycb_level?: YCBLevel;
  ycb_cert_number?: string;
  is_verified: boolean;
  current_institutions: number;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  by_scheme: Array<{ scheme_type: SchemeType; count: string }>;
  by_status: Array<{ status: ApplicationStatus; count: string }>;
  budget: Array<{
    financial_year: string;
    scheme_type: SchemeType;
    total_budget_inr: number;
    approved_amount_inr: number;
    disbursed_amount_inr: number;
  }>;
  recent: Application[];
}

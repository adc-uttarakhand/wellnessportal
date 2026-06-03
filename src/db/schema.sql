-- ============================================================
-- Uttarakhand Yoga Policy Portal 2025 - Database Schema
-- Department of AYUSH and AYUSH Education, Govt. of Uttarakhand
-- Designed for NIC PostgreSQL hosting
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM (
  'STATE_ADMIN',
  'DISTRICT_ADMIN',
  'YOGA_CENTRE',
  'YOGA_PROFESSIONAL',
  'APPLICANT'
);

CREATE TYPE application_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'QUERY_RAISED',
  'IN_PRINCIPLE_APPROVED',
  'APPROVED',
  'REJECTED',
  'WAITLISTED',
  'DISBURSEMENT_PENDING',
  'DISBURSED',
  'CLOSED'
);

CREATE TYPE scheme_type AS ENUM (
  'CAPITAL_SUBSIDY',
  'RESEARCH_GRANT',
  'TEACHER_CERTIFICATION',
  'EXISTING_INSTITUTION_SUPPORT'
);

CREATE TYPE district_name AS ENUM (
  'Almora',
  'Bageshwar',
  'Chamoli',
  'Champawat',
  'Dehradun',
  'Haridwar',
  'Nainital',
  'Pauri Garhwal',
  'Pithoragarh',
  'Rudraprayag',
  'Tehri Garhwal',
  'Udham Singh Nagar',
  'Uttarkashi'
);

CREATE TYPE location_category AS ENUM ('HILLS', 'PLAINS');

CREATE TYPE ycb_certification_level AS ENUM (
  'YOGA_PROTOCOL_INSTRUCTOR',
  'YOGA_WELLNESS_INSTRUCTOR',
  'YOGA_TEACHER_AND_EVALUATOR',
  'ASSISTANT_YOGA_THERAPIST',
  'THERAPEUTIC_YOGA_CONSULTANT',
  'YOGA_MASTER',
  'YOGA_THERAPIST'
);

CREATE TYPE institution_type AS ENUM (
  'HOMESTAY',
  'RESORT',
  'HOTEL',
  'SCHOOL',
  'COLLEGE',
  'YOGA_CENTRE',
  'AYUSH_HWC',
  'RESEARCH_INSTITUTION',
  'OTHER'
);

CREATE TYPE subsidy_instalment AS ENUM ('INSTALMENT_1', 'INSTALMENT_2', 'INSTALMENT_3');

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Users table (all roles)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(15),
  district district_name,
  is_active BOOLEAN DEFAULT TRUE,
  force_password_change BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yoga Centre Registration
CREATE TABLE yoga_centres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  centre_name VARCHAR(500) NOT NULL,
  registration_number VARCHAR(100) UNIQUE,
  registration_date DATE,
  registration_issuing_authority VARCHAR(255),
  centre_type institution_type NOT NULL,
  address TEXT NOT NULL,
  district district_name NOT NULL,
  pincode VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_category location_category,
  studio_area_sqft DECIMAL(10, 2),
  seating_capacity INTEGER,
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(15),
  website VARCHAR(500),
  ycb_accredited BOOLEAN DEFAULT FALSE,
  ycb_accreditation_number VARCHAR(100),
  is_yoga_hub BOOLEAN DEFAULT FALSE,
  hub_location VARCHAR(255), -- Jageshwar, Tehri Lake etc
  established_year INTEGER,
  registration_certificate_url TEXT,
  status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Yoga Professionals Registration
CREATE TABLE yoga_professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  father_name VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(20),
  aadhaar_number VARCHAR(12), -- stored masked
  address TEXT,
  district district_name,
  pincode VARCHAR(10),
  qualifications TEXT,
  experience_years INTEGER,
  ycb_certified BOOLEAN DEFAULT FALSE,
  ycb_certification_level ycb_certification_level,
  ycb_certificate_number VARCHAR(100),
  ycb_certificate_date DATE,
  ycb_certificate_url TEXT,
  is_uttarakhand_resident BOOLEAN,
  current_institution_id UUID REFERENCES yoga_centres(id),
  profile_photo_url TEXT,
  bank_account_number VARCHAR(50),
  bank_ifsc VARCHAR(20),
  bank_name VARCHAR(255),
  bank_branch VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- General Applicants (for subsidy/grant/support schemes)
CREATE TABLE applicants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  applicant_name VARCHAR(500) NOT NULL,
  applicant_type institution_type,
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(15),
  address TEXT,
  district district_name,
  pincode VARCHAR(10),
  pan_number VARCHAR(20),
  gstin VARCHAR(30),
  bank_account_number VARCHAR(50),
  bank_ifsc VARCHAR(20),
  bank_name VARCHAR(255),
  bank_branch VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCHEME A: CAPITAL SUBSIDY FOR YOGA & MEDITATION CENTRE
-- ============================================================

CREATE TABLE capital_subsidy_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upn VARCHAR(50) UNIQUE, -- Unique Project Number
  applicant_id UUID REFERENCES applicants(id),
  yoga_centre_id UUID REFERENCES yoga_centres(id),
  project_name VARCHAR(500) NOT NULL,
  project_type VARCHAR(50) CHECK (project_type IN ('GREENFIELD', 'EXPANSION')),
  district district_name NOT NULL,
  location_category location_category NOT NULL,
  is_yoga_hub_location BOOLEAN DEFAULT FALSE,
  hub_location VARCHAR(255),
  proposed_investment_total DECIMAL(15, 2),
  proposed_eca DECIMAL(15, 2), -- Eligible Capital Assets
  subsidy_percentage DECIMAL(5, 2), -- 50% hills / 25% plains
  max_subsidy_cap DECIMAL(15, 2), -- 20L hills / 10L plains
  applied_subsidy_amount DECIMAL(15, 2),
  approved_subsidy_amount DECIMAL(15, 2),
  cod_date DATE, -- Commencement of Operation Date
  is_receiving_other_govt_incentive BOOLEAN DEFAULT FALSE,
  session_capacity INTEGER, -- participants per session
  
  -- Documents
  caf_form_url TEXT,
  dpr_url TEXT,
  ca_certificate_url TEXT,
  land_documents_url TEXT,
  other_documents_url TEXT,
  
  -- Status & Workflow
  status application_status DEFAULT 'DRAFT',
  submitted_at TIMESTAMPTZ,
  district_admin_id UUID REFERENCES users(id),
  district_reviewed_at TIMESTAMPTZ,
  district_remarks TEXT,
  state_admin_id UUID REFERENCES users(id),
  state_reviewed_at TIMESTAMPTZ,
  state_remarks TEXT,
  slrc_approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Disbursement tracking
  instalment_1_status VARCHAR(50) DEFAULT 'PENDING',
  instalment_1_amount DECIMAL(15, 2),
  instalment_1_disbursed_at DATE,
  instalment_2_status VARCHAR(50) DEFAULT 'PENDING',
  instalment_2_amount DECIMAL(15, 2),
  instalment_2_disbursed_at DATE,
  instalment_3_status VARCHAR(50) DEFAULT 'PENDING',
  instalment_3_amount DECIMAL(15, 2),
  instalment_3_disbursed_at DATE,
  
  financial_year VARCHAR(10), -- e.g. '2025-26'
  is_waitlisted BOOLEAN DEFAULT FALSE,
  waitlisted_for_fy VARCHAR(10),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Capex verification for capital subsidy instalments
CREATE TABLE capex_verification (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES capital_subsidy_applications(id),
  instalment subsidy_instalment,
  capex_certificate_url TEXT,
  actual_bills_url TEXT,
  participants_proof_url TEXT,
  sessions_proof_url TEXT,
  capex_amount DECIMAL(15, 2),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'SUBMITTED'
);

-- ============================================================
-- SCHEME B: RESEARCH AND DEVELOPMENT GRANT
-- ============================================================

CREATE TABLE rd_grant_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number VARCHAR(50) UNIQUE,
  applicant_id UUID REFERENCES applicants(id),
  organisation_name VARCHAR(500) NOT NULL,
  organisation_type VARCHAR(100),
  organisation_affiliation TEXT,
  organisation_experience_years INTEGER,
  past_research_project_title VARCHAR(500),
  past_research_funding DECIMAL(15, 2),
  
  -- Principal Investigator
  pi_name VARCHAR(255) NOT NULL,
  pi_age INTEGER,
  pi_is_indian_citizen BOOLEAN,
  pi_qualification VARCHAR(255),
  pi_institution_affiliation VARCHAR(500),
  pi_profile_url TEXT,
  
  -- Co-Investigator
  co_pi_name VARCHAR(255),
  co_pi_qualification VARCHAR(255),
  co_pi_affiliation VARCHAR(500),
  
  -- Research Proposal
  research_title VARCHAR(1000) NOT NULL,
  research_objectives TEXT, -- max 500 words
  project_summary TEXT, -- max 1500 words
  expected_output TEXT,
  expected_outcome TEXT,
  project_duration_months INTEGER,
  grant_amount_requested DECIMAL(15, 2),
  approved_grant_amount DECIMAL(15, 2),
  budget_details JSONB, -- budget heads + amounts
  milestone_chart JSONB, -- phase-wise outcomes JSON
  application_cycle VARCHAR(20), -- 'APR-MAY' or 'OCT-NOV'
  financial_year VARCHAR(10),
  
  -- Documents
  application_form_url TEXT,
  pi_profile_doc_url TEXT,
  milestone_chart_url TEXT,
  bank_details_url TEXT,
  
  -- Status
  status application_status DEFAULT 'DRAFT',
  submitted_at TIMESTAMPTZ,
  rpac_reviewed_at TIMESTAMPTZ,
  rpac_remarks TEXT,
  directorate_reviewed_at TIMESTAMPTZ,
  slrc_approved_at TIMESTAMPTZ,
  state_remarks TEXT,
  rejection_reason TEXT,
  
  -- Disbursement (3 instalments: 40%, 30%, 30%)
  instalment_1_status VARCHAR(50) DEFAULT 'PENDING',
  instalment_1_amount DECIMAL(15, 2),
  instalment_1_disbursed_at DATE,
  instalment_2_status VARCHAR(50) DEFAULT 'PENDING',
  instalment_2_amount DECIMAL(15, 2),
  instalment_2_progress_percent INTEGER,
  instalment_2_disbursed_at DATE,
  instalment_3_status VARCHAR(50) DEFAULT 'PENDING',
  instalment_3_amount DECIMAL(15, 2),
  instalment_3_disbursed_at DATE,
  
  -- Progress tracking
  current_progress_percent INTEGER DEFAULT 0,
  last_progress_update TIMESTAMPTZ,
  is_terminated BOOLEAN DEFAULT FALSE,
  termination_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quarterly progress reports for R&D grants
CREATE TABLE rd_progress_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES rd_grant_applications(id),
  report_quarter VARCHAR(20), -- Q1, Q2, Q3, Q4
  financial_year VARCHAR(10),
  progress_percentage INTEGER,
  progress_report_url TEXT,
  utilisation_certificate_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'SUBMITTED',
  remarks TEXT
);

-- ============================================================
-- SCHEME C: TEACHER CERTIFICATION FEE REIMBURSEMENT
-- ============================================================

CREATE TABLE teacher_certification_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number VARCHAR(50) UNIQUE,
  professional_id UUID REFERENCES yoga_professionals(id),
  applicant_name VARCHAR(255) NOT NULL,
  is_uttarakhand_resident BOOLEAN NOT NULL,
  ycb_certification_level ycb_certification_level NOT NULL,
  ycb_exam_year INTEGER,
  ycb_exam_date DATE,
  ycb_result VARCHAR(50), -- PASS
  ycb_rank INTEGER,
  ycb_exam_fee DECIMAL(10, 2),
  reimbursement_amount DECIMAL(10, 2), -- from policy table
  
  -- Documents
  fee_reimbursement_form_url TEXT,
  fee_receipt_url TEXT,
  admit_card_url TEXT,
  ycb_result_url TEXT,
  ycb_certificate_url TEXT,
  bank_details_url TEXT,
  aadhaar_url TEXT,
  domicile_certificate_url TEXT,
  
  -- Status
  status application_status DEFAULT 'DRAFT',
  submitted_at TIMESTAMPTZ,
  financial_year VARCHAR(10),
  rank_in_quota INTEGER, -- rank within YCB level quota
  is_within_quota BOOLEAN,
  
  district_admin_id UUID REFERENCES users(id),
  district_reviewed_at TIMESTAMPTZ,
  state_admin_id UUID REFERENCES users(id),
  state_reviewed_at TIMESTAMPTZ,
  state_remarks TEXT,
  rejection_reason TEXT,
  disbursed_at DATE,
  disbursement_mode VARCHAR(50) DEFAULT 'E-RUPI',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCHEME D: PROMOTION OF YOGA IN EXISTING INSTITUTIONS
-- ============================================================

CREATE TABLE existing_institution_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number VARCHAR(50) UNIQUE,
  applicant_id UUID REFERENCES applicants(id),
  institution_name VARCHAR(500) NOT NULL,
  institution_type institution_type NOT NULL,
  district district_name NOT NULL,
  registration_authority VARCHAR(255),
  registration_number VARCHAR(100),
  registration_certificate_url TEXT,
  address TEXT,
  session_capacity INTEGER,
  sessions_per_month INTEGER,
  session_duration_hours DECIMAL(4, 2),
  
  -- Community sessions
  will_conduct_community_sessions BOOLEAN DEFAULT FALSE,
  community_session_purpose TEXT,
  community_session_location TEXT,
  
  -- Yoga trainer engaged
  trainer_name VARCHAR(255),
  trainer_ycb_level ycb_certification_level,
  trainer_ycb_certificate_number VARCHAR(100),
  trainer_ycb_certificate_url TEXT,
  trainer_aadhaar_url TEXT,
  is_trainer_in_multiple_institutions BOOLEAN DEFAULT FALSE,
  trainer_institution_count INTEGER, -- must be <= 5
  
  -- Pre-session submission
  session_schedule_submitted BOOLEAN DEFAULT FALSE,
  session_schedule_url TEXT,
  first_session_date DATE,
  last_session_date DATE,
  claimed_months INTEGER DEFAULT 1, -- max 3
  
  -- Incentive calculation
  hours_per_month DECIMAL(5, 2), -- max 20
  rate_per_hour DECIMAL(10, 2) DEFAULT 250.00,
  claimed_amount DECIMAL(15, 2),
  approved_amount DECIMAL(15, 2),
  
  -- Status
  status application_status DEFAULT 'DRAFT',
  submitted_at TIMESTAMPTZ,
  pre_session_submitted_at TIMESTAMPTZ,
  post_session_submitted_at TIMESTAMPTZ,
  financial_year VARCHAR(10),
  application_window_year INTEGER, -- April-December window
  
  -- Documents post session
  logbook_url TEXT,
  self_declaration_url TEXT,
  session_video_url TEXT,
  trainer_invoice_url TEXT,
  
  -- Verification
  site_visit_done BOOLEAN DEFAULT FALSE,
  site_visit_date DATE,
  site_visit_photo_url TEXT,
  district_nodal_officer_id UUID REFERENCES users(id),
  district_verified_at TIMESTAMPTZ,
  district_remarks TEXT,
  state_admin_id UUID REFERENCES users(id),
  state_remarks TEXT,
  rejection_reason TEXT,
  disbursed_at DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS & QUERIES
-- ============================================================

CREATE TABLE application_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheme_type scheme_type NOT NULL,
  application_id UUID NOT NULL, -- generic reference
  raised_by UUID REFERENCES users(id),
  query_text TEXT NOT NULL,
  response_text TEXT,
  responded_by UUID REFERENCES users(id),
  raised_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'OPEN'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  application_id UUID,
  scheme_type scheme_type,
  notification_type VARCHAR(100)
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUDGET TRACKING
-- ============================================================

CREATE TABLE budget_utilisation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheme_type scheme_type NOT NULL,
  financial_year VARCHAR(10) NOT NULL,
  annual_limit DECIMAL(15, 2) NOT NULL,
  approved_amount DECIMAL(15, 2) DEFAULT 0,
  disbursed_amount DECIMAL(15, 2) DEFAULT 0,
  remaining_amount DECIMAL(15, 2) GENERATED ALWAYS AS (annual_limit - approved_amount) STORED,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scheme_type, financial_year)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_district ON users(district);
CREATE INDEX idx_yoga_centres_district ON yoga_centres(district);
CREATE INDEX idx_yoga_centres_user_id ON yoga_centres(user_id);
CREATE INDEX idx_capital_subsidy_status ON capital_subsidy_applications(status);
CREATE INDEX idx_capital_subsidy_district ON capital_subsidy_applications(district);
CREATE INDEX idx_capital_subsidy_fy ON capital_subsidy_applications(financial_year);
CREATE INDEX idx_rd_grant_status ON rd_grant_applications(status);
CREATE INDEX idx_teacher_cert_level ON teacher_certification_applications(ycb_certification_level);
CREATE INDEX idx_teacher_cert_status ON teacher_certification_applications(status);
CREATE INDEX idx_existing_inst_district ON existing_institution_applications(district);
CREATE INDEX idx_existing_inst_status ON existing_institution_applications(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- ============================================================
-- SEED DATA: Budget Utilisation 2025-26
-- ============================================================

INSERT INTO budget_utilisation (scheme_type, financial_year, annual_limit) VALUES
  ('CAPITAL_SUBSIDY', '2025-26', 50000000.00),     -- 5 Cr
  ('RESEARCH_GRANT', '2025-26', 2000000.00),        -- 20 Lakh
  ('TEACHER_CERTIFICATION', '2025-26', 3620000.00), -- 36.2 Lakh
  ('EXISTING_INSTITUTION_SUPPORT', '2025-26', 15000000.00); -- 1.5 Cr

-- ============================================================
-- SEED DATA: Default State Admin
-- Password: Admin@123 (bcrypt hash - change on first login)
-- ============================================================

INSERT INTO users (email, password_hash, role, full_name, mobile, force_password_change)
VALUES (
  'admin@yogauttarakhand.uk.gov.in',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMEmDpWrBqK9EyX5lI3/Dp3S',
  'STATE_ADMIN',
  'State Administrator - Directorate of Yoga',
  '0135000000',
  TRUE
);

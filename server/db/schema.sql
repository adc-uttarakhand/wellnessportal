-- ============================================================
-- Uttarakhand Yoga Policy Portal - Database Schema
-- PostgreSQL compatible (NIC hosting ready)
-- ============================================================

-- ENUMS
CREATE TYPE user_role AS ENUM ('STATE_ADMIN', 'DISTRICT_ADMIN', 'YOGA_CENTRE', 'YOGA_PROFESSIONAL', 'APPLICANT');
CREATE TYPE application_status AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'QUERY_RAISED', 'APPROVED', 'REJECTED', 'WAITLISTED', 'DISBURSED');
CREATE TYPE scheme_type AS ENUM ('CAPITAL_SUBSIDY', 'RESEARCH_GRANT', 'TEACHER_CERTIFICATION', 'EXISTING_INSTITUTION');
CREATE TYPE district_name AS ENUM (
  'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun',
  'Haridwar', 'Nainital', 'Pauri Garhwal', 'Pithoragarh',
  'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi'
);
CREATE TYPE area_category AS ENUM ('HILLS', 'PLAINS');
CREATE TYPE ycb_level AS ENUM ('LEVEL_1','LEVEL_2','LEVEL_3','LEVEL_4','LEVEL_5','LEVEL_6','LEVEL_7');
CREATE TYPE instalment_number AS ENUM ('FIRST', 'SECOND', 'THIRD');

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(100) UNIQUE NOT NULL,
  email           VARCHAR(200) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            user_role NOT NULL,
  full_name       VARCHAR(200) NOT NULL,
  mobile          VARCHAR(15),
  district        district_name,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- YOGA CENTRE REGISTRATIONS
-- ============================================================
CREATE TABLE yoga_centres (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER REFERENCES users(id) ON DELETE CASCADE,
  centre_name           VARCHAR(300) NOT NULL,
  registration_number   VARCHAR(100),
  district              district_name NOT NULL,
  block                 VARCHAR(100),
  village_town          VARCHAR(200),
  address               TEXT NOT NULL,
  pincode               VARCHAR(10),
  area_category         area_category,
  altitude_meters       NUMERIC(8,2),
  centre_type           VARCHAR(100),         -- Yoga Hub / Meditation Centre / Training Institute
  total_area_sqft       NUMERIC(10,2),
  studio_area_sqft      NUMERIC(10,2),
  capacity_per_session  INTEGER,
  contact_person        VARCHAR(200),
  contact_mobile        VARCHAR(15),
  contact_email         VARCHAR(200),
  website               VARCHAR(300),
  registration_cert_path VARCHAR(500),
  is_verified           BOOLEAN DEFAULT FALSE,
  verified_by           INTEGER REFERENCES users(id),
  verified_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- YOGA PROFESSIONALS (Instructors)
-- ============================================================
CREATE TABLE yoga_professionals (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER REFERENCES users(id) ON DELETE CASCADE,
  full_name           VARCHAR(200) NOT NULL,
  aadhaar_number      VARCHAR(12),
  date_of_birth       DATE,
  gender              VARCHAR(20),
  district            district_name NOT NULL,
  address             TEXT,
  mobile              VARCHAR(15),
  email               VARCHAR(200),
  ycb_level           ycb_level,
  ycb_cert_number     VARCHAR(100),
  ycb_cert_date       DATE,
  ycb_cert_path       VARCHAR(500),
  aadhaar_path        VARCHAR(500),
  photo_path          VARCHAR(500),
  current_institutions INTEGER DEFAULT 0,   -- max 5 allowed
  is_verified         BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPLICATIONS (All schemes)
-- ============================================================
CREATE TABLE applications (
  id                    SERIAL PRIMARY KEY,
  application_number    VARCHAR(50) UNIQUE NOT NULL, -- UPN
  scheme_type           scheme_type NOT NULL,
  applicant_user_id     INTEGER REFERENCES users(id),
  yoga_centre_id        INTEGER REFERENCES yoga_centres(id),
  professional_id       INTEGER REFERENCES yoga_professionals(id),
  district              district_name,
  financial_year        VARCHAR(10) NOT NULL,         -- e.g. '2025-26'
  status                application_status DEFAULT 'DRAFT',
  submission_date       TIMESTAMPTZ,
  review_date           TIMESTAMPTZ,
  approval_date         TIMESTAMPTZ,
  approved_by           INTEGER REFERENCES users(id),
  rejection_reason      TEXT,
  query_text            TEXT,
  query_raised_at       TIMESTAMPTZ,
  query_response        TEXT,
  query_responded_at    TIMESTAMPTZ,
  is_waitlisted         BOOLEAN DEFAULT FALSE,
  waitlist_year         VARCHAR(10),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCHEME: Capital Subsidy (6.1)
-- ============================================================
CREATE TABLE capital_subsidy_applications (
  id                        SERIAL PRIMARY KEY,
  application_id            INTEGER REFERENCES applications(id) ON DELETE CASCADE,
  yoga_centre_id            INTEGER REFERENCES yoga_centres(id),
  project_type              VARCHAR(50),       -- GREENFIELD / EXPANSION
  proposed_investment_inr   NUMERIC(15,2),
  eligible_capital_assets   NUMERIC(15,2),
  area_category             area_category NOT NULL,
  subsidy_percentage        NUMERIC(5,2),      -- 50 for hills, 25 for plains
  calculated_subsidy        NUMERIC(15,2),
  approved_subsidy          NUMERIC(15,2),
  land_ownership_type       VARCHAR(50),       -- OWNED / LEASED
  cod_date                  DATE,
  -- DPR
  dpr_path                  VARCHAR(500),
  ca_certificate_path       VARCHAR(500),
  land_document_path        VARCHAR(500),
  capex_certificate_path    VARCHAR(500),
  actual_bills_path         VARCHAR(500),
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCHEME: Research Grant (6.2)
-- ============================================================
CREATE TABLE research_grant_applications (
  id                          SERIAL PRIMARY KEY,
  application_id              INTEGER REFERENCES applications(id) ON DELETE CASCADE,
  institution_name            VARCHAR(300) NOT NULL,
  institution_type            VARCHAR(100),    -- university/research/medical/AYUSH/NGO
  institution_established_yr  INTEGER,
  pi_name                     VARCHAR(200),
  pi_age                      INTEGER,
  pi_qualification            TEXT,
  pi_ycb_level                ycb_level,
  pi_affiliation              VARCHAR(300),
  co_pi_name                  VARCHAR(200),
  co_pi_qualification         TEXT,
  project_title               VARCHAR(500) NOT NULL,
  project_objectives          TEXT,            -- max 500 words
  project_summary             TEXT,            -- max 1500 words
  expected_output             TEXT,
  project_duration_months     INTEGER,         -- 3-24
  grant_requested_inr         NUMERIC(12,2),   -- max 10 lakh
  budget_equipment            NUMERIC(12,2),
  budget_manpower             NUMERIC(12,2),
  budget_documentation        NUMERIC(12,2),
  budget_travel               NUMERIC(12,2),
  budget_contingency          NUMERIC(12,2),
  milestone_chart_path        VARCHAR(500),
  application_cycle           VARCHAR(20),     -- APR-MAY / OCT-NOV
  rpac_review_date            TIMESTAMPTZ,
  rpac_status                 VARCHAR(50),
  non_duplication_declaration BOOLEAN DEFAULT FALSE,
  current_progress_percent    INTEGER DEFAULT 0,
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCHEME: Teacher Certification Reimbursement (6.3)
-- ============================================================
CREATE TABLE teacher_cert_applications (
  id                    SERIAL PRIMARY KEY,
  application_id        INTEGER REFERENCES applications(id) ON DELETE CASCADE,
  professional_id       INTEGER REFERENCES yoga_professionals(id),
  applicant_name        VARCHAR(200) NOT NULL,
  aadhaar_number        VARCHAR(12),
  district              district_name NOT NULL,
  ycb_level             ycb_level NOT NULL,
  ycb_cert_number       VARCHAR(100),
  exam_date             DATE,
  exam_fee_paid         NUMERIC(10,2),
  rank_in_exam          INTEGER,
  bank_account_number   VARCHAR(30),
  bank_ifsc             VARCHAR(15),
  bank_name             VARCHAR(200),
  fee_receipt_path      VARCHAR(500),
  admit_card_path       VARCHAR(500),
  result_path           VARCHAR(500),
  certificate_path      VARCHAR(500),
  reimbursement_amount  NUMERIC(10,2),
  disbursed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SCHEME: Existing Institution (6.4)
-- ============================================================
CREATE TABLE existing_institution_applications (
  id                        SERIAL PRIMARY KEY,
  application_id            INTEGER REFERENCES applications(id) ON DELETE CASCADE,
  institution_name          VARCHAR(300) NOT NULL,
  institution_type          VARCHAR(100),    -- HOMESTAY / RESORT / HOTEL / SCHOOL / COLLEGE / YOGA_CENTRE
  registration_cert_number  VARCHAR(100),
  registering_dept          VARCHAR(200),
  district                  district_name NOT NULL,
  address                   TEXT,
  capacity_per_session      INTEGER,
  sessions_per_day          INTEGER,
  sessions_per_month        INTEGER,
  trainer_name              VARCHAR(200),
  trainer_ycb_cert          VARCHAR(100),
  trainer_ycb_level         ycb_level,
  trainer_other_institutions INTEGER DEFAULT 0,
  has_community_sessions    BOOLEAN DEFAULT FALSE,
  community_session_purpose TEXT,
  claimed_months            INTEGER DEFAULT 1,     -- max 3
  claimed_hours_per_month   INTEGER DEFAULT 20,    -- max 20
  total_claimed_amount      NUMERIC(10,2),
  bank_account_number       VARCHAR(30),
  bank_ifsc                 VARCHAR(15),
  bank_name                 VARCHAR(200),
  registration_cert_path    VARCHAR(500),
  trainer_cert_path         VARCHAR(500),
  session_schedule_path     VARCHAR(500),
  logbook_path              VARCHAR(500),
  self_declaration_path     VARCHAR(500),
  invoice_path              VARCHAR(500),
  sessions_completed        BOOLEAN DEFAULT FALSE,
  final_claim_submitted     BOOLEAN DEFAULT FALSE,
  disbursed_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBSIDY DISBURSEMENTS (3 instalments for capital subsidy)
-- ============================================================
CREATE TABLE subsidy_disbursements (
  id                    SERIAL PRIMARY KEY,
  application_id        INTEGER REFERENCES applications(id),
  instalment            instalment_number NOT NULL,
  amount_inr            NUMERIC(15,2),
  disbursed_at          TIMESTAMPTZ,
  disbursed_by          INTEGER REFERENCES users(id),
  payment_ref           VARCHAR(100),
  remarks               TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS (generic file store reference)
-- ============================================================
CREATE TABLE documents (
  id              SERIAL PRIMARY KEY,
  application_id  INTEGER REFERENCES applications(id),
  user_id         INTEGER REFERENCES users(id),
  document_type   VARCHAR(100),
  file_name       VARCHAR(300),
  file_path       VARCHAR(500),
  file_size_kb    INTEGER,
  mime_type       VARCHAR(100),
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  title         VARCHAR(300),
  message       TEXT,
  is_read       BOOLEAN DEFAULT FALSE,
  link          VARCHAR(300),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id),
  action          VARCHAR(200),
  entity_type     VARCHAR(100),
  entity_id       INTEGER,
  old_value       JSONB,
  new_value       JSONB,
  ip_address      VARCHAR(50),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANNUAL BUDGET TRACKER
-- ============================================================
CREATE TABLE annual_budget_tracker (
  id                    SERIAL PRIMARY KEY,
  financial_year        VARCHAR(10) NOT NULL,
  scheme_type           scheme_type NOT NULL,
  total_budget_inr      NUMERIC(15,2),
  approved_amount_inr   NUMERIC(15,2) DEFAULT 0,
  disbursed_amount_inr  NUMERIC(15,2) DEFAULT 0,
  UNIQUE(financial_year, scheme_type)
);

-- Initial budget data per policy (INR in Crore * 10000000)
INSERT INTO annual_budget_tracker (financial_year, scheme_type, total_budget_inr) VALUES
  ('2025-26', 'CAPITAL_SUBSIDY',        50000000),
  ('2025-26', 'RESEARCH_GRANT',          2000000),
  ('2025-26', 'TEACHER_CERTIFICATION',   3620000),
  ('2025-26', 'EXISTING_INSTITUTION',   15000000),
  ('2026-27', 'CAPITAL_SUBSIDY',        50000000),
  ('2026-27', 'RESEARCH_GRANT',          2000000),
  ('2026-27', 'TEACHER_CERTIFICATION',   3620000),
  ('2026-27', 'EXISTING_INSTITUTION',   15000000),
  ('2027-28', 'CAPITAL_SUBSIDY',        50000000),
  ('2027-28', 'RESEARCH_GRANT',          2000000),
  ('2027-28', 'TEACHER_CERTIFICATION',   3620000),
  ('2027-28', 'EXISTING_INSTITUTION',   15000000);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_scheme ON applications(scheme_type);
CREATE INDEX idx_applications_district ON applications(district);
CREATE INDEX idx_applications_fy ON applications(financial_year);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_yoga_centres_district ON yoga_centres(district);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

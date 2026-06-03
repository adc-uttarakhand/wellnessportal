-- ================================================================
-- UTTARAKHAND YOGA POLICY PORTAL - PostgreSQL Schema
-- ================================================================

-- ENUMS
CREATE TYPE user_role AS ENUM ('STATE_ADMIN', 'DISTRICT_ADMIN', 'YOGA_CENTRE', 'YOGA_INSTRUCTOR', 'APPLICANT');
CREATE TYPE district_name AS ENUM (
  'Almora','Bageshwar','Chamoli','Champawat','Dehradun',
  'Haridwar','Nainital','Pauri Garhwal','Pithoragarh',
  'Rudraprayag','Tehri Garhwal','Udham Singh Nagar','Uttarkashi'
);
CREATE TYPE application_type AS ENUM (
  'YOGA_CENTRE_SUBSIDY',    -- 6.1 Capital subsidy
  'RESEARCH_GRANT',         -- 6.2 R&D grant
  'TEACHER_CERTIFICATION',  -- 6.3 YCB exam fee reimbursement
  'EXISTING_INSTITUTION'    -- 6.4 Yoga in existing institutions
);
CREATE TYPE application_status AS ENUM (
  'DRAFT','SUBMITTED','UNDER_SCRUTINY','DOCS_REQUIRED',
  'FORWARDED_SLRC','APPROVED','REJECTED','WAITLISTED','DISBURSED'
);
CREATE TYPE ycb_level AS ENUM ('1','2','3','4','5','6','7');
CREATE TYPE location_category AS ENUM ('HILLS','PLAINS');
CREATE TYPE entity_type AS ENUM ('HOMESTAY','RESORT','HOTEL','SCHOOL','COLLEGE','YOGA_CENTRE','OTHER');

-- ================================================================
-- USERS & AUTH
-- ================================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  mobile          TEXT,
  role            user_role NOT NULL,
  district        district_name,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- YOGA CENTRE REGISTRATION
-- ================================================================
CREATE TABLE yoga_centres (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id),
  centre_name         TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  district            district_name NOT NULL,
  address             TEXT NOT NULL,
  pin_code            TEXT,
  location_category   location_category,
  altitude_meters     NUMERIC,
  capacity            INTEGER,
  is_ycb_certified    BOOLEAN DEFAULT FALSE,
  contact_person      TEXT,
  contact_mobile      TEXT,
  contact_email       TEXT,
  established_date    DATE,
  is_yoga_hub         BOOLEAN DEFAULT FALSE,
  status              TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  verified_by         UUID REFERENCES users(id),
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- YOGA INSTRUCTOR / PROFESSIONAL REGISTRATION
-- ================================================================
CREATE TABLE yoga_instructors (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES users(id),
  full_name           TEXT NOT NULL,
  aadhaar_last4       TEXT,
  date_of_birth       DATE,
  district            district_name,
  address             TEXT,
  ycb_level           ycb_level,
  ycb_certificate_no  TEXT,
  ycb_certificate_url TEXT,
  qualification       TEXT,
  experience_years    INTEGER DEFAULT 0,
  current_institutions INTEGER DEFAULT 0, -- max 5 under Policy 3.4
  status              TEXT DEFAULT 'PENDING',
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- APPLICATIONS - MASTER TABLE
-- ================================================================
CREATE TABLE applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upn               TEXT UNIQUE, -- Unique Project Number
  applicant_id      UUID REFERENCES users(id) NOT NULL,
  application_type  application_type NOT NULL,
  status            application_status DEFAULT 'DRAFT',
  district          district_name,
  assigned_nodal    UUID REFERENCES users(id),
  submitted_at      TIMESTAMPTZ,
  last_updated      TIMESTAMPTZ DEFAULT now(),
  remarks           TEXT,
  financial_year    TEXT, -- e.g. '2025-26'
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Generate UPN on submission
CREATE OR REPLACE FUNCTION generate_upn() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'SUBMITTED' AND OLD.status = 'DRAFT' THEN
    NEW.upn := 'UK-YP-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(CAST(FLOOR(RANDOM()*900000+100000) AS TEXT), 6, '0');
    NEW.submitted_at := now();
  END IF;
  NEW.last_updated := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_upn BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION generate_upn();

-- ================================================================
-- 6.1 CAPITAL SUBSIDY - YOGA & MEDITATION CENTRE
-- ================================================================
CREATE TABLE application_capital_subsidy (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id        UUID REFERENCES applications(id) UNIQUE,
  project_type          TEXT CHECK (project_type IN ('GREENFIELD','EXPANSION')),
  location_category     location_category NOT NULL,
  district              district_name NOT NULL,
  proposed_investment   NUMERIC(15,2),
  eca_amount            NUMERIC(15,2),
  subsidy_claimed       NUMERIC(15,2),
  project_address       TEXT,
  land_ownership        TEXT CHECK (land_ownership IN ('OWNED','LEASED')),
  studio_area_sqft      NUMERIC,
  expected_cod          DATE,
  is_yoga_hub_area      BOOLEAN DEFAULT FALSE,
  dpr_url               TEXT,
  land_doc_url          TEXT,
  ca_cert_url           TEXT,
  -- Instalment tracking
  instalment1_status    TEXT DEFAULT 'PENDING',
  instalment1_date      DATE,
  instalment1_amount    NUMERIC(15,2),
  instalment2_status    TEXT DEFAULT 'PENDING',
  instalment2_date      DATE,
  instalment3_status    TEXT DEFAULT 'PENDING',
  instalment3_date      DATE,
  cod_achieved_date     DATE,
  annual_participants   INTEGER DEFAULT 0
);

-- ================================================================
-- 6.2 RESEARCH & DEVELOPMENT GRANT
-- ================================================================
CREATE TABLE application_research_grant (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id        UUID REFERENCES applications(id) UNIQUE,
  institution_name      TEXT NOT NULL,
  institution_type      TEXT CHECK (institution_type IN ('UNIVERSITY','RESEARCH_INST','MEDICAL_ORG','AYUSH_ORG')),
  pi_name               TEXT NOT NULL,
  pi_age                INTEGER,
  pi_qualification      TEXT,
  pi_ycb_level          ycb_level,
  co_pi_name            TEXT,
  project_title         TEXT NOT NULL,
  objectives            TEXT, -- max 500 words
  project_summary       TEXT, -- max 1500 words
  expected_output       TEXT,
  duration_months       INTEGER CHECK (duration_months BETWEEN 3 AND 24),
  grant_amount          NUMERIC(10,2) CHECK (grant_amount <= 1000000),
  budget_equipment      NUMERIC(10,2), -- 40%
  budget_manpower       NUMERIC(10,2), -- 20%
  budget_documentation  NUMERIC(10,2), -- 15%
  budget_travel         NUMERIC(10,2), -- 20%
  budget_contingency    NUMERIC(10,2), -- 5%
  milestone_chart_url   TEXT,
  non_duplication_decl  BOOLEAN DEFAULT FALSE,
  cycle                 TEXT CHECK (cycle IN ('APRIL_MAY','OCT_NOV')),
  -- Disbursement
  instalment1_status    TEXT DEFAULT 'PENDING', -- 40%
  instalment2_status    TEXT DEFAULT 'PENDING', -- 30% on 40% progress
  instalment3_status    TEXT DEFAULT 'PENDING', -- 30% on completion
  progress_percent      INTEGER DEFAULT 0,
  uc_submitted          BOOLEAN DEFAULT FALSE
);

-- ================================================================
-- 6.3 TEACHER CERTIFICATION REIMBURSEMENT
-- ================================================================
CREATE TABLE application_teacher_cert (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id        UUID REFERENCES applications(id) UNIQUE,
  applicant_name        TEXT NOT NULL,
  ycb_level             ycb_level NOT NULL,
  certification_name    TEXT NOT NULL,
  exam_date             DATE,
  exam_fee_paid         NUMERIC(8,2),
  rank_in_exam          INTEGER,
  ycb_certificate_no    TEXT,
  -- Documents
  fee_receipt_url       TEXT,
  admit_card_url        TEXT,
  ycb_result_url        TEXT,
  ycb_certificate_url   TEXT,
  bank_account_no       TEXT,
  bank_ifsc             TEXT,
  bank_name             TEXT,
  reimbursement_status  TEXT DEFAULT 'PENDING',
  reimbursement_date    DATE
);

-- ================================================================
-- 6.4 PROMOTION OF YOGA IN EXISTING INSTITUTIONS
-- ================================================================
CREATE TABLE application_existing_institution (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id        UUID REFERENCES applications(id) UNIQUE,
  institution_name      TEXT NOT NULL,
  entity_type           entity_type NOT NULL,
  registration_no       TEXT,
  registration_dept     TEXT,
  district              district_name NOT NULL,
  address               TEXT,
  session_capacity      INTEGER,
  sessions_per_month    INTEGER CHECK (sessions_per_month >= 4),
  community_sessions    BOOLEAN DEFAULT FALSE,
  community_purpose     TEXT,
  -- Trainer
  trainer_id            UUID REFERENCES yoga_instructors(id),
  trainer_ycb_cert      TEXT,
  -- Session schedule (JSON array)
  session_schedule      JSONB,
  -- Claims (max 3 months, 20 hrs/month, INR 250/hr)
  month1_hours          NUMERIC(5,2),
  month1_claim          NUMERIC(8,2),
  month1_status         TEXT DEFAULT 'PENDING',
  month2_hours          NUMERIC(5,2),
  month2_claim          NUMERIC(8,2),
  month2_status         TEXT DEFAULT 'PENDING',
  month3_hours          NUMERIC(5,2),
  month3_claim          NUMERIC(8,2),
  month3_status         TEXT DEFAULT 'PENDING',
  total_claimed         NUMERIC(10,2),
  -- Documents
  reg_cert_url          TEXT,
  logbook_url           TEXT,
  self_declaration_url  TEXT,
  invoice_url           TEXT,
  bank_account_no       TEXT,
  bank_ifsc             TEXT,
  bank_name             TEXT,
  nodal_verified        BOOLEAN DEFAULT FALSE,
  nodal_verified_by     UUID REFERENCES users(id),
  nodal_verified_at     TIMESTAMPTZ
);

-- ================================================================
-- APPLICATION TIMELINE / AUDIT LOG
-- ================================================================
CREATE TABLE application_timeline (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES applications(id),
  action          TEXT NOT NULL,
  from_status     application_status,
  to_status       application_status,
  performed_by    UUID REFERENCES users(id),
  remarks         TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- DOCUMENTS
-- ================================================================
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES applications(id),
  document_type   TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  uploaded_by     UUID REFERENCES users(id),
  uploaded_at     TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- NOTIFICATIONS
-- ================================================================
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id),
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  application_id  UUID REFERENCES applications(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ================================================================
-- ANNUAL SUBSIDY TRACKER (to enforce annual caps)
-- ================================================================
CREATE TABLE annual_subsidy_tracker (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_year      TEXT NOT NULL,
  component           application_type NOT NULL,
  approved_amount     NUMERIC(15,2) DEFAULT 0,
  cap_amount          NUMERIC(15,2) NOT NULL,
  last_updated        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(financial_year, component)
);

-- Insert initial caps per policy
INSERT INTO annual_subsidy_tracker (financial_year, component, cap_amount) VALUES
  ('2025-26', 'YOGA_CENTRE_SUBSIDY', 50000000),   -- 5 Cr
  ('2025-26', 'RESEARCH_GRANT', 2000000),           -- 20 L
  ('2025-26', 'TEACHER_CERTIFICATION', 3620000),    -- 36.2 L
  ('2025-26', 'EXISTING_INSTITUTION', 15000000),    -- 1.5 Cr
  ('2026-27', 'YOGA_CENTRE_SUBSIDY', 50000000),
  ('2026-27', 'RESEARCH_GRANT', 2000000),
  ('2026-27', 'TEACHER_CERTIFICATION', 3620000),
  ('2026-27', 'EXISTING_INSTITUTION', 15000000);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX idx_applications_applicant ON applications(applicant_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_type ON applications(application_type);
CREATE INDEX idx_applications_district ON applications(district);
CREATE INDEX idx_timeline_application ON application_timeline(application_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);


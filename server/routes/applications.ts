import { Router, Response } from 'express';
import { query, withTransaction } from '../db/pool.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Helper: generate UPN
async function generateUPN(scheme: string): Promise<string> {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(2);
  const prefixes: Record<string, string> = {
    CAPITAL_SUBSIDY: 'CS', RESEARCH_GRANT: 'RG',
    TEACHER_CERTIFICATION: 'TC', EXISTING_INSTITUTION: 'EI',
  };
  const prefix = prefixes[scheme] || 'AP';
  const result = await query('SELECT COUNT(*) FROM applications WHERE scheme_type=$1', [scheme]);
  const seq = String(parseInt(result.rows[0].count) + 1).padStart(5, '0');
  return `UK-YOGA-${prefix}-${yr}-${seq}`;
}

// ── GET /api/applications  (list - role filtered) ──────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  const { role, id, district } = req.user!;
  let sql = `SELECT a.*, u.full_name as applicant_name FROM applications a
             LEFT JOIN users u ON u.id = a.applicant_user_id WHERE 1=1`;
  const params: unknown[] = [];

  if (role === 'DISTRICT_ADMIN') {
    params.push(district);
    sql += ` AND a.district = $${params.length}`;
  } else if (!['STATE_ADMIN'].includes(role)) {
    params.push(id);
    sql += ` AND a.applicant_user_id = $${params.length}`;
  }
  if (req.query.scheme) {
    params.push(req.query.scheme);
    sql += ` AND a.scheme_type = $${params.length}`;
  }
  if (req.query.status) {
    params.push(req.query.status);
    sql += ` AND a.status = $${params.length}`;
  }
  sql += ' ORDER BY a.created_at DESC';
  const result = await query(sql, params);
  res.json(result.rows);
});

// ── GET /api/applications/:id  (detail) ────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const appResult = await query('SELECT * FROM applications WHERE id=$1', [req.params.id]);
  if (!appResult.rows.length) return res.status(404).json({ error: 'Not found' });
  const app = appResult.rows[0];

  // fetch scheme-specific detail
  let detail = null;
  const tableMap: Record<string, string> = {
    CAPITAL_SUBSIDY: 'capital_subsidy_applications',
    RESEARCH_GRANT: 'research_grant_applications',
    TEACHER_CERTIFICATION: 'teacher_cert_applications',
    EXISTING_INSTITUTION: 'existing_institution_applications',
  };
  const tbl = tableMap[app.scheme_type];
  if (tbl) {
    const dr = await query(`SELECT * FROM ${tbl} WHERE application_id=$1`, [app.id]);
    detail = dr.rows[0] || null;
  }
  res.json({ ...app, detail });
});

// ── POST /api/applications/capital-subsidy ─────────────────────────────────
router.post('/capital-subsidy', async (req: AuthRequest, res: Response) => {
  const body = req.body;
  try {
    await withTransaction(async (client) => {
      const fy = body.financial_year || '2025-26';
      const upn = await generateUPN('CAPITAL_SUBSIDY');
      const appRes = await client.query(
        `INSERT INTO applications (application_number, scheme_type, applicant_user_id, yoga_centre_id, district, financial_year, status)
         VALUES ($1,'CAPITAL_SUBSIDY',$2,$3,$4,$5,'SUBMITTED') RETURNING id`,
        [upn, req.user!.id, body.yoga_centre_id || null, body.district, fy]
      );
      const appId = appRes.rows[0].id;
      await client.query(
        `UPDATE applications SET submission_date=NOW() WHERE id=$1`, [appId]
      );
      const pct = body.area_category === 'HILLS' ? 50 : 25;
      const maxCap = body.area_category === 'HILLS' ? 2000000 : 1000000;
      const calc = Math.min((body.eligible_capital_assets || 0) * pct / 100, maxCap);
      await client.query(
        `INSERT INTO capital_subsidy_applications
         (application_id, yoga_centre_id, project_type, proposed_investment_inr,
          eligible_capital_assets, area_category, subsidy_percentage, calculated_subsidy,
          land_ownership_type, dpr_path, ca_certificate_path, land_document_path)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [appId, body.yoga_centre_id, body.project_type, body.proposed_investment,
         body.eligible_capital_assets, body.area_category, pct, calc,
         body.land_ownership_type, body.dpr_path || null,
         body.ca_certificate_path || null, body.land_document_path || null]
      );
      // update budget tracker
      await client.query(
        `UPDATE annual_budget_tracker SET approved_amount_inr = approved_amount_inr + $1
         WHERE financial_year=$2 AND scheme_type='CAPITAL_SUBSIDY'`,
        [calc, fy]
      );
      res.status(201).json({ application_number: upn, id: appId, calculated_subsidy: calc });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// ── POST /api/applications/research-grant ─────────────────────────────────
router.post('/research-grant', async (req: AuthRequest, res: Response) => {
  const body = req.body;
  try {
    await withTransaction(async (client) => {
      const upn = await generateUPN('RESEARCH_GRANT');
      const fy = body.financial_year || '2025-26';
      const appRes = await client.query(
        `INSERT INTO applications (application_number, scheme_type, applicant_user_id, district, financial_year, status)
         VALUES ($1,'RESEARCH_GRANT',$2,$3,$4,'SUBMITTED') RETURNING id`,
        [upn, req.user!.id, body.district, fy]
      );
      const appId = appRes.rows[0].id;
      await client.query(`UPDATE applications SET submission_date=NOW() WHERE id=$1`, [appId]);
      await client.query(
        `INSERT INTO research_grant_applications
         (application_id, institution_name, institution_type, institution_established_yr,
          pi_name, pi_age, pi_qualification, pi_ycb_level, pi_affiliation,
          co_pi_name, co_pi_qualification, project_title, project_objectives,
          project_summary, expected_output, project_duration_months, grant_requested_inr,
          budget_equipment, budget_manpower, budget_documentation, budget_travel,
          budget_contingency, non_duplication_declaration, application_cycle)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
        [appId, body.institution_name, body.institution_type, body.institution_established_yr,
         body.pi_name, body.pi_age, body.pi_qualification, body.pi_ycb_level || null,
         body.pi_affiliation, body.co_pi_name || null, body.co_pi_qualification || null,
         body.project_title, body.project_objectives, body.project_summary,
         body.expected_output, body.project_duration_months, body.grant_requested_inr,
         body.budget_equipment, body.budget_manpower, body.budget_documentation,
         body.budget_travel, body.budget_contingency,
         body.non_duplication_declaration === true, body.application_cycle]
      );
      res.status(201).json({ application_number: upn, id: appId });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// ── POST /api/applications/teacher-certification ──────────────────────────
router.post('/teacher-certification', async (req: AuthRequest, res: Response) => {
  const body = req.body;
  // Fee map per YCB level
  const feeMap: Record<string, number> = {
    LEVEL_1: 3250, LEVEL_2: 4750, LEVEL_3: 6250, LEVEL_4: 6250,
    LEVEL_5: 11750, LEVEL_6: 8250, LEVEL_7: 7250,
  };
  try {
    await withTransaction(async (client) => {
      const upn = await generateUPN('TEACHER_CERTIFICATION');
      const fy = body.financial_year || '2025-26';
      const appRes = await client.query(
        `INSERT INTO applications (application_number, scheme_type, applicant_user_id, district, financial_year, status)
         VALUES ($1,'TEACHER_CERTIFICATION',$2,$3,$4,'SUBMITTED') RETURNING id`,
        [upn, req.user!.id, body.district, fy]
      );
      const appId = appRes.rows[0].id;
      await client.query(`UPDATE applications SET submission_date=NOW() WHERE id=$1`, [appId]);
      const reimb = feeMap[body.ycb_level] || 0;
      await client.query(
        `INSERT INTO teacher_cert_applications
         (application_id, applicant_name, aadhaar_number, district, ycb_level,
          ycb_cert_number, exam_date, exam_fee_paid, rank_in_exam,
          bank_account_number, bank_ifsc, bank_name,
          fee_receipt_path, admit_card_path, result_path, certificate_path, reimbursement_amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [appId, body.applicant_name, body.aadhaar_number, body.district,
         body.ycb_level, body.ycb_cert_number, body.exam_date,
         body.exam_fee_paid, body.rank_in_exam,
         body.bank_account_number, body.bank_ifsc, body.bank_name,
         body.fee_receipt_path || null, body.admit_card_path || null,
         body.result_path || null, body.certificate_path || null, reimb]
      );
      res.status(201).json({ application_number: upn, id: appId, reimbursement_amount: reimb });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// ── POST /api/applications/existing-institution ───────────────────────────
router.post('/existing-institution', async (req: AuthRequest, res: Response) => {
  const body = req.body;
  try {
    await withTransaction(async (client) => {
      const upn = await generateUPN('EXISTING_INSTITUTION');
      const fy = body.financial_year || '2025-26';
      const appRes = await client.query(
        `INSERT INTO applications (application_number, scheme_type, applicant_user_id, district, financial_year, status)
         VALUES ($1,'EXISTING_INSTITUTION',$2,$3,$4,'SUBMITTED') RETURNING id`,
        [upn, req.user!.id, body.district, fy]
      );
      const appId = appRes.rows[0].id;
      await client.query(`UPDATE applications SET submission_date=NOW() WHERE id=$1`, [appId]);
      const hours = Math.min(body.claimed_hours_per_month || 20, 20);
      const months = Math.min(body.claimed_months || 1, 3);
      const total = 250 * hours * months;
      await client.query(
        `INSERT INTO existing_institution_applications
         (application_id, institution_name, institution_type, registration_cert_number,
          registering_dept, district, address, capacity_per_session, sessions_per_day,
          sessions_per_month, trainer_name, trainer_ycb_cert, trainer_ycb_level,
          trainer_other_institutions, has_community_sessions, community_session_purpose,
          claimed_months, claimed_hours_per_month, total_claimed_amount,
          bank_account_number, bank_ifsc, bank_name, registration_cert_path)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
        [appId, body.institution_name, body.institution_type, body.registration_cert_number,
         body.registering_dept, body.district, body.address,
         body.capacity_per_session, body.sessions_per_day, body.sessions_per_month,
         body.trainer_name, body.trainer_ycb_cert, body.trainer_ycb_level || null,
         body.trainer_other_institutions || 0,
         body.has_community_sessions || false, body.community_session_purpose || null,
         months, hours, total,
         body.bank_account_number, body.bank_ifsc, body.bank_name,
         body.registration_cert_path || null]
      );
      res.status(201).json({ application_number: upn, id: appId, total_claimed_amount: total });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// ── PATCH /api/applications/:id/status  (admin action) ───────────────────
router.patch('/:id/status', requireRole('STATE_ADMIN', 'DISTRICT_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { status, rejection_reason, query_text } = req.body;
  const allowed = ['UNDER_REVIEW', 'QUERY_RAISED', 'APPROVED', 'REJECTED', 'WAITLISTED', 'DISBURSED'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  await query(
    `UPDATE applications SET status=$1, rejection_reason=$2, query_text=$3,
     review_date=CASE WHEN $1='UNDER_REVIEW' THEN NOW() ELSE review_date END,
     approval_date=CASE WHEN $1='APPROVED' THEN NOW() ELSE approval_date END,
     approved_by=CASE WHEN $1='APPROVED' THEN $4 ELSE approved_by END,
     query_raised_at=CASE WHEN $1='QUERY_RAISED' THEN NOW() ELSE query_raised_at END,
     updated_at=NOW()
     WHERE id=$5`,
    [status, rejection_reason || null, query_text || null, req.user!.id, req.params.id]
  );
  res.json({ message: 'Status updated' });
});

// ── PATCH /api/applications/:id/query-response ────────────────────────────
router.patch('/:id/query-response', async (req: AuthRequest, res: Response) => {
  const { response } = req.body;
  await query(
    `UPDATE applications SET query_response=$1, query_responded_at=NOW(),
     status='UNDER_REVIEW', updated_at=NOW() WHERE id=$2 AND applicant_user_id=$3`,
    [response, req.params.id, req.user!.id]
  );
  res.json({ message: 'Response submitted' });
});

export default router;

import { Router, Response } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// ── GET /api/admin/stats ───────────────────────────────────────────────────
router.get('/stats', requireRole('STATE_ADMIN', 'DISTRICT_ADMIN'), async (req: AuthRequest, res: Response) => {
  const distFilter = req.user!.role === 'DISTRICT_ADMIN' ? `AND a.district = '${req.user!.district}'` : '';
  try {
    const [total, byScheme, byStatus, budget, recentApps] = await Promise.all([
      query(`SELECT COUNT(*) FROM applications a WHERE 1=1 ${distFilter}`),
      query(`SELECT scheme_type, COUNT(*) as count FROM applications a WHERE 1=1 ${distFilter} GROUP BY scheme_type`),
      query(`SELECT status, COUNT(*) as count FROM applications a WHERE 1=1 ${distFilter} GROUP BY status`),
      query(`SELECT * FROM annual_budget_tracker WHERE financial_year='2025-26' ORDER BY scheme_type`),
      query(`SELECT a.application_number, a.scheme_type, a.status, a.submission_date, u.full_name
             FROM applications a LEFT JOIN users u ON u.id=a.applicant_user_id
             WHERE 1=1 ${distFilter} ORDER BY a.created_at DESC LIMIT 10`),
    ]);
    res.json({
      total: parseInt(total.rows[0].count),
      by_scheme: byScheme.rows,
      by_status: byStatus.rows,
      budget: budget.rows,
      recent: recentApps.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// ── GET /api/admin/users ───────────────────────────────────────────────────
router.get('/users', requireRole('STATE_ADMIN'), async (_req: AuthRequest, res: Response) => {
  const result = await query(
    'SELECT id, username, email, role, full_name, mobile, district, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

// ── POST /api/admin/users  (create admin users) ────────────────────────────
router.post('/users', requireRole('STATE_ADMIN'), async (req: AuthRequest, res: Response) => {
  const bcrypt = await import('bcryptjs');
  const { username, email, password, full_name, mobile, role, district } = req.body;
  const adminRoles = ['STATE_ADMIN', 'DISTRICT_ADMIN'];
  if (!adminRoles.includes(role)) return res.status(400).json({ error: 'Can only create admin roles here' });
  try {
    const hash = await bcrypt.default.hash(password, 12);
    const result = await query(
      `INSERT INTO users (username, email, password_hash, full_name, mobile, role, district)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, username, email, role, full_name, district`,
      [username, email, hash, full_name, mobile || null, role, district || null]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ── PATCH /api/admin/users/:id/toggle ─────────────────────────────────────
router.patch('/users/:id/toggle', requireRole('STATE_ADMIN'), async (req: AuthRequest, res: Response) => {
  await query('UPDATE users SET is_active = NOT is_active, updated_at=NOW() WHERE id=$1', [req.params.id]);
  res.json({ message: 'User status toggled' });
});

// ── GET /api/admin/budget ──────────────────────────────────────────────────
router.get('/budget', requireRole('STATE_ADMIN'), async (_req: AuthRequest, res: Response) => {
  const result = await query('SELECT * FROM annual_budget_tracker ORDER BY financial_year, scheme_type');
  res.json(result.rows);
});

// ── GET /api/admin/registrations ──────────────────────────────────────────
router.get('/registrations', requireRole('STATE_ADMIN', 'DISTRICT_ADMIN'), async (req: AuthRequest, res: Response) => {
  const distFilter = req.user!.role === 'DISTRICT_ADMIN' ? `WHERE district='${req.user!.district}'` : '';
  const [centres, professionals] = await Promise.all([
    query(`SELECT yc.*, u.email FROM yoga_centres yc LEFT JOIN users u ON u.id=yc.user_id ${distFilter} ORDER BY yc.created_at DESC`),
    query(`SELECT yp.*, u.email FROM yoga_professionals yp LEFT JOIN users u ON u.id=yp.user_id ${distFilter.replace('district', 'yp.district')} ORDER BY yp.created_at DESC`),
  ]);
  res.json({ centres: centres.rows, professionals: professionals.rows });
});

// ── POST /api/admin/registrations/:type/:id/verify ────────────────────────
router.post('/registrations/:type/:id/verify', requireRole('STATE_ADMIN', 'DISTRICT_ADMIN'), async (req: AuthRequest, res: Response) => {
  const tbl = req.params.type === 'centre' ? 'yoga_centres' : 'yoga_professionals';
  await query(
    `UPDATE ${tbl} SET is_verified=true, verified_by=$1, verified_at=NOW() WHERE id=$2`,
    [req.user!.id, req.params.id]
  );
  res.json({ message: 'Verified successfully' });
});

export default router;

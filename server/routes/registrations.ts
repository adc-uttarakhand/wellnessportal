import { Router, Response } from 'express';
import { query } from '../db/pool.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// PUBLIC — Yoga Centre Directory (no auth required)
router.get('/yoga-centre/public', async (_req, res: Response) => {
  try {
    const result = await query(
      `SELECT id, centre_name, district, centre_type, address, pincode,
              contact_person, contact_mobile, capacity_per_session,
              is_verified, created_at
       FROM yoga_centres
       WHERE is_verified = true
       ORDER BY district, centre_name`
    );
    return res.json(result.rows);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch centres' });
  }
});

router.use(authenticateToken);

// ── POST /api/registrations/yoga-centre ───────────────────────────────────
router.post('/yoga-centre', async (req: AuthRequest, res: Response) => {
  const b = req.body;
  try {
    const result = await query(
      `INSERT INTO yoga_centres
       (user_id, centre_name, district, block, village_town, address, pincode,
        area_category, altitude_meters, centre_type, total_area_sqft,
        studio_area_sqft, capacity_per_session, contact_person, contact_mobile,
        contact_email, website, registration_cert_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING id, centre_name`,
      [req.user!.id, b.centre_name, b.district, b.block || null, b.village_town || null,
       b.address, b.pincode || null, b.area_category || null, b.altitude_meters || null,
       b.centre_type, b.total_area_sqft || null, b.studio_area_sqft || null,
       b.capacity_per_session || null, b.contact_person || null, b.contact_mobile || null,
       b.contact_email || null, b.website || null, b.registration_cert_path || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── GET /api/registrations/yoga-centre/my ────────────────────────────────
router.get('/yoga-centre/my', async (req: AuthRequest, res: Response) => {
  const result = await query('SELECT * FROM yoga_centres WHERE user_id=$1', [req.user!.id]);
  res.json(result.rows);
});

// ── POST /api/registrations/yoga-professional ─────────────────────────────
router.post('/yoga-professional', async (req: AuthRequest, res: Response) => {
  const b = req.body;
  try {
    const result = await query(
      `INSERT INTO yoga_professionals
       (user_id, full_name, aadhaar_number, date_of_birth, gender, district,
        address, mobile, email, ycb_level, ycb_cert_number, ycb_cert_date,
        ycb_cert_path, aadhaar_path, photo_path)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id, full_name`,
      [req.user!.id, b.full_name, b.aadhaar_number, b.date_of_birth || null,
       b.gender || null, b.district, b.address || null, b.mobile || null,
       b.email || null, b.ycb_level || null, b.ycb_cert_number || null,
       b.ycb_cert_date || null, b.ycb_cert_path || null,
       b.aadhaar_path || null, b.photo_path || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── GET /api/registrations/yoga-professional/my ───────────────────────────
router.get('/yoga-professional/my', async (req: AuthRequest, res: Response) => {
  const result = await query('SELECT * FROM yoga_professionals WHERE user_id=$1', [req.user!.id]);
  res.json(result.rows);
});

export default router;

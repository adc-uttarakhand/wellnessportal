import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const result = await query(
      'SELECT id, username, email, password_hash, role, full_name, district, is_active FROM users WHERE username = $1',
      [username]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact administrator.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken({ id: user.id, role: user.role, district: user.district });
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        district: user.district,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/register (public registration for yoga centres / professionals / applicants)
router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password, full_name, mobile, role, district } = req.body;
  const allowedRoles = ['YOGA_CENTRE', 'YOGA_PROFESSIONAL', 'APPLICANT'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role for public registration' });
  }
  if (!username || !email || !password || !full_name) {
    return res.status(400).json({ error: 'Required fields missing' });
  }
  try {
    const existing = await query('SELECT id FROM users WHERE username=$1 OR email=$2', [username, email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (username, email, password_hash, full_name, mobile, role, district)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, username, email, role, full_name, district`,
      [username, email, hash, full_name, mobile || null, role, district || null]
    );
    const user = result.rows[0];
    const token = generateToken({ id: user.id, role: user.role, district: user.district });
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, username, email, role, full_name, mobile, district FROM users WHERE id=$1',
      [req.user!.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  try {
    const result = await query('SELECT password_hash FROM users WHERE id=$1', [req.user!.id]);
    const valid = await bcrypt.compare(old_password, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, req.user!.id]);
    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;

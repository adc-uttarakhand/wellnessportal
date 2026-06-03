import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="login-hero-content">
          <div style={{ fontSize: 64, marginBottom: 20 }}>🙏</div>
          <h1>उत्तराखण्ड योग नीति पोर्टल</h1>
          <p style={{ marginTop: 10, marginBottom: 28 }}>
            Uttarakhand Yoga Policy 2025<br />
            Department of AYUSH & AYUSH Education
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            {[
              'Yoga Centre Registration & Capital Subsidy',
              'Research & Development Grant Applications',
              'YCB Teacher Certification Reimbursement',
              'Existing Institution Session Support',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ color: '#E8751A', fontSize: 16 }}>✓</span> {f}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, padding: '16px 20px', background: 'rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            🏛️ Government of Uttarakhand<br />
            Valid: 2025–2030 · Total Outlay: ₹35.31 Cr
          </div>
        </div>
      </div>

      <div className="login-form-section">
        <div className="login-form-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, background: 'var(--saffron)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏔️</div>
            <div>
              <h2 style={{ marginBottom: 0 }}>Sign In</h2>
              <div className="subtitle" style={{ marginBottom: 0 }}>Access your portal account</div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required">Username / Mobile</label>
              <input
                className="form-control"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              <LogIn size={16} />
              {loading ? 'Signing in...' : 'Sign In to Portal'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '16px', background: 'var(--off-white)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>New to the Portal?</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
              Yoga Centres, Professionals, and Applicants can self-register. Admin accounts are created by State Admin.
            </p>
            <Link to="/register" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              Register New Account
            </Link>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 20, textAlign: 'center' }}>
            For technical issues contact: ayush-portal@uk.gov.in
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DISTRICTS } from '../types';

const ROLE_OPTIONS = [
  { value: 'YOGA_CENTRE', label: 'Yoga Centre / Institute', desc: 'Register a yoga centre or training institute' },
  { value: 'YOGA_PROFESSIONAL', label: 'Yoga Professional / Instructor', desc: 'YCB certified instructors and teachers' },
  { value: 'APPLICANT', label: 'Applicant (Researcher / Institution)', desc: 'Research institutions, homestays, colleges etc.' },
];

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm_password: '', full_name: '', mobile: '', district: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    setError('');
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { authApi } = await import('../utils/api');
      await authApi.register({ ...form, role });
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 560, background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'var(--navy)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
          <h2 style={{ color: 'white', marginBottom: 4, fontFamily: 'Noto Serif, serif' }}>Create Portal Account</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Uttarakhand Yoga Policy 2025 — AYUSH Department</p>
        </div>

        <div style={{ padding: '28px' }}>
          <div className="steps" style={{ marginBottom: 28 }}>
            {['Select Role', 'Personal Info', 'Create Account'].map((label, i) => (
              <React.Fragment key={label}>
                <div className={`step ${step > i+1 ? 'completed' : step === i+1 ? 'active' : 'pending'}`}>
                  <div className="step-num">{step > i+1 ? '✓' : i+1}</div>
                  <div className="step-label">{label}</div>
                </div>
                {i < 2 && <div className="step-line" />}
              </React.Fragment>
            ))}
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {step === 1 && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>Select your registration type:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ROLE_OPTIONS.map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => setRole(opt.value)}
                    style={{
                      padding: '14px 16px', borderRadius: 'var(--radius)', cursor: 'pointer',
                      border: `2px solid ${role === opt.value ? 'var(--saffron)' : 'var(--border)'}`,
                      background: role === opt.value ? 'var(--saffron-light)' : 'white',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                <Link to="/login" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>← Back to Login</Link>
                <button className="btn btn-primary" onClick={() => { if (!role) { setError('Please select a role'); return; } setError(''); setStep(2); }} disabled={!role}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label required">Full Name</label>
                  <input className="form-control" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="As per Aadhaar" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Mobile Number</label>
                  <input className="form-control" value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="10-digit mobile" maxLength={10} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">Email Address</label>
                <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label required">District</label>
                <select className="form-control" value={form.district} onChange={e => set('district', e.target.value)}>
                  <option value="">-- Select District --</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary" onClick={() => {
                  if (!form.full_name || !form.email || !form.district || !form.mobile) { setError('All fields required'); return; }
                  setError(''); setStep(3);
                }}>Continue →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="form-group">
                <label className="form-label required">Username</label>
                <input className="form-control" value={form.username} onChange={e => set('username', e.target.value)} placeholder="Choose a username (no spaces)" />
                <div className="form-hint">This will be used to login. Cannot be changed later.</div>
              </div>
              <div className="form-group">
                <label className="form-label required">Password</label>
                <input className="form-control" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 8 characters" />
              </div>
              <div className="form-group">
                <label className="form-label required">Confirm Password</label>
                <input className="form-control" type="password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} placeholder="Repeat password" />
              </div>
              <div style={{ background: 'var(--off-white)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
                ℹ️ By registering, you agree that information provided will be verified by the Directorate of Yoga.
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-green" onClick={handleRegister} disabled={loading}>
                  {loading ? 'Creating Account...' : '✓ Create Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

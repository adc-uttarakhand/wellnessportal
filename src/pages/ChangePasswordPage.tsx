import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../utils/api';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError('');
    if (form.new_password.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (form.new_password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authApi.changePassword(form.old_password, form.new_password);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: '480px' }}>
      <h1 style={{ margin: '0 0 1.5rem', color: 'var(--navy)', fontSize: '1.4rem' }}>Change Password</h1>

      {success ? (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          <p style={{ color: '#15803D', fontWeight: 600, margin: 0 }}>Password changed successfully!</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>Redirecting to dashboard...</p>
        </div>
      ) : (
        <div className="card">
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Current Password *</label>
            <input className="form-input" type="password" value={form.old_password}
              onChange={e => setForm(p => ({ ...p, old_password: e.target.value }))}
              placeholder="Enter current password" />
          </div>
          <div className="form-group">
            <label className="form-label">New Password *</label>
            <input className="form-input" type="password" value={form.new_password}
              onChange={e => setForm(p => ({ ...p, new_password: e.target.value }))}
              placeholder="Min 8 characters" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password *</label>
            <input className="form-input" type="password" value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Re-enter new password" />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !form.old_password || !form.new_password || !form.confirm}>
              {loading ? 'Changing...' : '🔐 Change Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

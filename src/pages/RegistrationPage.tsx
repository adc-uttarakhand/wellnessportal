import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { regApi } from '../utils/api';
import { DISTRICTS, YCB_LEVELS, YCBLevel } from '../types';

type RegType = 'centre' | 'professional' | null;

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [regType, setRegType] = useState<RegType>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [centreForm, setCentreForm] = useState({
    centre_name: '', address: '', district: '', pincode: '',
    centre_type: '', contact_person: '', contact_mobile: '', contact_email: '',
    total_area_sqft: '', capacity_per_session: '',
  });

  const [profForm, setProfForm] = useState({
    full_name: '', date_of_birth: '', gender: '',
    address: '', district: '', mobile: '',
    ycb_level: '' as YCBLevel | '',
    years_experience: '', specializations: '',
  });

  const ycbLevelKeys = Object.keys(YCB_LEVELS) as YCBLevel[];

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      if (regType === 'centre') {
        await regApi.registerCentre(centreForm as unknown as Record<string, unknown>);
      } else {
        await regApi.registerProfessional(profForm as unknown as Record<string, unknown>);
      }
      setSuccess(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div className="page-container" style={{ maxWidth: '600px' }}>
      <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ color: 'var(--primary-green)', marginBottom: '0.5rem' }}>Registration Submitted!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Your {regType === 'centre' ? 'Yoga Centre' : 'Yoga Professional'} registration is pending verification by the admin.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          <button className="btn btn-primary" onClick={() => navigate('/applications/new')}>Apply for Scheme</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: '760px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: 'var(--navy)', fontSize: '1.5rem' }}>Register with AYUSH Yoga Portal</h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)' }}>
          Register your Yoga Centre or Professional profile to apply for schemes.
        </p>
      </div>

      {!regType ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: '2rem 1.5rem' }}
            onClick={() => { setRegType('centre'); setStep(1); }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏛️</div>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--navy)' }}>Yoga Centre</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Register a yoga/meditation centre
            </p>
          </div>
          <div className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: '2rem 1.5rem' }}
            onClick={() => { setRegType('professional'); setStep(1); }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🧘</div>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--navy)' }}>Yoga Professional</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Register as a certified yoga teacher / instructor
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          {regType === 'centre' && step === 1 && (
            <div>
              <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Centre Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Centre Name *</label>
                  <input className="form-input" value={centreForm.centre_name}
                    onChange={e => setCentreForm(p => ({ ...p, centre_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Centre Type *</label>
                  <select className="form-input" value={centreForm.centre_type}
                    onChange={e => setCentreForm(p => ({ ...p, centre_type: e.target.value }))}>
                    <option value="">Select type</option>
                    <option value="Yoga Hub">Yoga Hub</option>
                    <option value="Meditation Centre">Meditation Centre</option>
                    <option value="Training Institute">Training Institute</option>
                    <option value="Wellness Centre">Wellness Centre</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address *</label>
                <textarea className="form-input" rows={2} value={centreForm.address}
                  onChange={e => setCentreForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">District *</label>
                  <select className="form-input" value={centreForm.district}
                    onChange={e => setCentreForm(p => ({ ...p, district: e.target.value }))}>
                    <option value="">Select district</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">PIN Code</label>
                  <input className="form-input" value={centreForm.pincode}
                    onChange={e => setCentreForm(p => ({ ...p, pincode: e.target.value }))} maxLength={6} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Person *</label>
                  <input className="form-input" value={centreForm.contact_person}
                    onChange={e => setCentreForm(p => ({ ...p, contact_person: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input className="form-input" value={centreForm.contact_mobile}
                    onChange={e => setCentreForm(p => ({ ...p, contact_mobile: e.target.value }))} maxLength={10} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Area (sq ft)</label>
                  <input className="form-input" type="number" value={centreForm.total_area_sqft}
                    onChange={e => setCentreForm(p => ({ ...p, total_area_sqft: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity per Session</label>
                  <input className="form-input" type="number" value={centreForm.capacity_per_session}
                    onChange={e => setCentreForm(p => ({ ...p, capacity_per_session: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {regType === 'professional' && step === 1 && (
            <div>
              <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Professional Information</h3>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={profForm.full_name}
                  onChange={e => setProfForm(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input className="form-input" type="date" value={profForm.date_of_birth}
                    onChange={e => setProfForm(p => ({ ...p, date_of_birth: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select className="form-input" value={profForm.gender}
                    onChange={e => setProfForm(p => ({ ...p, gender: e.target.value }))}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address *</label>
                <textarea className="form-input" rows={2} value={profForm.address}
                  onChange={e => setProfForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">District *</label>
                  <select className="form-input" value={profForm.district}
                    onChange={e => setProfForm(p => ({ ...p, district: e.target.value }))}>
                    <option value="">Select district</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile *</label>
                  <input className="form-input" value={profForm.mobile}
                    onChange={e => setProfForm(p => ({ ...p, mobile: e.target.value }))} maxLength={10} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Highest YCB Level *</label>
                  <select className="form-input" value={profForm.ycb_level}
                    onChange={e => setProfForm(p => ({ ...p, ycb_level: e.target.value as YCBLevel }))}>
                    <option value="">Select YCB level</option>
                    {ycbLevelKeys.map(l => (
                      <option key={l} value={l}>{l.replace('_', ' ')} — {YCB_LEVELS[l].name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Years of Experience *</label>
                  <input className="form-input" type="number" value={profForm.years_experience}
                    onChange={e => setProfForm(p => ({ ...p, years_experience: e.target.value }))} min="0" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Specializations</label>
                <input className="form-input" value={profForm.specializations}
                  onChange={e => setProfForm(p => ({ ...p, specializations: e.target.value }))}
                  placeholder="e.g. Pranayama, Children's Yoga, Therapeutic Yoga..." />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost" onClick={() => setRegType(null)}>← Change Type</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : '✅ Submit Registration'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

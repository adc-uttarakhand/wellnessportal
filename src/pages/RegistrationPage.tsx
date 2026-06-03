import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { regApi } from '../utils/api';
import { DISTRICTS, YCB_LEVELS } from '../types';

type RegType = 'centre' | 'professional' | null;

export default function RegistrationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [regType, setRegType] = useState<RegType>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Centre form state
  const [centreForm, setCentreForm] = useState({
    centre_name: '', address: '', district: '', pin_code: '',
    centre_type: '', contact_person: '', contact_phone: '', contact_email: '',
    established_year: '', area_sqft: '', capacity: '',
    existing_certification: '', certification_body: '',
    description: '',
  });

  // Professional form state
  const [profForm, setProfForm] = useState({
    full_name: '', date_of_birth: '', gender: '',
    address: '', district: '', pin_code: '',
    phone: '', alternate_phone: '',
    highest_ycb_level: '', other_certifications: '',
    years_experience: '', specializations: '',
    currently_employed: 'no', employer_name: '',
    bio: '',
  });

  const isCentre = regType === 'centre';
  const isProf = regType === 'professional';

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      if (isCentre) {
        await regApi.post('/yoga-centre', centreForm);
      } else {
        await regApi.post('/yoga-professional', profForm);
      }
      setSuccess(true);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Registration failed. Please try again.');
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
          Your {isCentre ? 'Yoga Centre' : 'Yoga Professional'} registration has been submitted and is pending verification by the district/state admin.
          You will be notified once it is approved.
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
          Register your Yoga Centre or Professional profile to apply for schemes under the Uttarakhand Yoga Policy 2025.
        </p>
      </div>

      {!regType ? (
        // Step 0: Choose type
        <div>
          <p style={{ fontWeight: 500, marginBottom: '1rem', color: 'var(--text)' }}>What would you like to register?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card scheme-card" style={{ cursor: 'pointer', border: '2px solid var(--border)', textAlign: 'center', padding: '2rem 1.5rem' }}
              onClick={() => { setRegType('centre'); setStep(1); }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏛️</div>
              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--navy)' }}>Yoga Centre</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Register a yoga/meditation centre — for centre owners, trusts, institutions
              </p>
            </div>
            <div className="card scheme-card" style={{ cursor: 'pointer', border: '2px solid var(--border)', textAlign: 'center', padding: '2rem 1.5rem' }}
              onClick={() => { setRegType('professional'); setStep(1); }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🧘</div>
              <h3 style={{ margin: '0 0 0.5rem', color: 'var(--navy)' }}>Yoga Professional</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Register as a certified yoga teacher / instructor / therapist
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Progress indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '2rem' }}>
            {(isCentre ? ['Centre Info', 'Contact & Capacity', 'Certification'] : ['Personal Info', 'Address & Contact', 'Qualifications']).map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                    background: step > i + 1 ? 'var(--primary-green)' : step === i + 1 ? 'var(--primary)' : 'var(--border)',
                    color: step >= i + 1 ? 'white' : 'var(--text-muted)',
                  }}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--text)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: '2px', background: step > i + 1 ? 'var(--primary-green)' : 'var(--border)', margin: '0 0.5rem' }} />}
              </div>
            ))}
          </div>

          <div className="card">
            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            {/* CENTRE FORMS */}
            {isCentre && step === 1 && (
              <div>
                <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Centre Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Centre Name *</label>
                    <input className="form-input" value={centreForm.centre_name} onChange={e => setCentreForm(p => ({ ...p, centre_name: e.target.value }))} placeholder="e.g. Patanjali Yoga Kendra" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Centre Type *</label>
                    <select className="form-input" value={centreForm.centre_type} onChange={e => setCentreForm(p => ({ ...p, centre_type: e.target.value }))}>
                      <option value="">Select type</option>
                      <option value="yoga_centre">Yoga Centre</option>
                      <option value="meditation_centre">Meditation Centre</option>
                      <option value="yoga_meditation_centre">Yoga & Meditation Centre</option>
                      <option value="wellness_centre">Wellness Centre</option>
                      <option value="ayurveda_yoga_centre">Ayurveda + Yoga Centre</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Full Address *</label>
                  <textarea className="form-input" rows={2} value={centreForm.address} onChange={e => setCentreForm(p => ({ ...p, address: e.target.value }))} placeholder="Village/Ward, Tehsil, District..." />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">District *</label>
                    <select className="form-input" value={centreForm.district} onChange={e => setCentreForm(p => ({ ...p, district: e.target.value }))}>
                      <option value="">Select district</option>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIN Code</label>
                    <input className="form-input" value={centreForm.pin_code} onChange={e => setCentreForm(p => ({ ...p, pin_code: e.target.value }))} placeholder="2XXXXX" maxLength={6} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Year Established</label>
                  <input className="form-input" type="number" value={centreForm.established_year} onChange={e => setCentreForm(p => ({ ...p, established_year: e.target.value }))} placeholder="e.g. 2015" min="1900" max={new Date().getFullYear()} />
                </div>
                <div className="form-group">
                  <label className="form-label">Brief Description</label>
                  <textarea className="form-input" rows={3} value={centreForm.description} onChange={e => setCentreForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your centre, its activities, and focus areas..." />
                </div>
              </div>
            )}

            {isCentre && step === 2 && (
              <div>
                <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Contact & Capacity Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contact Person *</label>
                    <input className="form-input" value={centreForm.contact_person} onChange={e => setCentreForm(p => ({ ...p, contact_person: e.target.value }))} placeholder="In-charge name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-input" value={centreForm.contact_phone} onChange={e => setCentreForm(p => ({ ...p, contact_phone: e.target.value }))} placeholder="10-digit mobile" maxLength={10} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={centreForm.contact_email} onChange={e => setCentreForm(p => ({ ...p, contact_email: e.target.value }))} placeholder="centre@example.com" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Total Area (sq ft)</label>
                    <input className="form-input" type="number" value={centreForm.area_sqft} onChange={e => setCentreForm(p => ({ ...p, area_sqft: e.target.value }))} placeholder="e.g. 500" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Capacity (students at once)</label>
                    <input className="form-input" type="number" value={centreForm.capacity} onChange={e => setCentreForm(p => ({ ...p, capacity: e.target.value }))} placeholder="e.g. 30" />
                  </div>
                </div>
              </div>
            )}

            {isCentre && step === 3 && (
              <div>
                <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Existing Certifications</h3>
                <div className="form-group">
                  <label className="form-label">Existing Certification (if any)</label>
                  <input className="form-input" value={centreForm.existing_certification} onChange={e => setCentreForm(p => ({ ...p, existing_certification: e.target.value }))} placeholder="e.g. QCI Level 1, YCB Empanelled Centre..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Certifying Body</label>
                  <input className="form-input" value={centreForm.certification_body} onChange={e => setCentreForm(p => ({ ...p, certification_body: e.target.value }))} placeholder="e.g. QCI, Yoga Certification Board, AYUSH Ministry..." />
                </div>
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '1rem', marginTop: '0.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803D' }}>
                    ✅ <strong>Review Summary:</strong> <strong>{centreForm.centre_name || 'Your Centre'}</strong> in <strong>{centreForm.district || '—'}</strong> (Type: {centreForm.centre_type?.replace(/_/g, ' ') || '—'}).<br />
                    Contact: {centreForm.contact_person || '—'} · {centreForm.contact_phone || '—'}.<br />
                    Capacity: {centreForm.capacity || '—'} students · Area: {centreForm.area_sqft || '—'} sq ft.
                  </p>
                </div>
              </div>
            )}

            {/* PROFESSIONAL FORMS */}
            {isProf && step === 1 && (
              <div>
                <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Personal Information</h3>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={profForm.full_name} onChange={e => setProfForm(p => ({ ...p, full_name: e.target.value }))} placeholder="As per Aadhaar" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date of Birth *</label>
                    <input className="form-input" type="date" value={profForm.date_of_birth} onChange={e => setProfForm(p => ({ ...p, date_of_birth: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <select className="form-input" value={profForm.gender} onChange={e => setProfForm(p => ({ ...p, gender: e.target.value }))}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Brief Bio</label>
                  <textarea className="form-input" rows={3} value={profForm.bio} onChange={e => setProfForm(p => ({ ...p, bio: e.target.value }))} placeholder="Your yoga journey, teaching philosophy, areas of expertise..." />
                </div>
              </div>
            )}

            {isProf && step === 2 && (
              <div>
                <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Address & Contact</h3>
                <div className="form-group">
                  <label className="form-label">Residential Address *</label>
                  <textarea className="form-input" rows={2} value={profForm.address} onChange={e => setProfForm(p => ({ ...p, address: e.target.value }))} placeholder="Village/Ward, Tehsil..." />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">District *</label>
                    <select className="form-input" value={profForm.district} onChange={e => setProfForm(p => ({ ...p, district: e.target.value }))}>
                      <option value="">Select district</option>
                      {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIN Code</label>
                    <input className="form-input" value={profForm.pin_code} onChange={e => setProfForm(p => ({ ...p, pin_code: e.target.value }))} placeholder="2XXXXX" maxLength={6} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Mobile Number *</label>
                    <input className="form-input" value={profForm.phone} onChange={e => setProfForm(p => ({ ...p, phone: e.target.value }))} placeholder="10-digit mobile" maxLength={10} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alternate Phone</label>
                    <input className="form-input" value={profForm.alternate_phone} onChange={e => setProfForm(p => ({ ...p, alternate_phone: e.target.value }))} placeholder="Optional" maxLength={10} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Currently Employed?</label>
                    <select className="form-input" value={profForm.currently_employed} onChange={e => setProfForm(p => ({ ...p, currently_employed: e.target.value }))}>
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  {profForm.currently_employed === 'yes' && (
                    <div className="form-group">
                      <label className="form-label">Employer Name</label>
                      <input className="form-input" value={profForm.employer_name} onChange={e => setProfForm(p => ({ ...p, employer_name: e.target.value }))} placeholder="School / Centre / Organisation" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {isProf && step === 3 && (
              <div>
                <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Qualifications & Experience</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Highest YCB Level *</label>
                    <select className="form-input" value={profForm.highest_ycb_level} onChange={e => setProfForm(p => ({ ...p, highest_ycb_level: e.target.value }))}>
                      <option value="">Select YCB level</option>
                      {YCB_LEVELS.map(l => (
                        <option key={l.level} value={l.level.toString()}>Level {l.level} — {l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Years of Experience *</label>
                    <input className="form-input" type="number" value={profForm.years_experience} onChange={e => setProfForm(p => ({ ...p, years_experience: e.target.value }))} placeholder="e.g. 5" min="0" max="60" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Other Certifications</label>
                  <input className="form-input" value={profForm.other_certifications} onChange={e => setProfForm(p => ({ ...p, other_certifications: e.target.value }))} placeholder="e.g. RYT 200, SYHP, Naturopathy Diploma..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Specializations</label>
                  <input className="form-input" value={profForm.specializations} onChange={e => setProfForm(p => ({ ...p, specializations: e.target.value }))} placeholder="e.g. Pranayama, Children's Yoga, Therapeutic Yoga..." />
                </div>
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '1rem', marginTop: '0.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803D' }}>
                    ✅ <strong>Review Summary:</strong> <strong>{profForm.full_name || 'You'}</strong> ({profForm.gender || '—'}), District: <strong>{profForm.district || '—'}</strong>.<br />
                    YCB Level: {profForm.highest_ycb_level ? `Level ${profForm.highest_ycb_level}` : '—'} · Experience: {profForm.years_experience || '—'} years.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-ghost" onClick={() => { if (step === 1) setRegType(null); else setStep(s => s - 1); }}>
                ← {step === 1 ? 'Change Type' : 'Previous'}
              </button>
              {step < 3 ? (
                <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>
                  Next →
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Submitting...' : '✅ Submit Registration'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DISTRICTS, HILLS_DISTRICTS } from '../types';

type ProjectType = 'greenfield' | 'expansion' | null;
type Step = 1 | 2 | 3 | 4;

const STEPS_GREENFIELD = ['Project Type', 'Project Details', 'Documents', 'Review & Submit'];
const STEPS_EXPANSION = ['Project Type', 'Centre Details', 'Documents', 'Review & Submit'];

export default function CapitalSubsidyApplicationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projectType, setProjectType] = useState<ProjectType>(null);
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [upn, setUpn] = useState('');

  // Form state
  const [form, setForm] = useState({
    // Common
    applicant_name: user?.full_name || '',
    applicant_mobile: '',
    applicant_email: '',
    district: user?.district || '',
    address: '',
    pincode: '',
    bank_account: '',
    bank_ifsc: '',
    bank_name: '',
    // Project
    project_name: '',
    proposed_investment: '',
    eca_amount: '',
    land_ownership: 'owned',
    proposed_capacity: '',
    proposed_area_sqft: '',
    cod_expected: '',
    // Expansion only
    existing_reg_number: '',
    existing_centre_name: '',
    expansion_description: '',
    // Documents (file names)
    doc_caf: null as File | null,
    doc_dpr: null as File | null,
    doc_ca_cert: null as File | null,
    doc_land: null as File | null,
    doc_license: null as File | null,
  });

  const isHills = HILLS_DISTRICTS.includes(form.district as typeof HILLS_DISTRICTS[number]);
  const subsidyPct = isHills ? 50 : 25;
  const maxSubsidy = isHills ? 2000000 : 1000000;
  const ecaNum = parseFloat(form.eca_amount) || 0;
  const calculatedSubsidy = Math.min((ecaNum * subsidyPct) / 100, maxSubsidy);

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('scheme_type', 'CAPITAL_SUBSIDY');
      formData.append('project_type', projectType!);
      formData.append('district', form.district);
      Object.entries(form).forEach(([k, v]) => {
        if (v instanceof File) formData.append(k, v);
        else if (v !== null) formData.append(k, String(v));
      });
      formData.append('calculated_subsidy', String(calculatedSubsidy));
      formData.append('area_category', isHills ? 'HILLS' : 'PLAINS');

      const token = localStorage.getItem('yoga_token');
      const res = await fetch('/api/applications/capital-subsidy', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setUpn(data.application_number || data.upn || 'UK-YOGA-CS-' + Date.now());
      setSubmitted(true);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) return (
    <div className="page-container" style={{ maxWidth: '640px' }}>
      <div style={{ textAlign: 'center', padding: '2rem', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '12px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ color: '#15803D', margin: '0 0 0.5rem' }}>Application Submitted!</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 1rem' }}>Your Unique Project Number (UPN):</p>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy)', background: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', display: 'inline-block', marginBottom: '1rem', fontFamily: 'monospace' }}>
          {upn}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
          This UPN has been assigned to your application. You will receive SMS/email notification on status updates.
        </p>
        <div style={{ background: '#FFF8E7', border: '1px solid #F5C77A', borderRadius: '8px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.85rem', color: '#92400E' }}>📋 What happens next?</p>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.8 }}>
            <li>Nodal Officer will review your application for completeness</li>
            <li>Application forwarded to concerned departments for comments</li>
            <li>SLRC meeting convened for In-Principle Approval</li>
            <li>You will be notified of approval/query/rejection</li>
            <li>After In-Principle Approval — proceed with project implementation</li>
            <li>On COD — apply for Instalment 1 (50% of subsidy)</li>
          </ol>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/applications')}>View My Applications</button>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: '760px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '0.5rem', fontSize: '0.85rem', padding: '0.25rem 0' }}>← Back</button>
        <h1 style={{ margin: 0, color: 'var(--navy)', fontSize: '1.4rem' }}>🏛️ Capital Subsidy Application</h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Yoga & Meditation Centre — Uttarakhand Yoga Policy 2025
        </p>
      </div>

      {/* Step indicator */}
      {projectType && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: 0 }}>
          {(projectType === 'greenfield' ? STEPS_GREENFIELD : STEPS_EXPANSION).map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, background: step > i + 1 ? '#15803D' : step === i + 1 ? 'var(--primary)' : 'var(--border)', color: step >= i + 1 ? 'white' : 'var(--text-muted)' }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--text)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: '2px', background: step > i + 1 ? '#15803D' : 'var(--border)', margin: '0 0.4rem' }} />}
            </div>
          ))}
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="card">
        {/* STEP 1 — Project Type */}
        {step === 1 && (
          <div>
            <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Select Project Type</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div onClick={() => setProjectType('greenfield')} style={{ cursor: 'pointer', padding: '1.5rem', borderRadius: '10px', border: `2px solid ${projectType === 'greenfield' ? 'var(--primary)' : 'var(--border)'}`, background: projectType === 'greenfield' ? 'var(--primary)08' : 'white', transition: 'all 0.15s' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏗️</div>
                <h4 style={{ margin: '0 0 0.4rem', color: 'var(--navy)' }}>Greenfield (New Centre)</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Centre not yet built. Apply for In-Principle Approval first, then claim subsidy after construction.</p>
              </div>
              <div onClick={() => setProjectType('expansion')} style={{ cursor: 'pointer', padding: '1.5rem', borderRadius: '10px', border: `2px solid ${projectType === 'expansion' ? 'var(--primary)' : 'var(--border)'}`, background: projectType === 'expansion' ? 'var(--primary)08' : 'white', transition: 'all 0.15s' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔧</div>
                <h4 style={{ margin: '0 0 0.4rem', color: 'var(--navy)' }}>Expansion (Existing Centre)</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Centre already operational. Apply for expansion/upgrade subsidy. ECA counted for expansion only.</p>
              </div>
            </div>
            {projectType && (
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', fontSize: '0.83rem' }}>
                <strong>📋 Process:</strong> Application → Nodal Officer Review → SLRC In-Principle Approval → Project Implementation → COD Claim → 3 Instalments (50% + 25% + 25%)
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — Project Details */}
        {step === 2 && (
          <div>
            <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>{projectType === 'greenfield' ? 'Proposed Project Details' : 'Existing Centre & Expansion Details'}</h3>
            {projectType === 'expansion' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Existing Centre Name *</label>
                    <input className="form-input" value={form.existing_centre_name} onChange={e => setForm(p => ({ ...p, existing_centre_name: e.target.value }))} placeholder="Registered name of your centre" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registration Number *</label>
                    <input className="form-input" value={form.existing_reg_number} onChange={e => setForm(p => ({ ...p, existing_reg_number: e.target.value }))} placeholder="AYUSH registration number" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Expansion Description *</label>
                  <textarea className="form-input" rows={2} value={form.expansion_description} onChange={e => setForm(p => ({ ...p, expansion_description: e.target.value }))} placeholder="Describe the proposed expansion (new studio, equipment, etc.)" />
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">Project / Centre Name *</label>
              <input className="form-input" value={form.project_name} onChange={e => setForm(p => ({ ...p, project_name: e.target.value }))} placeholder={projectType === 'greenfield' ? 'Proposed centre name' : 'Name of expansion project'} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">District *</label>
                <select className="form-input" value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))}>
                  <option value="">Select district</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Area Category</label>
                <input className="form-input" value={form.district ? (isHills ? 'Hills — 50% subsidy, max ₹20L' : 'Plains — 25% subsidy, max ₹10L') : 'Select district first'} readOnly style={{ background: 'var(--bg)', color: isHills ? '#15803D' : '#0369A1', fontWeight: 500 }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address / Location *</label>
              <textarea className="form-input" rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Village/Ward, Tehsil, District..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Total Proposed Investment (₹) *</label>
                <input className="form-input" type="number" value={form.proposed_investment} onChange={e => setForm(p => ({ ...p, proposed_investment: e.target.value }))} placeholder="Total project cost" />
              </div>
              <div className="form-group">
                <label className="form-label">Eligible Capital Assets — ECA (₹) *</label>
                <input className="form-input" type="number" value={form.eca_amount} onChange={e => setForm(p => ({ ...p, eca_amount: e.target.value }))} placeholder="As certified by CA" />
              </div>
            </div>
            {ecaNum > 0 && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: '#15803D', fontWeight: 600 }}>
                  💰 Calculated Subsidy: ₹{calculatedSubsidy.toLocaleString('en-IN')} ({subsidyPct}% of ECA, capped at ₹{(maxSubsidy / 100000).toFixed(0)}L)
                </span>
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Studio Area (sq ft) *</label>
                <input className="form-input" type="number" value={form.proposed_area_sqft} onChange={e => setForm(p => ({ ...p, proposed_area_sqft: e.target.value }))} placeholder="Min 20 sq ft per person" />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Capacity (persons)</label>
                <input className="form-input" type="number" value={form.proposed_capacity} onChange={e => setForm(p => ({ ...p, proposed_capacity: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Land Ownership *</label>
                <select className="form-input" value={form.land_ownership} onChange={e => setForm(p => ({ ...p, land_ownership: e.target.value }))}>
                  <option value="owned">Owned</option>
                  <option value="leased">Leased</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Expected COD (Commercial Operation Date)</label>
                <input className="form-input" type="date" value={form.cod_expected} onChange={e => setForm(p => ({ ...p, cod_expected: e.target.value }))} />
              </div>
            </div>
            <h4 style={{ margin: '1rem 0 0.75rem', color: 'var(--navy)' }}>Bank Details (for subsidy disbursement)</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Bank Account Number *</label>
                <input className="form-input" value={form.bank_account} onChange={e => setForm(p => ({ ...p, bank_account: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC Code *</label>
                <input className="form-input" value={form.bank_ifsc} onChange={e => setForm(p => ({ ...p, bank_ifsc: e.target.value }))} placeholder="e.g. SBIN0001234" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bank Name *</label>
              <input className="form-input" value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} />
            </div>
          </div>
        )}

        {/* STEP 3 — Documents */}
        {step === 3 && (
          <div>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--navy)' }}>Upload Required Documents</h3>
            <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>As per Operational Guidelines — Capital Subsidy In-Principle Approval</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <DocUpload label="1. Common Application Form (CAF) — duly filled" required hint="PDF, max 5MB" onChange={f => setForm(p => ({ ...p, doc_caf: f }))} file={form.doc_caf} />
              <DocUpload label="2. Draft DPR certified by Planner/Architect" required hint="Detailed Project Report — PDF" onChange={f => setForm(p => ({ ...p, doc_dpr: f }))} file={form.doc_dpr} />
              <DocUpload label="3. CA Certificate — project cost & ECA" required hint="Chartered Accountant certified — PDF" onChange={f => setForm(p => ({ ...p, doc_ca_cert: f }))} file={form.doc_ca_cert} />
              <DocUpload label="4. Land Documents / Possession / Leasehold Records" required hint="PDF or scanned copy" onChange={f => setForm(p => ({ ...p, doc_land: f }))} file={form.doc_land} />
              <DocUpload label="5. Licenses from competent authority (if applicable)" hint="Optional — attach if available" onChange={f => setForm(p => ({ ...p, doc_license: f }))} file={form.doc_license} />
            </div>
            <div style={{ background: '#FFF8E7', border: '1px solid #F5C77A', borderRadius: '8px', padding: '0.75rem 1rem', marginTop: '1rem', fontSize: '0.82rem', color: '#92400E' }}>
              ⚠️ All documents must be clear, legible scans. Incomplete documents may result in query from Nodal Officer.
            </div>
          </div>
        )}

        {/* STEP 4 — Review */}
        {step === 4 && (
          <div>
            <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Review & Submit</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <ReviewRow label="Project Type" value={projectType === 'greenfield' ? '🏗️ Greenfield (New Centre)' : '🔧 Expansion (Existing Centre)'} />
              <ReviewRow label="Project Name" value={form.project_name} />
              <ReviewRow label="District" value={form.district} />
              <ReviewRow label="Area Category" value={isHills ? 'Hills (50% subsidy)' : 'Plains (25% subsidy)'} />
              <ReviewRow label="Total Investment" value={form.proposed_investment ? `₹${Number(form.proposed_investment).toLocaleString('en-IN')}` : '—'} />
              <ReviewRow label="ECA Amount" value={form.eca_amount ? `₹${Number(form.eca_amount).toLocaleString('en-IN')}` : '—'} />
              <ReviewRow label="Calculated Subsidy" value={`₹${calculatedSubsidy.toLocaleString('en-IN')}`} highlight />
              <ReviewRow label="Bank Account" value={form.bank_account ? `****${form.bank_account.slice(-4)}` : '—'} />
              <ReviewRow label="Documents" value={[form.doc_caf, form.doc_dpr, form.doc_ca_cert, form.doc_land].filter(Boolean).length + '/4 required uploaded'} />
            </div>
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
              <strong>Declaration:</strong> I hereby declare that the information provided is true and correct to the best of my knowledge. I understand that in-principle approval is subject to SLRC scrutiny and does not guarantee final subsidy disbursement.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={() => { if (step === 1) navigate(-1); else setStep(s => (s - 1) as Step); }}>
            ← {step === 1 ? 'Cancel' : 'Previous'}
          </button>
          {step < 4 ? (
            <button className="btn btn-primary" onClick={() => { if (step === 1 && !projectType) { setError('Please select project type'); return; } setError(''); setStep(s => (s + 1) as Step); }}>
              Next →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ background: '#15803D' }}>
              {loading ? 'Submitting...' : '✅ Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DocUpload({ label, required, hint, onChange, file }: { label: string; required?: boolean; hint?: string; onChange: (f: File | null) => void; file: File | null }) {
  return (
    <div style={{ padding: '0.75rem 1rem', border: `1px solid ${file ? '#86EFAC' : 'var(--border)'}`, borderRadius: '8px', background: file ? '#F0FDF4' : 'var(--bg)' }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)', marginBottom: '0.4rem' }}>
        {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => onChange(e.target.files?.[0] || null)}
          style={{ fontSize: '0.8rem', flex: 1 }} />
        {file && <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 600 }}>✓ {file.name}</span>}
      </div>
      {hint && <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}

function ReviewRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: '160px', flexShrink: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: highlight ? 700 : 500, color: highlight ? '#15803D' : 'var(--text)' }}>{value || '—'}</span>
    </div>
  );
}

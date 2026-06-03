import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

type Step = 1 | 2 | 3 | 4;

function getWindowStatus() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  // Window 1: April-May (months 4-5)
  // Window 2: October-November (months 10-11)
  if (month === 4 || month === 5) {
    return { open: true, cycle: 'Cycle 1 (Apr–May)', closes: `May 31, ${year}`, scrutiny: `June ${year}` };
  }
  if (month === 10 || month === 11) {
    return { open: true, cycle: 'Cycle 2 (Oct–Nov)', closes: `November 30, ${year}`, scrutiny: `December ${year}` };
  }
  // Closed — find next opening
  let nextOpen = '', nextCycle = '';
  if (month < 4) { nextOpen = `April 1, ${year}`; nextCycle = 'Cycle 1'; }
  else if (month >= 6 && month < 10) { nextOpen = `October 1, ${year}`; nextCycle = 'Cycle 2'; }
  else { nextOpen = `April 1, ${year + 1}`; nextCycle = 'Cycle 1'; }
  return { open: false, nextOpen, nextCycle, cycle: '', closes: '', scrutiny: '' };
}

export default function ResearchGrantPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const windowStatus = getWindowStatus();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [upn, setUpn] = useState('');

  const [form, setForm] = useState({
    institution_name: '',
    institution_type: '',
    institution_established_yr: '',
    pi_name: '',
    pi_age: '',
    pi_qualification: '',
    pi_ycb_level: '',
    pi_affiliation: '',
    co_pi_name: '',
    co_pi_qualification: '',
    project_title: '',
    project_objectives: '',
    project_summary: '',
    expected_output: '',
    duration_months: '',
    budget_equipment: '',
    budget_manpower: '',
    budget_documentation: '',
    budget_travel: '',
    budget_contingency: '',
    bank_account: '',
    bank_ifsc: '',
    bank_name: '',
    non_duplication: false,
    doc_application: null as File | null,
    doc_milestone: null as File | null,
    doc_pi_profile: null as File | null,
  });

  const totalBudget = ['budget_equipment','budget_manpower','budget_documentation','budget_travel','budget_contingency']
    .reduce((s, k) => s + (parseFloat(form[k as keyof typeof form] as string) || 0), 0);

  const budgetPcts = {
    equipment: totalBudget ? ((parseFloat(form.budget_equipment)||0)/totalBudget*100).toFixed(0) : '0',
    manpower: totalBudget ? ((parseFloat(form.budget_manpower)||0)/totalBudget*100).toFixed(0) : '0',
    documentation: totalBudget ? ((parseFloat(form.budget_documentation)||0)/totalBudget*100).toFixed(0) : '0',
    travel: totalBudget ? ((parseFloat(form.budget_travel)||0)/totalBudget*100).toFixed(0) : '0',
    contingency: totalBudget ? ((parseFloat(form.budget_contingency)||0)/totalBudget*100).toFixed(0) : '0',
  };

  async function handleSubmit() {
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('yoga_token');
      const res = await fetch('/api/applications/research-grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, total_budget: totalBudget, scheme_type: 'RESEARCH_GRANT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setUpn(data.application_number || 'UK-YOGA-RG-' + Date.now());
      setSubmitted(true);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message);
    } finally { setLoading(false); }
  }

  // Window closed screen
  if (!windowStatus.open) return (
    <div className="page-container" style={{ maxWidth: '600px' }}>
      <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#FFF8E7', border: '1px solid #F5C77A', borderRadius: '12px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ color: '#92400E', margin: '0 0 0.75rem' }}>Application Window Closed</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
          The Research Grant application window is currently closed.<br />
          Applications are accepted twice a year:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: '0.25rem' }}>Cycle 1</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>April 1 – May 31</div>
            <div style={{ fontSize: '0.75rem', color: '#0369A1', marginTop: '0.25rem' }}>Scrutiny: June</div>
          </div>
          <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: '0.25rem' }}>Cycle 2</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>October 1 – November 30</div>
            <div style={{ fontSize: '0.75rem', color: '#0369A1', marginTop: '0.25rem' }}>Scrutiny: December</div>
          </div>
        </div>
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, color: '#15803D', fontWeight: 600, fontSize: '0.9rem' }}>
            🗓️ Next window opens: {windowStatus.nextOpen} ({windowStatus.nextCycle})
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="page-container" style={{ maxWidth: '600px' }}>
      <div style={{ textAlign: 'center', padding: '2rem', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '12px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ color: '#15803D', margin: '0 0 0.5rem' }}>Research Grant Application Submitted!</h2>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>Your Application Number:</p>
        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--navy)', background: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', display: 'inline-block', marginBottom: '1rem', fontFamily: 'monospace' }}>{upn}</div>
        <div style={{ background: '#FFF8E7', border: '1px solid #F5C77A', borderRadius: '8px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.85rem', color: '#92400E' }}>📋 What happens next? ({windowStatus.cycle})</p>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.8 }}>
            <li>Application forwarded to Uttarakhand Ayurveda University</li>
            <li>RPAC scrutiny in {windowStatus.scrutiny}</li>
            <li>Approved applications forwarded to Directorate of Yoga</li>
            <li>SLRC final approval</li>
            <li>Instalment 1 (40%) released on project approval</li>
            <li>Instalment 2 (30%) on 40% progress + Utilisation Certificate</li>
            <li>Instalment 3 (30%) on project completion</li>
          </ol>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/applications')}>View My Applications</button>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Dashboard</button>
        </div>
      </div>
    </div>
  );

  const STEPS = ['Institution & PI', 'Project Details', 'Budget & Documents', 'Review & Submit'];

  return (
    <div className="page-container" style={{ maxWidth: '760px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '0.5rem', fontSize: '0.85rem', padding: '0.25rem 0' }}>← Back</button>
        <h1 style={{ margin: 0, color: 'var(--navy)', fontSize: '1.4rem' }}>🔬 Research Grant Application</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Yoga Policy 2025 — R&D Grant (max ₹10L)</span>
          <span style={{ padding: '0.2rem 0.6rem', background: '#DCFCE7', color: '#15803D', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
            🟢 Window Open — {windowStatus.cycle} | Closes {windowStatus.closes}
          </span>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, background: step > i+1 ? '#15803D' : step === i+1 ? 'var(--primary)' : 'var(--border)', color: step >= i+1 ? 'white' : 'var(--text-muted)' }}>
                {step > i+1 ? '✓' : i+1}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: step===i+1 ? 600 : 400, color: step===i+1 ? 'var(--text)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < 3 && <div style={{ flex: 1, height: '2px', background: step > i+1 ? '#15803D' : 'var(--border)', margin: '0 0.4rem' }} />}
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="card">
        {step === 1 && (
          <div>
            <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Institution & Principal Investigator Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Institution Name *</label>
                <input className="form-input" value={form.institution_name} onChange={e => setForm(p => ({ ...p, institution_name: e.target.value }))} placeholder="University / Research Organisation" />
              </div>
              <div className="form-group">
                <label className="form-label">Institution Type *</label>
                <select className="form-input" value={form.institution_type} onChange={e => setForm(p => ({ ...p, institution_type: e.target.value }))}>
                  <option value="">Select type</option>
                  <option value="university">University/College (PG Yoga Courses)</option>
                  <option value="ayush_org">AYUSH Organisation (non-profit)</option>
                  <option value="research">Research Institution (3+ years)</option>
                  <option value="medical">Medical/Health Organisation (5+ years in Yoga)</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Year Established *</label>
              <input className="form-input" type="number" value={form.institution_established_yr} onChange={e => setForm(p => ({ ...p, institution_established_yr: e.target.value }))} placeholder="e.g. 2005" />
            </div>
            <h4 style={{ margin: '1rem 0 0.75rem', color: 'var(--navy)', fontSize: '0.95rem' }}>Principal Investigator (PI)</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">PI Full Name *</label>
                <input className="form-input" value={form.pi_name} onChange={e => setForm(p => ({ ...p, pi_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Age (as on April 1) * <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>max 50</span></label>
                <input className="form-input" type="number" value={form.pi_age} onChange={e => setForm(p => ({ ...p, pi_age: e.target.value }))} max={50} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Qualification *</label>
              <input className="form-input" value={form.pi_qualification} onChange={e => setForm(p => ({ ...p, pi_qualification: e.target.value }))} placeholder="Bachelor's/Master's from YCB/AYUSH certified institution" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">YCB Level (min Level 3) *</label>
                <select className="form-input" value={form.pi_ycb_level} onChange={e => setForm(p => ({ ...p, pi_ycb_level: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="LEVEL_3">Level 3 — Teacher & Evaluator</option>
                  <option value="LEVEL_4">Level 4 — Asst. Yoga Therapist</option>
                  <option value="LEVEL_5">Level 5 — Therapeutic Yoga Consultant</option>
                  <option value="LEVEL_6">Level 6 — Yoga Master</option>
                  <option value="LEVEL_7">Level 7 — Yoga Therapist</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Affiliation / Department</label>
                <input className="form-input" value={form.pi_affiliation} onChange={e => setForm(p => ({ ...p, pi_affiliation: e.target.value }))} />
              </div>
            </div>
            <h4 style={{ margin: '1rem 0 0.75rem', color: 'var(--navy)', fontSize: '0.95rem' }}>Co-Investigator (Co-PI) — Optional</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Co-PI Name</label>
                <input className="form-input" value={form.co_pi_name} onChange={e => setForm(p => ({ ...p, co_pi_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Co-PI Qualification</label>
                <input className="form-input" value={form.co_pi_qualification} onChange={e => setForm(p => ({ ...p, co_pi_qualification: e.target.value }))} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Project Details</h3>
            <div className="form-group">
              <label className="form-label">Project Title *</label>
              <input className="form-input" value={form.project_title} onChange={e => setForm(p => ({ ...p, project_title: e.target.value }))} placeholder="Clear, specific title of the research project" />
            </div>
            <div className="form-group">
              <label className="form-label">Project Objectives * <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>max 500 words</span></label>
              <textarea className="form-input" rows={5} value={form.project_objectives} onChange={e => setForm(p => ({ ...p, project_objectives: e.target.value }))} placeholder="State clear, measurable objectives..." />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: form.project_objectives.split(/\s+/).filter(Boolean).length > 500 ? '#DC2626' : 'var(--text-muted)' }}>
                {form.project_objectives.split(/\s+/).filter(Boolean).length}/500 words
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Project Summary * <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>max 1500 words</span></label>
              <textarea className="form-input" rows={8} value={form.project_summary} onChange={e => setForm(p => ({ ...p, project_summary: e.target.value }))} placeholder="Comprehensive summary including methodology, approach, and significance..." />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: form.project_summary.split(/\s+/).filter(Boolean).length > 1500 ? '#DC2626' : 'var(--text-muted)' }}>
                {form.project_summary.split(/\s+/).filter(Boolean).length}/1500 words
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Expected Output & Outcome *</label>
              <textarea className="form-input" rows={3} value={form.expected_output} onChange={e => setForm(p => ({ ...p, expected_output: e.target.value }))} placeholder="Publications, reports, recommendations expected..." />
            </div>
            <div className="form-group">
              <label className="form-label">Project Duration (months) * <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>3–24 months</span></label>
              <input className="form-input" type="number" value={form.duration_months} onChange={e => setForm(p => ({ ...p, duration_months: e.target.value }))} min={3} max={24} />
            </div>
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#0369A1' }}>
              📋 You will need to upload a detailed <strong>Objective Milestone Chart</strong> in the next step — outlining phase-wise outcomes. This forms the basis for tracking progress and grant release.
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--navy)' }}>Budget Allocation & Documents</h3>
            <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Max grant: ₹10,00,000. Allocate as per policy budget heads.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                { key: 'budget_equipment', label: 'Equipment & Research Materials', policyPct: 40 },
                { key: 'budget_manpower', label: 'Manpower', policyPct: 20 },
                { key: 'budget_documentation', label: 'Documentation, Dissemination & Publication', policyPct: 15 },
                { key: 'budget_travel', label: 'Travel & Fieldwork', policyPct: 20 },
                { key: 'budget_contingency', label: 'Contingency', policyPct: 5 },
              ].map(({ key, label, policyPct }) => {
                const val = parseFloat(form[key as keyof typeof form] as string) || 0;
                const actualPct = totalBudget ? ((val / totalBudget) * 100).toFixed(0) : '0';
                const overLimit = totalBudget > 0 && parseFloat(actualPct) > policyPct + 2;
                return (
                  <div key={key} style={{ padding: '0.75rem', border: `1px solid ${overLimit ? '#FCA5A5' : 'var(--border)'}`, borderRadius: '8px', background: overLimit ? '#FEF2F2' : 'var(--bg)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.4rem', color: 'var(--text)' }}>
                      {label} <span style={{ color: 'var(--text-muted)' }}>(policy: {policyPct}%)</span>
                    </div>
                    <input className="form-input" type="number" value={form[key as keyof typeof form] as string}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder="₹" style={{ marginBottom: '0.25rem' }} />
                    <div style={{ fontSize: '0.72rem', color: overLimit ? '#DC2626' : 'var(--text-muted)' }}>
                      {actualPct}% of total {overLimit ? '⚠️ exceeds policy limit' : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalBudget > 0 && (
              <div style={{ padding: '0.75rem 1rem', background: totalBudget > 1000000 ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${totalBudget > 1000000 ? '#FCA5A5' : '#86EFAC'}`, borderRadius: '8px', marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem', color: totalBudget > 1000000 ? '#DC2626' : '#15803D' }}>
                Total Grant Requested: ₹{totalBudget.toLocaleString('en-IN')} {totalBudget > 1000000 ? '⚠️ Exceeds maximum ₹10L limit' : '✓ Within limit'}
              </div>
            )}

            <h4 style={{ margin: '1rem 0 0.75rem', color: 'var(--navy)', fontSize: '0.95rem' }}>Bank Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Account Number *</label>
                <input className="form-input" value={form.bank_account} onChange={e => setForm(p => ({ ...p, bank_account: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC Code *</label>
                <input className="form-input" value={form.bank_ifsc} onChange={e => setForm(p => ({ ...p, bank_ifsc: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bank Name *</label>
              <input className="form-input" value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} />
            </div>

            <h4 style={{ margin: '1rem 0 0.75rem', color: 'var(--navy)', fontSize: '0.95rem' }}>Documents</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <DocUpload label="1. Application Form (duly filled)" required onChange={f => setForm(p => ({ ...p, doc_application: f }))} file={form.doc_application} />
              <DocUpload label="2. Objective Milestone Chart (phase-wise outcomes)" required hint="Excel or PDF — basis for progress tracking and grant release" onChange={f => setForm(p => ({ ...p, doc_milestone: f }))} file={form.doc_milestone} />
              <DocUpload label="3. PI & Co-PI Profile (educational, affiliation details)" required onChange={f => setForm(p => ({ ...p, doc_pi_profile: f }))} file={form.doc_pi_profile} />
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.82rem' }}>
                <input type="checkbox" checked={form.non_duplication} onChange={e => setForm(p => ({ ...p, non_duplication: e.target.checked }))} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>I declare that the proposed project has <strong>not received and will not receive</strong> funding for the same research from any Indian or foreign entity (Non-Duplication Declaration as per Policy).</span>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Review & Submit</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[
                ['Institution', form.institution_name],
                ['Institution Type', form.institution_type],
                ['Principal Investigator', form.pi_name],
                ['PI Age', form.pi_age],
                ['YCB Level', form.pi_ycb_level?.replace('_', ' ')],
                ['Project Title', form.project_title],
                ['Duration', form.duration_months ? `${form.duration_months} months` : '—'],
                ['Total Grant', `₹${totalBudget.toLocaleString('en-IN')}`],
                ['Application Cycle', windowStatus.cycle],
                ['RPAC Scrutiny', windowStatus.scrutiny],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: '1rem', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ width: '160px', flexShrink: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text)' }}>{value || '—'}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', padding: '1rem', fontSize: '0.82rem' }}>
              <strong>Declaration:</strong> I declare all information is true and correct. Proposals may be subjected to plagiarism check by RPAC. Non-compliance may lead to grant recovery with RBI Repo Rate + 4% interest.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={() => { if (step === 1) navigate(-1); else setStep(s => (s-1) as Step); }}>
            ← {step === 1 ? 'Cancel' : 'Previous'}
          </button>
          {step < 4 ? (
            <button className="btn btn-primary" onClick={() => { setError(''); setStep(s => (s+1) as Step); }}>Next →</button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !form.non_duplication || totalBudget > 1000000} style={{ background: '#15803D' }}>
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
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.4rem' }}>
        {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls" onChange={e => onChange(e.target.files?.[0] || null)} style={{ fontSize: '0.8rem' }} />
      {file && <div style={{ fontSize: '0.75rem', color: '#15803D', marginTop: '0.25rem' }}>✓ {file.name}</div>}
      {hint && <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  );
}

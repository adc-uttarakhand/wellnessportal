import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appApi } from '../utils/api';
import { SCHEME_LABELS, SchemeType } from '../types';

interface StatusStep {
  key: string;
  label: string;
  description: string;
  icon: string;
  role: string;
}

const CAPITAL_SUBSIDY_STEPS: StatusStep[] = [
  { key: 'SUBMITTED', label: 'Application Submitted', description: 'Application received. UPN assigned.', icon: '📋', role: 'Applicant' },
  { key: 'UNDER_REVIEW', label: 'Nodal Officer Review', description: 'Nodal Officer scrutinising documents for completeness.', icon: '🔍', role: 'Nodal Officer' },
  { key: 'QUERY_RAISED', label: 'Query / Additional Docs', description: 'Additional information or documents requested.', icon: '❓', role: 'Nodal Officer' },
  { key: 'SLRC_PENDING', label: 'SLRC Meeting Scheduled', description: 'Forwarded to State-Level Review Committee for In-Principle Approval.', icon: '🏛️', role: 'SLRC' },
  { key: 'APPROVED', label: 'In-Principle Approved', description: 'SLRC has granted In-Principle Approval. Proceed with project implementation.', icon: '✅', role: 'SLRC' },
  { key: 'COD_CLAIM', label: 'COD Claim Submitted', description: 'Commencement of Operation claim submitted for Instalment 1.', icon: '🏗️', role: 'Applicant' },
  { key: 'VERIFICATION', label: 'Physical Verification', description: 'Working Committee conducting site verification.', icon: '🔎', role: 'Working Committee' },
  { key: 'DISBURSED', label: 'Subsidy Disbursed', description: 'Instalment released to bank account.', icon: '💰', role: 'Directorate' },
];

const RESEARCH_GRANT_STEPS: StatusStep[] = [
  { key: 'SUBMITTED', label: 'Application Submitted', description: 'Application received. Forwarded to UAU for RPAC consideration.', icon: '📋', role: 'Applicant' },
  { key: 'UNDER_REVIEW', label: 'RPAC Scrutiny', description: 'Research Project Approval Committee reviewing proposal.', icon: '🔬', role: 'RPAC' },
  { key: 'QUERY_RAISED', label: 'Clarification Requested', description: 'RPAC has requested additional information or clarification.', icon: '❓', role: 'RPAC' },
  { key: 'RPAC_APPROVED', label: 'RPAC Approved', description: 'RPAC approved. Forwarded to Directorate of Yoga.', icon: '✅', role: 'RPAC' },
  { key: 'APPROVED', label: 'SLRC Final Approval', description: 'SLRC has given final approval. Grant released.', icon: '🏛️', role: 'SLRC' },
  { key: 'INSTALMENT_1', label: 'Instalment 1 Released', description: '40% grant released. Research activities initiated.', icon: '💰', role: 'Directorate' },
  { key: 'PROGRESS_40', label: '40% Progress Submitted', description: 'Progress report and UC submitted for Instalment 2.', icon: '📊', role: 'Applicant' },
  { key: 'DISBURSED', label: 'Project Completed', description: 'All instalments released. Project complete.', icon: '🎓', role: 'Directorate' },
];

export default function ApplicationStatusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (id) fetchApp(); }, [id]);

  async function fetchApp() {
    try {
      const res = await appApi.get(Number(id));
      setApp(res.data);
    } catch { setError('Application not found'); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="page-container" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>;
  if (error || !app) return <div className="page-container"><div className="alert alert-error">{error || 'Not found'}</div></div>;

  const schemeType = app.scheme_type as SchemeType;
  const status = app.status as string;
  const steps = schemeType === 'CAPITAL_SUBSIDY' ? CAPITAL_SUBSIDY_STEPS : schemeType === 'RESEARCH_GRANT' ? RESEARCH_GRANT_STEPS : [];

  const statusOrder = steps.map(s => s.key);
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="page-container" style={{ maxWidth: '760px' }}>
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '1rem', fontSize: '0.85rem', padding: '0.25rem 0' }}>← Back</button>

      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Application Number</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'monospace' }}>{String(app.application_number)}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{SCHEME_LABELS[schemeType]}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Current Status</div>
            <span style={{ padding: '0.35rem 0.85rem', borderRadius: '20px', background: status === 'APPROVED' || status === 'DISBURSED' ? '#DCFCE7' : status === 'REJECTED' ? '#FEE2E2' : status === 'QUERY_RAISED' ? '#FEF3C7' : '#EFF6FF', color: status === 'APPROVED' || status === 'DISBURSED' ? '#15803D' : status === 'REJECTED' ? '#DC2626' : status === 'QUERY_RAISED' ? '#B45309' : '#1D4ED8', fontWeight: 600, fontSize: '0.85rem' }}>
              {status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      {steps.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 className="card-title">📍 Application Journey — Where is your file?</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((step, i) => {
              const done = currentIdx > i;
              const current = currentIdx === i;
              const pending = currentIdx < i;
              return (
                <div key={step.key} style={{ display: 'flex', gap: '1rem', paddingBottom: i < steps.length - 1 ? '1.5rem' : 0 }}>
                  {/* Timeline line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', flexShrink: 0 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: done ? '0.8rem' : '1rem', fontWeight: 700, flexShrink: 0,
                      background: done ? '#15803D' : current ? 'var(--primary)' : 'var(--border)',
                      color: done || current ? 'white' : 'var(--text-muted)',
                      border: current ? '3px solid var(--primary)30' : 'none',
                      boxShadow: current ? '0 0 0 4px var(--primary)15' : 'none',
                    }}>
                      {done ? '✓' : step.icon}
                    </div>
                    {i < steps.length - 1 && <div style={{ width: '2px', flex: 1, minHeight: '20px', background: done ? '#15803D' : 'var(--border)', marginTop: '4px' }} />}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, paddingTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: current ? 700 : done ? 600 : 400, fontSize: '0.9rem', color: pending ? 'var(--text-muted)' : 'var(--text)' }}>
                        {step.label}
                      </span>
                      {current && <span style={{ padding: '0.1rem 0.5rem', background: 'var(--primary)15', color: 'var(--primary)', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>CURRENT</span>}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>👤 {step.role}</span>
                    </div>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: pending ? 'var(--text-muted)' : done ? '#15803D' : 'var(--text)' }}>
                      {step.description}
                    </p>
                    {current && status === 'QUERY_RAISED' && app.query_text && (
                      <div style={{ marginTop: '0.5rem', padding: '0.6rem 0.75rem', background: '#FFF8E7', border: '1px solid #F5C77A', borderRadius: '6px', fontSize: '0.8rem', color: '#92400E' }}>
                        <strong>Query:</strong> {String(app.query_text)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disbursement tracker for Capital Subsidy */}
      {schemeType === 'CAPITAL_SUBSIDY' && status === 'APPROVED' && (
        <div className="card">
          <h3 className="card-title">💰 Subsidy Disbursement Schedule</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { inst: 1, label: 'Instalment 1 — On COD', pct: 50, desc: 'After commencement of commercial operations. Apply with CAPEX certificate + bills.' },
              { inst: 2, label: 'Instalment 2 — After 1 Year Operations', pct: 25, desc: 'After 100+ participants served. Submit proof of sessions + UC.' },
              { inst: 3, label: 'Instalment 3 — After 2 Year Operations', pct: 25, desc: 'After second year. Submit proof of sessions + UC.' },
            ].map(({ inst, label, pct, desc }) => (
              <div key={inst} style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>{pct}%</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
            onClick={() => navigate(`/applications/${id}/cod-claim`)}>
            📋 Submit COD Claim for Instalment 1
          </button>
        </div>
      )}

      {/* Research Grant disbursement */}
      {schemeType === 'RESEARCH_GRANT' && status === 'APPROVED' && (
        <div className="card">
          <h3 className="card-title">💰 Grant Disbursement Schedule</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { inst: 1, label: 'Instalment 1 — On Approval', pct: 40, desc: 'Released after SLRC approval. Research activities to begin.' },
              { inst: 2, label: 'Instalment 2 — At 40% Progress', pct: 30, desc: 'Submit progress report against milestone chart + Utilisation Certificate (UC).' },
              { inst: 3, label: 'Instalment 3 — On Completion', pct: 30, desc: 'Submit final report, RPAC confirmation, and UC for 2nd instalment.' },
            ].map(({ inst, label, pct, desc }) => (
              <div key={inst} style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: '#7C3AED', fontSize: '0.9rem' }}>{pct}%</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

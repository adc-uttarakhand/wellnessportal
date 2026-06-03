import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { appApi } from '../utils/api';
import { Application, ApplicationStatus, SchemeType, STATUS_COLORS, SCHEME_LABELS } from '../types';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'query' | 'waitlist' | ''>('');
  const [actionRemark, setActionRemark] = useState('');

  const [queryResponse, setQueryResponse] = useState('');
  const [queryResponseLoading, setQueryResponseLoading] = useState(false);

  const isAdmin = user?.role === 'STATE_ADMIN' || user?.role === 'DISTRICT_ADMIN';

  useEffect(() => { if (id) fetchApp(); }, [id]);

  async function fetchApp() {
    try {
      setLoading(true);
      const res = await appApi.get(Number(id));
      setApp(res.data);
    } catch {
      setError('Application not found or access denied.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction() {
    if (!actionType || !app) return;
    setActionLoading(true);
    try {
      const statusMap: Record<string, ApplicationStatus> = {
        approve: 'APPROVED', reject: 'REJECTED', query: 'QUERY_RAISED', waitlist: 'WAITLISTED',
      };
      await appApi.updateStatus(app.id, {
        status: statusMap[actionType],
        query_text: actionRemark,
        rejection_reason: actionRemark,
      });
      setShowActionModal(false);
      setActionRemark('');
      fetchApp();
    } catch {
      setError('Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleQueryResponse() {
    if (!queryResponse.trim() || !app) return;
    setQueryResponseLoading(true);
    try {
      await appApi.respondToQuery(app.id, queryResponse);
      setQueryResponse('');
      fetchApp();
    } catch {
      setError('Failed to submit response.');
    } finally {
      setQueryResponseLoading(false);
    }
  }

  if (loading) return (
    <div className="page-container">
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading application...</div>
    </div>
  );

  if (error || !app) return (
    <div className="page-container">
      <div className="alert alert-error">{error || 'Application not found.'}</div>
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>← Back</button>
    </div>
  );

  const schemeData = (app.detail || {}) as Record<string, string>;
  const statusColor = STATUS_COLORS[app.status] || '#666';

  const statusList: ApplicationStatus[] = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '0.5rem', padding: '0.25rem 0', fontSize: '0.85rem' }}>
            ← Back to Applications
          </button>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--navy)' }}>{app.application_number}</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {SCHEME_LABELS[app.scheme_type]} &nbsp;•&nbsp; Applied: {new Date(app.created_at).toLocaleDateString('en-IN')}
          </p>
        </div>
        <span style={{ background: statusColor + '20', color: statusColor, border: `1px solid ${statusColor}40`, padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '20px' }}>
          {app.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 className="card-title">Applicant Information</h3>
            <div className="detail-grid">
              <DetailRow label="Name" value={app.applicant_name} />
              <DetailRow label="District" value={app.district} />
              <DetailRow label="Financial Year" value={app.financial_year} />
            </div>
          </div>

          {Object.keys(schemeData).length > 0 && (
            <div className="card">
              <h3 className="card-title">Application Details</h3>
              <div className="detail-grid">
                {Object.entries(schemeData).map(([k, v]) => (
                  <DetailRow key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
                ))}
              </div>
            </div>
          )}

          {/* Query / Remarks thread */}
          {(app.query_text || app.query_response || app.status === 'QUERY_RAISED') && (
            <div className="card">
              <h3 className="card-title">Communication Thread</h3>
              {app.query_text && (
                <div style={{ background: '#FFF8E7', border: '1px solid #F5C77A', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#B45309', marginBottom: '0.5rem' }}>🔔 ADMIN REMARK</div>
                  <p style={{ margin: 0 }}>{app.query_text}</p>
                </div>
              )}
              {app.rejection_reason && app.status === 'REJECTED' && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#DC2626', marginBottom: '0.5rem' }}>✕ REJECTION REASON</div>
                  <p style={{ margin: 0 }}>{app.rejection_reason}</p>
                </div>
              )}
              {app.query_response && (
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803D', marginBottom: '0.5rem' }}>💬 APPLICANT RESPONSE</div>
                  <p style={{ margin: 0 }}>{app.query_response}</p>
                </div>
              )}
              {!isAdmin && app.status === 'QUERY_RAISED' && !app.query_response && (
                <div style={{ marginTop: '1rem' }}>
                  <label className="form-label">Your Response to Query</label>
                  <textarea className="form-input" rows={4} value={queryResponse}
                    onChange={e => setQueryResponse(e.target.value)}
                    placeholder="Provide your clarification..." />
                  <button className="btn btn-primary" onClick={handleQueryResponse}
                    disabled={queryResponseLoading || !queryResponse.trim()} style={{ marginTop: '0.75rem' }}>
                    {queryResponseLoading ? 'Submitting...' : 'Submit Response'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Timeline */}
          <div className="card">
            <h3 className="card-title">Status Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {statusList.map((s, i) => {
                const allStatuses: ApplicationStatus[] = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'QUERY_RAISED', 'WAITLISTED', 'APPROVED', 'REJECTED', 'DISBURSED'];
                const currentIdx = allStatuses.indexOf(app.status);
                const stepIdx = allStatuses.indexOf(s);
                const done = currentIdx >= stepIdx;
                const labels: Record<ApplicationStatus, string> = {
                  DRAFT: 'Draft Created', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review',
                  APPROVED: 'Approved', REJECTED: 'Rejected', QUERY_RAISED: 'Query Raised',
                  WAITLISTED: 'Waitlisted', DISBURSED: 'Disbursed',
                };
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', paddingBottom: i < 3 ? '1rem' : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, background: done ? 'var(--primary)' : 'var(--border)', color: done ? 'white' : 'var(--text-muted)' }}>
                        {done ? '✓' : i + 1}
                      </div>
                      {i < 3 && <div style={{ width: '2px', flex: 1, minHeight: '16px', background: done ? 'var(--primary)' : 'var(--border)', marginTop: '2px' }} />}
                    </div>
                    <div style={{ paddingTop: '2px', fontSize: '0.85rem', fontWeight: done ? 600 : 400, color: done ? 'var(--text)' : 'var(--text-muted)' }}>
                      {labels[s]}
                    </div>
                  </div>
                );
              })}
            </div>
            {app.status === 'QUERY_RAISED' && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#FFF8E7', borderRadius: '6px', fontSize: '0.8rem', color: '#92400E' }}>
                ⚠️ Query raised — response pending
              </div>
            )}
          </div>

          {/* Admin Actions */}
          {isAdmin && (['SUBMITTED', 'UNDER_REVIEW', 'QUERY_RAISED'] as ApplicationStatus[]).includes(app.status) && (
            <div className="card">
              <h3 className="card-title">Admin Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', borderColor: '#F59E0B', color: '#B45309' }}
                  onClick={() => { setActionType('query'); setShowActionModal(true); }}>❓ Raise Query</button>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => { setActionType('waitlist'); setShowActionModal(true); }}>⏳ Waitlist</button>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#15803D' }}
                  onClick={() => { setActionType('approve'); setShowActionModal(true); }}>✅ Approve</button>
                <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => { setActionType('reject'); setShowActionModal(true); }}>✕ Reject</button>
              </div>
            </div>
          )}

          {/* Quick Info */}
          <div className="card">
            <h3 className="card-title">Quick Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <QuickInfoRow icon="📋" label="Scheme" value={SCHEME_LABELS[app.scheme_type]} />
              <QuickInfoRow icon="📍" label="District" value={app.district} />
              <QuickInfoRow icon="🗓️" label="Applied On" value={new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
              <QuickInfoRow icon="📅" label="Financial Year" value={app.financial_year} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '480px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 1rem', color: 'var(--navy)' }}>
              {actionType === 'approve' ? '✅ Approve' : actionType === 'reject' ? '✕ Reject' : actionType === 'query' ? '❓ Raise Query' : '⏳ Waitlist'} Application
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
              Application: <strong>{app.application_number}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">{actionType === 'approve' ? 'Remarks (optional)' : 'Reason *'}</label>
              <textarea className="form-input" rows={4} value={actionRemark}
                onChange={e => setActionRemark(e.target.value)}
                placeholder={actionType === 'approve' ? 'Any notes...' : 'Provide clear reason...'} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => { setShowActionModal(false); setActionRemark(''); }}>Cancel</button>
              <button className={`btn ${actionType === 'approve' ? 'btn-primary' : actionType === 'reject' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={handleAction} disabled={actionLoading || (actionType !== 'approve' && !actionRemark.trim())}
                style={actionType === 'approve' ? { background: '#15803D' } : {}}>
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: '160px', flexShrink: 0, color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'capitalize' }}>{label}</span>
      <span style={{ color: 'var(--text)', fontSize: '0.9rem', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}

function QuickInfoRow({ icon, label, value }: { icon: string; label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem' }}>
      <span>{icon}</span>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{label}</div>
        <div style={{ color: 'var(--text)', fontWeight: 500 }}>{value || '—'}</div>
      </div>
    </div>
  );
}

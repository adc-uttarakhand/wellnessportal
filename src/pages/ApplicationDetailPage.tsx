import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { appApi } from '../utils/api';
import { Application, STATUS_COLORS, SCHEME_LABELS } from '../types';

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Admin action state
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'query' | 'waitlist' | ''>('');
  const [actionRemark, setActionRemark] = useState('');

  // Applicant query response state
  const [queryResponse, setQueryResponse] = useState('');
  const [queryResponseLoading, setQueryResponseLoading] = useState(false);

  const isAdmin = user?.role === 'STATE_ADMIN' || user?.role === 'DISTRICT_ADMIN';

  useEffect(() => {
    fetchApp();
  }, [id]);

  async function fetchApp() {
    try {
      setLoading(true);
      const res = await appApi.get(`/${id}`);
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
      await appApi.patch(`/${app.id}/status`, {
        status: actionType === 'approve' ? 'approved'
          : actionType === 'reject' ? 'rejected'
          : actionType === 'query' ? 'query_raised'
          : 'waitlisted',
        admin_remark: actionRemark,
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
      await appApi.patch(`/${app.id}/query-response`, { response: queryResponse });
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
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Loading application...
      </div>
    </div>
  );

  if (error || !app) return (
    <div className="page-container">
      <div className="alert alert-error">{error || 'Application not found.'}</div>
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
        ← Back
      </button>
    </div>
  );

  const schemeData = app.scheme_data || {};
  const statusColor = STATUS_COLORS[app.status] || '#666';

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '0.5rem', padding: '0.25rem 0', fontSize: '0.85rem' }}>
            ← Back to Applications
          </button>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--navy)' }}>{app.upn}</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {SCHEME_LABELS[app.scheme_type]} &nbsp;•&nbsp; Applied: {new Date(app.created_at).toLocaleDateString('en-IN')}
          </p>
        </div>
        <span className="badge" style={{ background: statusColor + '20', color: statusColor, border: `1px solid ${statusColor}40`, padding: '0.4rem 1rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '20px' }}>
          {app.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Applicant Info */}
          <div className="card">
            <h3 className="card-title">Applicant Information</h3>
            <div className="detail-grid">
              <DetailRow label="Name" value={app.applicant_name || app.applicant?.name} />
              <DetailRow label="Email" value={app.applicant_email || app.applicant?.email} />
              <DetailRow label="District" value={app.district} />
              <DetailRow label="Role" value={app.applicant?.role?.replace(/_/g, ' ')} />
            </div>
          </div>

          {/* Scheme-specific Details */}
          <div className="card">
            <h3 className="card-title">Application Details</h3>
            {app.scheme_type === 'capital_subsidy' && <CapitalSubsidyDetails data={schemeData} />}
            {app.scheme_type === 'research_grant' && <ResearchGrantDetails data={schemeData} />}
            {app.scheme_type === 'teacher_certification' && <TeacherCertDetails data={schemeData} />}
            {app.scheme_type === 'existing_institution' && <ExistingInstDetails data={schemeData} />}
          </div>

          {/* Documents */}
          {app.documents && app.documents.length > 0 && (
            <div className="card">
              <h3 className="card-title">Uploaded Documents</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {app.documents.map((doc: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1.25rem' }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{doc.document_type?.replace(/_/g, ' ')}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.file_name}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {doc.verified ? '✅ Verified' : '⏳ Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Remarks & Query Thread */}
          {(app.admin_remark || app.query_response || app.status === 'query_raised') && (
            <div className="card">
              <h3 className="card-title">Communication Thread</h3>
              {app.admin_remark && (
                <div style={{ background: '#FFF8E7', border: '1px solid #F5C77A', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#B45309', marginBottom: '0.5rem' }}>
                    🔔 ADMIN REMARK
                  </div>
                  <p style={{ margin: 0, color: 'var(--text)' }}>{app.admin_remark}</p>
                </div>
              )}
              {app.query_response && (
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803D', marginBottom: '0.5rem' }}>
                    💬 APPLICANT RESPONSE
                  </div>
                  <p style={{ margin: 0, color: 'var(--text)' }}>{app.query_response}</p>
                </div>
              )}
              {/* Applicant can respond if query is raised */}
              {!isAdmin && app.status === 'query_raised' && !app.query_response && (
                <div style={{ marginTop: '1rem' }}>
                  <label className="form-label">Your Response to Query</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={queryResponse}
                    onChange={e => setQueryResponse(e.target.value)}
                    placeholder="Provide your clarification or additional information..."
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleQueryResponse}
                    disabled={queryResponseLoading || !queryResponse.trim()}
                    style={{ marginTop: '0.75rem' }}
                  >
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                { s: 'draft', label: 'Draft Created' },
                { s: 'submitted', label: 'Submitted' },
                { s: 'under_review', label: 'Under Review' },
                { s: 'approved', label: 'Approved' },
              ].map((step, i) => {
                const statuses = ['draft', 'submitted', 'under_review', 'query_raised', 'waitlisted', 'approved', 'rejected', 'disbursed'];
                const currentIdx = statuses.indexOf(app.status);
                const stepIdx = statuses.indexOf(step.s);
                const done = currentIdx >= stepIdx;
                const isRejected = app.status === 'rejected' && step.s === 'approved';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', paddingBottom: i < 3 ? '1rem' : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                        background: isRejected ? '#FEE2E2' : done ? 'var(--primary)' : 'var(--border)',
                        color: isRejected ? '#DC2626' : done ? 'white' : 'var(--text-muted)',
                      }}>
                        {isRejected ? '✕' : done ? '✓' : i + 1}
                      </div>
                      {i < 3 && <div style={{ width: '2px', flex: 1, minHeight: '16px', background: done ? 'var(--primary)' : 'var(--border)', marginTop: '2px' }} />}
                    </div>
                    <div style={{ paddingTop: '2px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: done ? 600 : 400, color: done ? 'var(--text)' : 'var(--text-muted)' }}>
                        {isRejected ? 'Rejected' : step.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {app.status === 'query_raised' && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#FFF8E7', borderRadius: '6px', fontSize: '0.8rem', color: '#92400E' }}>
                ⚠️ Query raised — applicant response pending
              </div>
            )}
            {app.status === 'waitlisted' && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#F0F9FF', borderRadius: '6px', fontSize: '0.8rem', color: '#0369A1' }}>
                ⏳ Waitlisted — pending budget availability
              </div>
            )}
            {app.status === 'disbursed' && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#F0FDF4', borderRadius: '6px', fontSize: '0.8rem', color: '#15803D' }}>
                ✅ Amount disbursed successfully
              </div>
            )}
          </div>

          {/* Admin Actions */}
          {isAdmin && ['submitted', 'under_review', 'query_raised'].includes(app.status) && (
            <div className="card">
              <h3 className="card-title">Admin Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {app.status === 'submitted' && (
                  <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { setActionType('query'); setShowActionModal(true); }}>
                    🔍 Mark Under Review
                  </button>
                )}
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', borderColor: '#F59E0B', color: '#B45309' }}
                  onClick={() => { setActionType('query'); setShowActionModal(true); }}>
                  ❓ Raise Query
                </button>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', borderColor: '#6B7280', color: '#374151' }}
                  onClick={() => { setActionType('waitlist'); setShowActionModal(true); }}>
                  ⏳ Waitlist
                </button>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#15803D' }}
                  onClick={() => { setActionType('approve'); setShowActionModal(true); }}>
                  ✅ Approve
                </button>
                <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => { setActionType('reject'); setShowActionModal(true); }}>
                  ✕ Reject
                </button>
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
              {app.updated_at !== app.created_at && (
                <QuickInfoRow icon="🔄" label="Last Updated" value={new Date(app.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
              )}
              {app.requested_amount && (
                <QuickInfoRow icon="💰" label="Requested" value={`₹${Number(app.requested_amount / 100).toLocaleString('en-IN')}`} />
              )}
              {app.approved_amount && (
                <QuickInfoRow icon="✅" label="Approved" value={`₹${Number(app.approved_amount / 100).toLocaleString('en-IN')}`} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '480px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 1rem', color: 'var(--navy)' }}>
              {actionType === 'approve' ? '✅ Approve Application'
                : actionType === 'reject' ? '✕ Reject Application'
                : actionType === 'query' ? '❓ Raise Query'
                : '⏳ Waitlist Application'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
              Application: <strong>{app.upn}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">
                {actionType === 'approve' ? 'Approval Remarks (optional)' : 'Reason / Remarks *'}
              </label>
              <textarea
                className="form-input"
                rows={4}
                value={actionRemark}
                onChange={e => setActionRemark(e.target.value)}
                placeholder={actionType === 'approve' ? 'Any additional notes...' : 'Provide clear reason for applicant...'}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-ghost" onClick={() => { setShowActionModal(false); setActionRemark(''); }}>
                Cancel
              </button>
              <button
                className={`btn ${actionType === 'approve' ? 'btn-primary' : actionType === 'reject' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={handleAction}
                disabled={actionLoading || (actionType !== 'approve' && !actionRemark.trim())}
                style={actionType === 'approve' ? { background: '#15803D' } : {}}
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: '140px', flexShrink: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
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

function CapitalSubsidyDetails({ data }: { data: any }) {
  return (
    <div className="detail-grid">
      <DetailRow label="Centre Name" value={data.centre_name} />
      <DetailRow label="Address" value={data.address} />
      <DetailRow label="District" value={data.district} />
      <DetailRow label="Area Category" value={data.area_category} />
      <DetailRow label="Centre Type" value={data.centre_type?.replace(/_/g, ' ')} />
      <DetailRow label="Total Project Cost" value={data.total_project_cost ? `₹${Number(data.total_project_cost).toLocaleString('en-IN')}` : undefined} />
      <DetailRow label="Subsidy Requested" value={data.subsidy_requested ? `₹${Number(data.subsidy_requested).toLocaleString('en-IN')}` : undefined} />
      <DetailRow label="Land Area (sq ft)" value={data.land_area_sqft} />
      <DetailRow label="Proposed Capacity" value={data.proposed_capacity} />
      <DetailRow label="Yoga Instructor" value={data.yoga_instructor_name} />
      <DetailRow label="Instructor Certification" value={data.yoga_instructor_certification} />
    </div>
  );
}

function ResearchGrantDetails({ data }: { data: any }) {
  return (
    <div className="detail-grid">
      <DetailRow label="Institution" value={data.institution_name} />
      <DetailRow label="Research Title" value={data.research_title} />
      <DetailRow label="Principal Investigator" value={data.principal_investigator} />
      <DetailRow label="Duration" value={data.duration_months ? `${data.duration_months} months` : undefined} />
      <DetailRow label="Grant Requested" value={data.grant_requested ? `₹${Number(data.grant_requested).toLocaleString('en-IN')}` : undefined} />
      <DetailRow label="Research Area" value={data.research_area} />
      <DetailRow label="Co-Investigators" value={data.co_investigators} />
    </div>
  );
}

function TeacherCertDetails({ data }: { data: any }) {
  return (
    <div className="detail-grid">
      <DetailRow label="Applicant Name" value={data.applicant_name} />
      <DetailRow label="YCB Level" value={data.ycb_level ? `Level ${data.ycb_level}` : undefined} />
      <DetailRow label="Exam Date" value={data.exam_date} />
      <DetailRow label="Exam Centre" value={data.exam_centre} />
      <DetailRow label="Roll Number" value={data.roll_number} />
      <DetailRow label="Exam Fee Paid" value={data.exam_fee_paid ? `₹${Number(data.exam_fee_paid).toLocaleString('en-IN')}` : undefined} />
      <DetailRow label="Result Status" value={data.result_status} />
    </div>
  );
}

function ExistingInstDetails({ data }: { data: any }) {
  return (
    <div className="detail-grid">
      <DetailRow label="Institution Name" value={data.institution_name} />
      <DetailRow label="Institution Type" value={data.institution_type?.replace(/_/g, ' ')} />
      <DetailRow label="Address" value={data.address} />
      <DetailRow label="Hours/Month" value={data.hours_per_month ? `${data.hours_per_month} hrs` : undefined} />
      <DetailRow label="No. of Months" value={data.number_of_months} />
      <DetailRow label="Amount Requested" value={data.amount_requested ? `₹${Number(data.amount_requested).toLocaleString('en-IN')}` : undefined} />
      <DetailRow label="Yoga Instructor" value={data.yoga_instructor_name} />
      <DetailRow label="Instructor Contact" value={data.instructor_contact} />
    </div>
  );
}

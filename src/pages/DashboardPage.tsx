import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DashboardStats, SCHEME_LABELS, SchemeType, STATUS_COLORS, ApplicationStatus } from '../types';
import { adminApi, appApi } from '../utils/api';
import { FileText, ArrowRight, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

function formatINR(n: number) {
  if (n >= 10000000) return `₹${(n/10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n/100000).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const SCHEME_ICONS: Record<string, string> = {
  CAPITAL_SUBSIDY: '🏛️', RESEARCH_GRANT: '🔬',
  TEACHER_CERTIFICATION: '🎓', EXISTING_INSTITUTION: '🏠',
};

const STATUS_BADGE: Record<string,string> = {
  DRAFT:'badge-draft',SUBMITTED:'badge-submitted',UNDER_REVIEW:'badge-under-review',
  QUERY_RAISED:'badge-query-raised',APPROVED:'badge-approved',REJECTED:'badge-rejected',
  WAITLISTED:'badge-waitlisted',DISBURSED:'badge-disbursed',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myApps, setMyApps] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'STATE_ADMIN' || user?.role === 'DISTRICT_ADMIN';

  useEffect(() => {
    const load = async () => {
      try {
        if (isAdmin) { const res = await adminApi.stats(); setStats(res.data); }
        else { const res = await appApi.list(); setMyApps(res.data); }
      } catch (e) { /* silent */ }
      setLoading(false);
    };
    load();
  }, [isAdmin]);

  if (loading) return <div style={{textAlign:'center',padding:60,color:'var(--text-muted)'}}>Loading dashboard...</div>;

  if (isAdmin && stats) {
    const totalBudget = stats.budget.reduce((a,b) => a+Number(b.total_budget_inr),0);
    const approvedBudget = stats.budget.reduce((a,b) => a+Number(b.approved_amount_inr),0);
    const disbursed = stats.budget.reduce((a,b) => a+Number(b.disbursed_amount_inr),0);
    const pending = stats.by_status.filter(s => ['SUBMITTED','UNDER_REVIEW','QUERY_RAISED'].includes(s.status))
      .reduce((a,b) => a+parseInt(b.count),0);

    return (
      <div>
        <div style={{marginBottom:24}}>
          <h2 style={{fontFamily:'Noto Serif,serif',color:'var(--navy)',marginBottom:4}}>Welcome, {user?.full_name?.split(' ')[0]}</h2>
          <p style={{color:'var(--text-secondary)',fontSize:13}}>{user?.role==='STATE_ADMIN'?'State-level overview':`District: ${user?.district}`} · FY 2025-26</p>
        </div>
        <div className="stats-grid">
          {[
            {label:'Total Applications',value:stats.total,sub:'All time',icon:'📋',cls:'navy'},
            {label:'Pending Review',value:pending,sub:'Awaiting action',icon:'⏳',cls:'saffron'},
            {label:'Budget Approved',value:formatINR(approvedBudget),sub:`of ${formatINR(totalBudget)} total`,icon:'💰',cls:'green'},
            {label:'Disbursed',value:formatINR(disbursed),sub:'Released so far',icon:'✅',cls:'purple'},
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
          <div className="card">
            <div className="card-header"><div className="card-title">📊 Applications by Scheme</div></div>
            <div className="card-body" style={{padding:'16px 22px'}}>
              {stats.by_scheme.map(s => {
                const pct = Math.round((parseInt(s.count)/(stats.total||1))*100);
                return (
                  <div key={s.scheme_type} style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                      <span style={{fontSize:12.5,fontWeight:600}}>{SCHEME_ICONS[s.scheme_type]} {SCHEME_LABELS[s.scheme_type as SchemeType]}</span>
                      <span style={{fontSize:12.5,color:'var(--text-secondary)'}}>{s.count}</span>
                    </div>
                    <div className="progress-bar-wrap"><div className="progress-bar" style={{width:`${pct}%`}}/></div>
                  </div>
                );
              })}
              {!stats.by_scheme.length && <p style={{textAlign:'center',padding:20,color:'var(--text-muted)',fontSize:13}}>No applications yet</p>}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title">📈 Status Distribution</div></div>
            <div className="card-body" style={{padding:'16px 22px'}}>
              <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                {stats.by_status.map(s => (
                  <div key={s.status} style={{padding:'8px 14px',borderRadius:8,background:`${STATUS_COLORS[s.status as ApplicationStatus]}18`,border:`1.5px solid ${STATUS_COLORS[s.status as ApplicationStatus]}33`,minWidth:90,textAlign:'center'}}>
                    <div style={{fontSize:20,fontWeight:700,color:STATUS_COLORS[s.status as ApplicationStatus]}}>{s.count}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)',textTransform:'capitalize'}}>{s.status.replace(/_/g,' ').toLowerCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Clock size={16}/> Recent Applications</div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/applications')}>View All <ArrowRight size={13}/></button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Application No.</th><th>Applicant</th><th>Scheme</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {stats.recent.map((app: Record<string,string>) => (
                  <tr key={app.id} style={{cursor:'pointer'}} onClick={() => navigate(`/applications/${app.id}`)}>
                    <td style={{fontFamily:'monospace',fontSize:12.5,color:'var(--navy-mid)'}}>{app.application_number}</td>
                    <td>{app.full_name||'—'}</td>
                    <td>{SCHEME_ICONS[app.scheme_type]} {SCHEME_LABELS[app.scheme_type as SchemeType]}</td>
                    <td><span className={`badge ${STATUS_BADGE[app.status]||'badge-draft'}`}>{app.status?.replace(/_/g,' ')}</span></td>
                    <td style={{fontSize:12,color:'var(--text-muted)'}}>{app.submission_date?new Date(app.submission_date).toLocaleDateString('en-IN'):'—'}</td>
                  </tr>
                ))}
                {!stats.recent.length && <tr><td colSpan={5} style={{textAlign:'center',padding:32,color:'var(--text-muted)'}}>No applications yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Applicant view
  const queryRaised = myApps.filter(a => a.status === 'QUERY_RAISED');
  const approved = myApps.filter(a => a.status === 'APPROVED');

  return (
    <div>
      <div style={{marginBottom:24}}>
        <h2 style={{fontFamily:'Noto Serif,serif',color:'var(--navy)',marginBottom:4}}>नमस्ते, {user?.full_name?.split(' ')[0]} 🙏</h2>
        <p style={{color:'var(--text-secondary)',fontSize:13}}>Uttarakhand Yoga Policy 2025 Portal · {user?.district}</p>
      </div>
      {queryRaised.length > 0 && (
        <div className="alert alert-warning">
          <AlertCircle size={16}/>
          <div><strong>Action Required:</strong> {queryRaised.length} application(s) have queries.
            <button className="btn btn-sm" style={{marginLeft:12,background:'#f59e0b',color:'white',padding:'4px 12px'}} onClick={() => navigate('/applications')}>View Now</button>
          </div>
        </div>
      )}
      {approved.length > 0 && (
        <div className="alert alert-success"><CheckCircle size={16}/>
          <div><strong>Congratulations!</strong> {approved.length} application(s) approved.</div>
        </div>
      )}
      <div style={{marginBottom:28}}>
        <h3 style={{fontFamily:'Noto Serif,serif',fontSize:16,color:'var(--navy)',marginBottom:16}}>Apply for Incentives</h3>
        <div className="scheme-grid">
          {[
            {scheme:'capital-subsidy',icon:'🏛️',label:'Yoga Centre Capital Subsidy',desc:'One-time capital subsidy for new/expansion Yoga centres. Up to ₹20L (Hills) or ₹10L (Plains).',amount:'Up to ₹20 Lakh'},
            {scheme:'research-grant',icon:'🔬',label:'Research & Development Grant',desc:'Grant for Yoga research by universities, institutions, and NGOs. Max ₹10L per project.',amount:'Up to ₹10 Lakh'},
            {scheme:'teacher-certification',icon:'🎓',label:'YCB Certification Reimbursement',desc:'Exam fee reimbursement for YCB Level 1–7 certified candidates from Uttarakhand.',amount:'₹3,250 – ₹11,750'},
            {scheme:'existing-institution',icon:'🏠',label:'Existing Institution Support',desc:'Reimbursement of ₹250/hour for Yoga sessions at homestays, hotels, schools, colleges.',amount:'₹250/hour (max 20hr/month)'},
          ].map(s => (
            <div key={s.scheme} className="scheme-card" onClick={() => navigate(`/applications/new/${s.scheme}`)}>
              <div className="scheme-icon" style={{background:'var(--saffron-light)'}}>{s.icon}</div>
              <h3>{s.label}</h3>
              <p>{s.desc}</p>
              <div className="scheme-amount">💰 {s.amount}</div>
              <div style={{marginTop:12,display:'flex',alignItems:'center',gap:5,fontSize:12,color:'var(--saffron)',fontWeight:600}}>Apply Now <ArrowRight size={13}/></div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title"><FileText size={16}/> My Applications ({myApps.length})</div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/applications')}>View All</button>
        </div>
        {!myApps.length ? (
          <div style={{padding:48,textAlign:'center',color:'var(--text-muted)'}}>
            <TrendingUp size={36} style={{opacity:0.3,marginBottom:12}}/>
            <p style={{fontSize:14}}>No applications yet. Apply for an incentive above!</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>App. No.</th><th>Scheme</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
              <tbody>
                {myApps.slice(0,5).map(app => (
                  <tr key={app.id} style={{cursor:'pointer'}} onClick={() => navigate(`/applications/${app.id}`)}>
                    <td style={{fontFamily:'monospace',fontSize:12.5,color:'var(--navy-mid)'}}>{app.application_number}</td>
                    <td>{SCHEME_ICONS[app.scheme_type]} {SCHEME_LABELS[app.scheme_type as SchemeType]}</td>
                    <td><span className={`badge ${STATUS_BADGE[app.status]||'badge-draft'}`}>{app.status?.replace(/_/g,' ')}</span></td>
                    <td style={{fontSize:12,color:'var(--text-muted)'}}>{app.submission_date?new Date(app.submission_date).toLocaleDateString('en-IN'):'—'}</td>
                    <td><ArrowRight size={14} color="var(--text-muted)"/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

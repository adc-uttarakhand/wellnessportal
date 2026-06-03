import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { appApi } from '../utils/api';
import { SCHEME_LABELS, SchemeType } from '../types';
import { PlusCircle, Search, Filter } from 'lucide-react';

const SCHEME_ICONS: Record<string,string> = { CAPITAL_SUBSIDY:'🏛️', RESEARCH_GRANT:'🔬', TEACHER_CERTIFICATION:'🎓', EXISTING_INSTITUTION:'🏠' };
const STATUS_BADGE: Record<string,string> = { DRAFT:'badge-draft',SUBMITTED:'badge-submitted',UNDER_REVIEW:'badge-under-review',QUERY_RAISED:'badge-query-raised',APPROVED:'badge-approved',REJECTED:'badge-rejected',WAITLISTED:'badge-waitlisted',DISBURSED:'badge-disbursed' };

export default function ApplicationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<Record<string,string>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [schemeFilter, setSchemeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const isAdmin = ['STATE_ADMIN','DISTRICT_ADMIN'].includes(user?.role||'');

  useEffect(() => {
    appApi.list().then(r => setApps(r.data)).catch(()=>{}).finally(() => setLoading(false));
  }, []);

  const filtered = apps.filter(a =>
    (!search || a.application_number?.toLowerCase().includes(search.toLowerCase()) || a.applicant_name?.toLowerCase().includes(search.toLowerCase())) &&
    (!schemeFilter || a.scheme_type === schemeFilter) &&
    (!statusFilter || a.status === statusFilter)
  );

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <h2 style={{fontFamily:'Noto Serif,serif',color:'var(--navy)',marginBottom:4}}>
            {isAdmin ? 'All Applications' : 'My Applications'}
          </h2>
          <p style={{color:'var(--text-secondary)',fontSize:13}}>{filtered.length} applications found</p>
        </div>
        {!isAdmin && (
          <button className="btn btn-primary" onClick={() => navigate('/applications/new/choose')}>
            <PlusCircle size={15}/> New Application
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'white',border:'1.5px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'8px 12px',flex:1,minWidth:200}}>
          <Search size={15} color="var(--text-muted)"/>
          <input style={{border:'none',outline:'none',flex:1,fontSize:13.5}} placeholder="Search by application no. or name..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="form-control" style={{width:'auto',minWidth:200}} value={schemeFilter} onChange={e=>setSchemeFilter(e.target.value)}>
          <option value="">All Schemes</option>
          <option value="CAPITAL_SUBSIDY">Capital Subsidy</option>
          <option value="RESEARCH_GRANT">Research Grant</option>
          <option value="TEACHER_CERTIFICATION">Teacher Certification</option>
          <option value="EXISTING_INSTITUTION">Existing Institution</option>
        </select>
        <select className="form-control" style={{width:'auto',minWidth:170}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          {['SUBMITTED','UNDER_REVIEW','QUERY_RAISED','APPROVED','REJECTED','WAITLISTED','DISBURSED'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div style={{padding:60,textAlign:'center',color:'var(--text-muted)'}}>Loading applications...</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Application No.</th>
                  {isAdmin && <th>Applicant</th>}
                  <th>Scheme</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>FY</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => (
                  <tr key={app.id} style={{cursor:'pointer'}} onClick={() => navigate(`/applications/${app.id}`)}>
                    <td style={{fontFamily:'monospace',fontSize:12.5,color:'var(--navy-mid)',fontWeight:600}}>{app.application_number}</td>
                    {isAdmin && <td style={{fontSize:13}}>{app.applicant_name||'—'}</td>}
                    <td style={{fontSize:13}}>{SCHEME_ICONS[app.scheme_type]} {SCHEME_LABELS[app.scheme_type as SchemeType]}</td>
                    <td style={{fontSize:13}}>{app.district||'—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[app.status]||'badge-draft'}`}>{app.status?.replace(/_/g,' ')}</span></td>
                    <td style={{fontSize:12,color:'var(--text-muted)'}}>{app.submission_date?new Date(app.submission_date).toLocaleDateString('en-IN'):'Not submitted'}</td>
                    <td style={{fontSize:12,color:'var(--text-muted)'}}>{app.financial_year}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={isAdmin?7:6} style={{textAlign:'center',padding:48,color:'var(--text-muted)'}}>
                    No applications found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

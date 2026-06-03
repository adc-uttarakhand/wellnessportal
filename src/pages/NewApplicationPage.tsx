import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { appApi } from '../utils/api';
import { DISTRICTS, YCB_LEVELS, YCBLevel, HILLS_DISTRICTS } from '../types';
import { ArrowLeft, ArrowRight, CheckCircle, Info } from 'lucide-react';

// ── Eligibility info boxes ──────────────────────────────────────────────
const SCHEME_INFO: Record<string, { title: string; icon: string; eligibility: string[]; maxAmount: string }> = {
  'capital-subsidy': {
    title: 'Yoga Centre Capital Subsidy',
    icon: '🏛️',
    eligibility: ['Greenfield or expansion Yoga/Meditation Centre','Not availed similar benefits under any other scheme','Must employ YCB certified trainers','Minimum 20 sq.ft studio space per person'],
    maxAmount: '₹20 Lakh (Hills) / ₹10 Lakh (Plains)',
  },
  'research-grant': {
    title: 'Research & Development Grant',
    icon: '🔬',
    eligibility: ['Universities, colleges with PG Yoga courses','Research institutes (3+ years old in Yoga field)','AYUSH organizations and NGOs','Medical/health organizations (5+ years in Yoga)','No individual applications — must be through institution'],
    maxAmount: '₹10 Lakh per project',
  },
  'teacher-certification': {
    title: 'YCB Certification Reimbursement',
    icon: '🎓',
    eligibility: ['Must be a resident of Uttarakhand','Must have PASSED YCB certification exam','Eligible for only one level reimbursement','Quota: 500 per year (top rank holders)'],
    maxAmount: 'Actual exam fee (₹3,250 – ₹11,750)',
  },
  'existing-institution': {
    title: 'Existing Institution Yoga Support',
    icon: '🏠',
    eligibility: ['Homestays, resorts, hotels registered with Tourism/AYUSH','Schools/Colleges registered with Govt.','Minimum 4 sessions per month (min 1 hour each)','Must engage YCB certified trainer','Max 3 months incentive, max 20 hr/month'],
    maxAmount: '₹250/hour × 20 hr/month × 3 months = ₹15,000',
  },
};

function InfoBox({ scheme }: { scheme: string }) {
  const info = SCHEME_INFO[scheme];
  if (!info) return null;
  return (
    <div style={{background:'var(--sky)',border:'1px solid #bfdbfe',borderRadius:'var(--radius)',padding:'16px 20px',marginBottom:24}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
        <span style={{fontSize:24}}>{info.icon}</span>
        <div>
          <div style={{fontWeight:700,fontSize:15,color:'var(--navy)'}}>{info.title}</div>
          <div style={{fontSize:12,color:'#1e40af'}}>Max benefit: {info.maxAmount}</div>
        </div>
      </div>
      <div style={{fontSize:12.5,color:'#1e40af'}}>
        <strong>Eligibility:</strong>
        <ul style={{marginTop:6,paddingLeft:18,lineHeight:2}}>
          {info.eligibility.map((e,i) => <li key={i}>{e}</li>)}
        </ul>
      </div>
    </div>
  );
}

// ── Capital Subsidy Form ────────────────────────────────────────────────
function CapitalSubsidyForm({ onSubmit, loading }: { onSubmit: (d: Record<string,unknown>) => void; loading: boolean }) {
  const [d, setD] = useState<Record<string,string|boolean>>({ district:'', area_category:'', project_type:'GREENFIELD', land_ownership_type:'OWNED', proposed_investment:'', eligible_capital_assets:'', financial_year:'2025-26' });
  const set = (k: string, v: string|boolean) => setD(f => ({...f, [k]: v}));

  const calcSubsidy = () => {
    const eca = parseFloat(String(d.eligible_capital_assets)) || 0;
    const pct = d.area_category === 'HILLS' ? 0.5 : 0.25;
    const maxCap = d.area_category === 'HILLS' ? 2000000 : 1000000;
    return Math.min(eca * pct, maxCap);
  };

  return (
    <div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label required">District</label>
          <select className="form-control" value={String(d.district)} onChange={e => {
            const dist = e.target.value;
            const auto = HILLS_DISTRICTS.includes(dist as typeof HILLS_DISTRICTS[number]) ? 'HILLS' : 'PLAINS';
            setD(f => ({...f, district: dist, area_category: auto}));
          }}>
            <option value="">-- Select --</option>
            {DISTRICTS.map(dist => <option key={dist} value={dist}>{dist}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label required">Area Category</label>
          <select className="form-control" value={String(d.area_category)} onChange={e => set('area_category', e.target.value)}>
            <option value="">-- Auto-detected from district --</option>
            <option value="HILLS">Hills (50% subsidy, max ₹20L)</option>
            <option value="PLAINS">Plains (25% subsidy, max ₹10L)</option>
          </select>
          <div className="form-hint">Hills: Pithoragarh, Chamoli, Tehri etc. Auto-set based on district.</div>
        </div>
      </div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label required">Project Type</label>
          <select className="form-control" value={String(d.project_type)} onChange={e => set('project_type', e.target.value)}>
            <option value="GREENFIELD">Greenfield (New Centre)</option>
            <option value="EXPANSION">Expansion of Existing Centre</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label required">Land Ownership</label>
          <select className="form-control" value={String(d.land_ownership_type)} onChange={e => set('land_ownership_type', e.target.value)}>
            <option value="OWNED">Owned</option>
            <option value="LEASED">Leased</option>
          </select>
        </div>
      </div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label required">Proposed Total Investment (₹)</label>
          <input className="form-control" type="number" value={String(d.proposed_investment)} onChange={e => set('proposed_investment', e.target.value)} placeholder="e.g. 2500000"/>
        </div>
        <div className="form-group">
          <label className="form-label required">Eligible Capital Assets - ECA (₹)</label>
          <input className="form-control" type="number" value={String(d.eligible_capital_assets)} onChange={e => set('eligible_capital_assets', e.target.value)} placeholder="Excluding land, pre-construction, working capital"/>
        </div>
      </div>
      {d.eligible_capital_assets && d.area_category && (
        <div className="alert alert-success" style={{marginBottom:16}}>
          <CheckCircle size={16}/>
          <div>
            <strong>Calculated Subsidy: ₹{calcSubsidy().toLocaleString('en-IN')}</strong>
            <div style={{fontSize:12,marginTop:2}}>
              {d.area_category === 'HILLS' ? '50%' : '25%'} of ECA, capped at ₹{d.area_category === 'HILLS' ? '20,00,000' : '10,00,000'}
            </div>
          </div>
        </div>
      )}
      <div style={{background:'var(--off-white)',borderRadius:8,padding:14,fontSize:12.5,color:'var(--text-secondary)',marginBottom:20}}>
        <strong>Required Documents (upload after submission):</strong>
        <ul style={{marginTop:6,paddingLeft:16,lineHeight:2}}>
          <li>Draft Detailed Project Report (DPR) certified by architect/planner</li>
          <li>CA certificate for project cost and ECA</li>
          <li>Land documents/possession records</li>
          <li>Applicable licenses from competent authority</li>
        </ul>
      </div>
      <button className="btn btn-primary btn-lg" onClick={() => onSubmit({...d, proposed_investment: parseFloat(String(d.proposed_investment)), eligible_capital_assets: parseFloat(String(d.eligible_capital_assets))})} disabled={loading||!d.district||!d.area_category||!d.proposed_investment||!d.eligible_capital_assets}>
        {loading ? 'Submitting...' : 'Submit Application'} <ArrowRight size={15}/>
      </button>
    </div>
  );
}

// ── Research Grant Form ─────────────────────────────────────────────────
function ResearchGrantForm({ onSubmit, loading }: { onSubmit: (d: Record<string,unknown>) => void; loading: boolean }) {
  const [d, setD] = useState<Record<string,string|number|boolean>>({
    district:'', institution_name:'', institution_type:'', institution_established_yr:'',
    pi_name:'', pi_age:'', pi_qualification:'', pi_ycb_level:'', pi_affiliation:'',
    co_pi_name:'', project_title:'', project_objectives:'', project_summary:'', expected_output:'',
    project_duration_months:'', grant_requested_inr:'',
    budget_equipment:'', budget_manpower:'', budget_documentation:'', budget_travel:'', budget_contingency:'',
    application_cycle:'APR-MAY', non_duplication_declaration: false, financial_year:'2025-26',
  });
  const set = (k: string, v: string|number|boolean) => setD(f => ({...f,[k]:v}));

  const budgetTotal = ['budget_equipment','budget_manpower','budget_documentation','budget_travel','budget_contingency']
    .reduce((a,k) => a + (parseFloat(String(d[k]))||0), 0);

  return (
    <div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label required">District</label>
          <select className="form-control" value={String(d.district)} onChange={e => set('district',e.target.value)}>
            <option value="">-- Select --</option>
            {DISTRICTS.map(dist => <option key={dist} value={dist}>{dist}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label required">Application Cycle</label>
          <select className="form-control" value={String(d.application_cycle)} onChange={e => set('application_cycle',e.target.value)}>
            <option value="APR-MAY">April–May (Scrutiny in June)</option>
            <option value="OCT-NOV">October–November (Scrutiny in December)</option>
          </select>
        </div>
      </div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label required">Institution Name</label>
          <input className="form-control" value={String(d.institution_name)} onChange={e => set('institution_name',e.target.value)} placeholder="Full legal name"/>
        </div>
        <div className="form-group">
          <label className="form-label required">Institution Type</label>
          <select className="form-control" value={String(d.institution_type)} onChange={e => set('institution_type',e.target.value)}>
            <option value="">-- Select --</option>
            <option value="UNIVERSITY">University/College (PG Yoga)</option>
            <option value="RESEARCH">Research Institute (3+ yrs in Yoga)</option>
            <option value="MEDICAL">Medical/Health Organization (5+ yrs)</option>
            <option value="AYUSH">AYUSH Organization / NGO</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label required">Project Title</label>
        <input className="form-control" value={String(d.project_title)} onChange={e => set('project_title',e.target.value)} placeholder="Concise title of your research project"/>
      </div>
      <div className="form-group">
        <label className="form-label required">Project Objectives <span style={{fontWeight:400,fontSize:11}}>(max 500 words)</span></label>
        <textarea className="form-control" rows={4} value={String(d.project_objectives)} onChange={e => set('project_objectives',e.target.value)} placeholder="State the objectives clearly..."/>
      </div>
      <div className="form-group">
        <label className="form-label required">Project Summary <span style={{fontWeight:400,fontSize:11}}>(max 1500 words)</span></label>
        <textarea className="form-control" rows={6} value={String(d.project_summary)} onChange={e => set('project_summary',e.target.value)} placeholder="Detailed summary of the research project..."/>
      </div>
      <h4 style={{color:'var(--navy)',marginBottom:14,marginTop:4}}>Principal Investigator (PI)</h4>
      <div className="form-grid-3">
        <div className="form-group">
          <label className="form-label required">PI Full Name</label>
          <input className="form-control" value={String(d.pi_name)} onChange={e => set('pi_name',e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label required">Age (as of 1st April FY)</label>
          <input className="form-control" type="number" value={String(d.pi_age)} onChange={e => set('pi_age',e.target.value)} placeholder="Max 50 years"/>
        </div>
        <div className="form-group">
          <label className="form-label required">YCB Level (if applicable)</label>
          <select className="form-control" value={String(d.pi_ycb_level)} onChange={e => set('pi_ycb_level',e.target.value)}>
            <option value="">-- None / Not applicable --</option>
            {(Object.keys(YCB_LEVELS) as YCBLevel[]).map(k => <option key={k} value={k}>{YCB_LEVELS[k].name}</option>)}
          </select>
        </div>
      </div>
      <h4 style={{color:'var(--navy)',marginBottom:14}}>Budget Details (max ₹10 Lakh)</h4>
      <div className="form-grid-3">
        {[
          ['budget_equipment','Equipment & Research Materials (40%)'],
          ['budget_manpower','Manpower (20%)'],
          ['budget_documentation','Documentation & Publication (15%)'],
          ['budget_travel','Travel & Fieldwork (20%)'],
          ['budget_contingency','Contingency (5%)'],
        ].map(([k,label]) => (
          <div key={k} className="form-group">
            <label className="form-label">{label}</label>
            <input className="form-control" type="number" value={String(d[k])} onChange={e => set(k,e.target.value)} placeholder="₹"/>
          </div>
        ))}
        <div className="form-group" style={{display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
          <div style={{background:'var(--green-light)',borderRadius:8,padding:12,border:'1px solid var(--green-mid)'}}>
            <div style={{fontSize:11,color:'var(--green-uk)',fontWeight:600}}>TOTAL BUDGET</div>
            <div style={{fontSize:20,fontWeight:700,color:'var(--green-uk)'}}>₹{budgetTotal.toLocaleString('en-IN')}</div>
            {budgetTotal > 1000000 && <div style={{fontSize:11,color:'red',marginTop:4}}>⚠️ Exceeds ₹10 Lakh limit</div>}
          </div>
        </div>
      </div>
      <div className="form-group" style={{display:'flex',alignItems:'flex-start',gap:10}}>
        <input type="checkbox" id="nondup" checked={Boolean(d.non_duplication_declaration)} onChange={e => set('non_duplication_declaration',e.target.checked)} style={{marginTop:3}}/>
        <label htmlFor="nondup" style={{fontSize:13,color:'var(--text-primary)',cursor:'pointer'}}>
          I declare that the proposed project has not received, and will not receive, funding for the same research from any Indian or foreign entity. (Required)
        </label>
      </div>
      <button className="btn btn-primary btn-lg" onClick={() => onSubmit({...d, grant_requested_inr: budgetTotal, project_duration_months: parseInt(String(d.project_duration_months))})}
        disabled={loading||!d.district||!d.institution_name||!d.project_title||!d.non_duplication_declaration||budgetTotal>1000000}>
        {loading?'Submitting...':'Submit Application'} <ArrowRight size={15}/>
      </button>
    </div>
  );
}

// ── Teacher Certification Form ──────────────────────────────────────────
function TeacherCertForm({ onSubmit, loading }: { onSubmit: (d: Record<string,unknown>) => void; loading: boolean }) {
  const [d, setD] = useState<Record<string,string>>({ district:'', applicant_name:'', aadhaar_number:'', ycb_level:'', ycb_cert_number:'', exam_date:'', exam_fee_paid:'', rank_in_exam:'', bank_account_number:'', bank_ifsc:'', bank_name:'', financial_year:'2025-26' });
  const set = (k: string, v: string) => setD(f => ({...f,[k]:v}));

  return (
    <div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label required">District</label>
          <select className="form-control" value={d.district} onChange={e => set('district',e.target.value)}>
            <option value="">-- Select --</option>
            {DISTRICTS.map(dist => <option key={dist} value={dist}>{dist}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label required">Full Name (as per YCB Certificate)</label>
          <input className="form-control" value={d.applicant_name} onChange={e => set('applicant_name',e.target.value)}/>
        </div>
      </div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label required">Aadhaar Number</label>
          <input className="form-control" value={d.aadhaar_number} onChange={e => set('aadhaar_number',e.target.value)} maxLength={12} placeholder="12-digit Aadhaar"/>
        </div>
        <div className="form-group">
          <label className="form-label required">YCB Level</label>
          <select className="form-control" value={d.ycb_level} onChange={e => set('ycb_level',e.target.value)}>
            <option value="">-- Select Level --</option>
            {(Object.keys(YCB_LEVELS) as YCBLevel[]).map(k => (
              <option key={k} value={k}>{k.replace('LEVEL_','Level ')} – {YCB_LEVELS[k].name} (₹{YCB_LEVELS[k].fee.toLocaleString('en-IN')}, Quota: {YCB_LEVELS[k].quota}/yr)</option>
            ))}
          </select>
          {d.ycb_level && (
            <div className="form-hint" style={{color:'var(--green-uk)',fontWeight:600}}>
              Reimbursement Amount: ₹{YCB_LEVELS[d.ycb_level as YCBLevel]?.fee.toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </div>
      <div className="form-grid-3">
        <div className="form-group">
          <label className="form-label required">YCB Certificate Number</label>
          <input className="form-control" value={d.ycb_cert_number} onChange={e => set('ycb_cert_number',e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label required">Exam Date</label>
          <input className="form-control" type="date" value={d.exam_date} onChange={e => set('exam_date',e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label required">Exam Fee Paid (₹)</label>
          <input className="form-control" type="number" value={d.exam_fee_paid} onChange={e => set('exam_fee_paid',e.target.value)}/>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label required">Your Rank in Examination</label>
        <input className="form-control" type="number" value={d.rank_in_exam} onChange={e => set('rank_in_exam',e.target.value)} placeholder="Top rank holders get priority"/>
      </div>
      <h4 style={{color:'var(--navy)',marginBottom:14}}>Bank Details (for E-Rupi transfer)</h4>
      <div className="form-grid-3">
        <div className="form-group">
          <label className="form-label required">Account Number</label>
          <input className="form-control" value={d.bank_account_number} onChange={e => set('bank_account_number',e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label required">IFSC Code</label>
          <input className="form-control" value={d.bank_ifsc} onChange={e => set('bank_ifsc',e.target.value)} maxLength={11}/>
        </div>
        <div className="form-group">
          <label className="form-label required">Bank Name</label>
          <input className="form-control" value={d.bank_name} onChange={e => set('bank_name',e.target.value)}/>
        </div>
      </div>
      <div style={{background:'var(--off-white)',borderRadius:8,padding:14,fontSize:12.5,color:'var(--text-secondary)',marginBottom:20}}>
        <strong>Documents Required:</strong> Fee receipt · Admit card · YCB Result · YCB Certificate · Aadhaar card
      </div>
      <button className="btn btn-primary btn-lg" onClick={() => onSubmit({...d, exam_fee_paid:parseFloat(d.exam_fee_paid), rank_in_exam:parseInt(d.rank_in_exam)})}
        disabled={loading||!d.district||!d.ycb_level||!d.ycb_cert_number||!d.bank_account_number}>
        {loading?'Submitting...':'Submit Application'} <ArrowRight size={15}/>
      </button>
    </div>
  );
}

// ── Existing Institution Form ───────────────────────────────────────────
function ExistingInstitutionForm({ onSubmit, loading }: { onSubmit: (d: Record<string,unknown>) => void; loading: boolean }) {
  const [d, setD] = useState<Record<string,string|boolean|number>>({
    district:'', institution_name:'', institution_type:'', registration_cert_number:'',
    registering_dept:'', address:'', capacity_per_session:'', sessions_per_day:'', sessions_per_month:'',
    trainer_name:'', trainer_ycb_cert:'', trainer_ycb_level:'', trainer_other_institutions:0,
    has_community_sessions:false, community_session_purpose:'',
    claimed_months:1, claimed_hours_per_month:20,
    bank_account_number:'', bank_ifsc:'', bank_name:'', financial_year:'2025-26',
  });
  const set = (k: string, v: string|boolean|number) => setD(f => ({...f,[k]:v}));

  const total = 250 * Math.min(Number(d.claimed_hours_per_month)||0,20) * Math.min(Number(d.claimed_months)||0,3);

  return (
    <div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label required">District</label>
          <select className="form-control" value={String(d.district)} onChange={e => set('district',e.target.value)}>
            <option value="">-- Select --</option>
            {DISTRICTS.map(dist => <option key={dist} value={dist}>{dist}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label required">Institution Type</label>
          <select className="form-control" value={String(d.institution_type)} onChange={e => set('institution_type',e.target.value)}>
            <option value="">-- Select --</option>
            <option value="HOMESTAY">Homestay</option>
            <option value="RESORT">Resort</option>
            <option value="HOTEL">Hotel</option>
            <option value="SCHOOL">School (Govt/Aided)</option>
            <option value="COLLEGE">College (Affiliated)</option>
            <option value="YOGA_CENTRE">Yoga Centre / Institute</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label required">Institution Name</label>
        <input className="form-control" value={String(d.institution_name)} onChange={e => set('institution_name',e.target.value)}/>
      </div>
      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label required">Registration Certificate No.</label>
          <input className="form-control" value={String(d.registration_cert_number)} onChange={e => set('registration_cert_number',e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label required">Registered with Department</label>
          <input className="form-control" value={String(d.registering_dept)} onChange={e => set('registering_dept',e.target.value)} placeholder="e.g. Tourism Department, Education Department"/>
        </div>
      </div>
      <h4 style={{color:'var(--navy)',marginBottom:14}}>Yoga Trainer Details</h4>
      <div className="form-grid-3">
        <div className="form-group">
          <label className="form-label required">Trainer Name</label>
          <input className="form-control" value={String(d.trainer_name)} onChange={e => set('trainer_name',e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label required">YCB Certificate No.</label>
          <input className="form-control" value={String(d.trainer_ycb_cert)} onChange={e => set('trainer_ycb_cert',e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label required">Trainer YCB Level</label>
          <select className="form-control" value={String(d.trainer_ycb_level)} onChange={e => set('trainer_ycb_level',e.target.value)}>
            <option value="">-- Select --</option>
            {(Object.keys(YCB_LEVELS) as YCBLevel[]).map(k => <option key={k} value={k}>{YCB_LEVELS[k].name}</option>)}
          </select>
        </div>
      </div>
      <div className="alert alert-info" style={{marginBottom:16}}>
        <Info size={15}/> <div>One trainer cannot serve more than 5 institutions simultaneously under this policy.</div>
      </div>
      <h4 style={{color:'var(--navy)',marginBottom:14}}>Incentive Claim Details</h4>
      <div className="form-grid-3">
        <div className="form-group">
          <label className="form-label required">Months to Claim (max 3)</label>
          <select className="form-control" value={String(d.claimed_months)} onChange={e => set('claimed_months',parseInt(e.target.value))}>
            <option value="1">1 Month</option>
            <option value="2">2 Months</option>
            <option value="3">3 Months</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label required">Hours/Month to Claim (max 20)</label>
          <input className="form-control" type="number" min="4" max="20" value={String(d.claimed_hours_per_month)} onChange={e => set('claimed_hours_per_month',Math.min(parseInt(e.target.value)||0,20))}/>
          <div className="form-hint">Minimum 4 sessions × 1 hour = 4 hours/month</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',justifyContent:'flex-end',paddingBottom:18}}>
          <div style={{background:'var(--green-light)',borderRadius:8,padding:12,border:'1px solid var(--green-mid)'}}>
            <div style={{fontSize:11,color:'var(--green-uk)',fontWeight:600}}>TOTAL CLAIM</div>
            <div style={{fontSize:20,fontWeight:700,color:'var(--green-uk)'}}>₹{total.toLocaleString('en-IN')}</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>₹250 × {d.claimed_hours_per_month}hr × {d.claimed_months}mo</div>
          </div>
        </div>
      </div>
      <h4 style={{color:'var(--navy)',marginBottom:14}}>Bank Details</h4>
      <div className="form-grid-3">
        <div className="form-group">
          <label className="form-label required">Account Number</label>
          <input className="form-control" value={String(d.bank_account_number)} onChange={e => set('bank_account_number',e.target.value)}/>
        </div>
        <div className="form-group">
          <label className="form-label required">IFSC Code</label>
          <input className="form-control" value={String(d.bank_ifsc)} onChange={e => set('bank_ifsc',e.target.value)} maxLength={11}/>
        </div>
        <div className="form-group">
          <label className="form-label required">Bank Name</label>
          <input className="form-control" value={String(d.bank_name)} onChange={e => set('bank_name',e.target.value)}/>
        </div>
      </div>
      <button className="btn btn-primary btn-lg" onClick={() => onSubmit(d)}
        disabled={loading||!d.district||!d.institution_name||!d.trainer_name||!d.bank_account_number}>
        {loading?'Submitting...':'Submit Application'} <ArrowRight size={15}/>
      </button>
    </div>
  );
}

// ── MAIN Component ──────────────────────────────────────────────────────
const SCHEME_API_MAP: Record<string, (d: Record<string,unknown>) => Promise<{data:{application_number:string}}>> = {
  'capital-subsidy': d => appApi.submitCapitalSubsidy(d),
  'research-grant': d => appApi.submitResearchGrant(d),
  'teacher-certification': d => appApi.submitTeacherCert(d),
  'existing-institution': d => appApi.submitExistingInstitution(d),
};

export default function NewApplicationPage() {
  const { scheme } = useParams<{ scheme: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (data: Record<string,unknown>) => {
    if (!scheme || !SCHEME_API_MAP[scheme]) return;
    setLoading(true); setError('');
    try {
      const res = await SCHEME_API_MAP[scheme](data);
      setSuccess(res.data.application_number);
    } catch (err: unknown) {
      setError((err as {response?:{data?:{error?:string}}})?.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (scheme === 'choose') {
    return (
      <div>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/dashboard')} style={{marginBottom:20}}>
          <ArrowLeft size={13}/> Back
        </button>
        <h2 style={{fontFamily:'Noto Serif,serif',color:'var(--navy)',marginBottom:8}}>Select Incentive Scheme</h2>
        <p style={{color:'var(--text-secondary)',fontSize:13,marginBottom:28}}>Choose the appropriate scheme under Uttarakhand Yoga Policy 2025</p>
        <div className="scheme-grid">
          {[
            {scheme:'capital-subsidy',icon:'🏛️',label:'Yoga Centre Capital Subsidy',desc:'One-time capital subsidy for establishing new or expanding existing Yoga/Meditation centres.',amount:'Up to ₹20 Lakh'},
            {scheme:'research-grant',icon:'🔬',label:'Research & Development Grant',desc:'Research grant for universities, institutes & NGOs working in Yoga, meditation and naturopathy.',amount:'Up to ₹10 Lakh'},
            {scheme:'teacher-certification',icon:'🎓',label:'YCB Certification Reimbursement',desc:'Full reimbursement of YCB examination fees for Uttarakhand residents who clear the exam.',amount:'₹3,250 – ₹11,750'},
            {scheme:'existing-institution',icon:'🏠',label:'Existing Institution Support',desc:'Reimbursement for Yoga sessions conducted at homestays, hotels, schools, and colleges.',amount:'₹250/hour × 20 hr × 3 months'},
          ].map(s => (
            <div key={s.scheme} className="scheme-card" onClick={() => navigate(`/applications/new/${s.scheme}`)}>
              <div className="scheme-icon" style={{background:'var(--saffron-light)'}}>{s.icon}</div>
              <h3>{s.label}</h3>
              <p>{s.desc}</p>
              <div className="scheme-amount">💰 {s.amount}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{maxWidth:520,margin:'60px auto',textAlign:'center'}}>
        <div style={{fontSize:64,marginBottom:20}}>🎉</div>
        <h2 style={{fontFamily:'Noto Serif,serif',color:'var(--green-uk)',marginBottom:12}}>Application Submitted!</h2>
        <p style={{color:'var(--text-secondary)',marginBottom:8}}>Your Unique Project Number (UPN):</p>
        <div style={{background:'var(--green-light)',border:'2px solid var(--green-mid)',borderRadius:10,padding:'16px 24px',marginBottom:24,fontFamily:'monospace',fontSize:18,fontWeight:700,color:'var(--green-uk)'}}>
          {success}
        </div>
        <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:24}}>The Directorate of Yoga will review your application. You will be notified of status updates by SMS and email. Keep this UPN for reference.</p>
        <div style={{display:'flex',gap:12,justifyContent:'center'}}>
          <button className="btn btn-primary" onClick={() => navigate('/applications')}>View My Applications</button>
          <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const titles: Record<string,string> = {
    'capital-subsidy':'Yoga Centre Capital Subsidy Application',
    'research-grant':'Research & Development Grant Application',
    'teacher-certification':'YCB Exam Fee Reimbursement Application',
    'existing-institution':'Existing Institution Session Support Application',
  };

  return (
    <div style={{maxWidth:800}}>
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/applications/new/choose')} style={{marginBottom:20}}>
        <ArrowLeft size={13}/> Change Scheme
      </button>
      <h2 style={{fontFamily:'Noto Serif,serif',color:'var(--navy)',marginBottom:6}}>{titles[scheme||'']||'New Application'}</h2>
      <p style={{color:'var(--text-secondary)',fontSize:13,marginBottom:24}}>Uttarakhand Yoga Policy 2025 · FY 2025-26</p>

      <InfoBox scheme={scheme||''} />

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body">
          {scheme === 'capital-subsidy' && <CapitalSubsidyForm onSubmit={handleSubmit} loading={loading}/>}
          {scheme === 'research-grant' && <ResearchGrantForm onSubmit={handleSubmit} loading={loading}/>}
          {scheme === 'teacher-certification' && <TeacherCertForm onSubmit={handleSubmit} loading={loading}/>}
          {scheme === 'existing-institution' && <ExistingInstitutionForm onSubmit={handleSubmit} loading={loading}/>}
        </div>
      </div>
    </div>
  );
}

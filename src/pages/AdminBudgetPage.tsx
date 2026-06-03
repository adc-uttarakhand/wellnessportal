import { useState, useEffect } from 'react';
import { adminApi } from '../utils/api';
import { SCHEME_LABELS } from '../types';

interface BudgetItem {
  scheme_type: string;
  financial_year: string;
  total_budget: number;
  allocated: number;
  disbursed: number;
  applications_approved: number;
  applications_pending: number;
}

export default function AdminBudgetPage() {
  const [data, setData] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFY, setSelectedFY] = useState('2025-26');

  const FY_OPTIONS = ['2025-26', '2026-27', '2027-28'];

  useEffect(() => { fetchBudget(); }, [selectedFY]);

  async function fetchBudget() {
    try {
      setLoading(true);
      const res = await adminApi.get(`/budget?fy=${selectedFY}`);
      setData(res.data);
    } catch {
      setError('Failed to load budget data.');
    } finally {
      setLoading(false);
    }
  }

  const totalBudget = data.reduce((s, d) => s + d.total_budget, 0);
  const totalAllocated = data.reduce((s, d) => s + d.allocated, 0);
  const totalDisbursed = data.reduce((s, d) => s + d.disbursed, 0);

  function fmt(paise: number) {
    const rs = paise / 100;
    if (rs >= 1_00_00_000) return `₹${(rs / 1_00_00_000).toFixed(2)} Cr`;
    if (rs >= 1_00_000) return `₹${(rs / 1_00_000).toFixed(2)} L`;
    return `₹${rs.toLocaleString('en-IN')}`;
  }

  function pct(num: number, den: number) {
    if (!den) return 0;
    return Math.min(100, Math.round((num / den) * 100));
  }

  const schemeColors: Record<string, string> = {
    capital_subsidy: '#E8751A',
    research_grant: '#7C3AED',
    teacher_certification: '#0891B2',
    existing_institution: '#15803D',
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--navy)' }}>Budget Utilization</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Scheme-wise budget tracking under Uttarakhand Yoga Policy 2025
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Financial Year:</label>
          <select className="form-input" style={{ width: '130px' }} value={selectedFY} onChange={e => setSelectedFY(e.target.value)}>
            {FY_OPTIONS.map(fy => <option key={fy} value={fy}>{fy}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Top summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <SummaryCard title="Total Budget" value={fmt(totalBudget)} subtitle={`FY ${selectedFY}`} color="#1A2B4A" icon="🏦" />
        <SummaryCard title="Committed (Approved)" value={fmt(totalAllocated)} subtitle={`${pct(totalAllocated, totalBudget)}% of total budget`} color="#E8751A" icon="📋" />
        <SummaryCard title="Disbursed" value={fmt(totalDisbursed)} subtitle={`${pct(totalDisbursed, totalBudget)}% of total budget`} color="#15803D" icon="💰" />
        <SummaryCard title="Available Balance" value={fmt(totalBudget - totalAllocated)} subtitle={`${pct(totalBudget - totalAllocated, totalBudget)}% remaining`} color="#0369A1" icon="✅" />
      </div>

      {/* Stacked utilization bar */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title">Overall Budget Utilization — FY {selectedFY}</h3>
        <div style={{ background: 'var(--border)', borderRadius: '8px', overflow: 'hidden', height: '36px', position: 'relative', marginBottom: '0.75rem' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct(totalDisbursed, totalBudget)}%`, background: '#15803D', transition: 'width 0.6s ease' }} />
          <div style={{ position: 'absolute', left: `${pct(totalDisbursed, totalBudget)}%`, top: 0, height: '100%', width: `${pct(totalAllocated - totalDisbursed, totalBudget)}%`, background: '#E8751A', transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <LegendItem color="#15803D" label={`Disbursed (${pct(totalDisbursed, totalBudget)}%)`} />
          <LegendItem color="#E8751A" label={`Committed pending disbursal (${pct(totalAllocated - totalDisbursed, totalBudget)}%)`} />
          <LegendItem color="var(--border)" label={`Available (${pct(totalBudget - totalAllocated, totalBudget)}%)`} />
        </div>
      </div>

      {/* Per-scheme breakdown */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading budget data...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {data.map(item => {
            const color = schemeColors[item.scheme_type] || '#666';
            const allocPct = pct(item.allocated, item.total_budget);
            const disbPct = pct(item.disbursed, item.total_budget);
            const remaining = item.total_budget - item.allocated;
            return (
              <div key={item.scheme_type} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: '1rem' }}>
                        {SCHEME_LABELS[item.scheme_type]}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FY {item.financial_year}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <SmallBadge label={`${item.applications_approved} approved`} color="#15803D" />
                    {item.applications_pending > 0 && <SmallBadge label={`${item.applications_pending} pending`} color="#F59E0B" />}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden', height: '24px', marginBottom: '0.75rem', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${disbPct}%`, background: '#15803D', transition: 'width 0.6s' }} />
                  <div style={{ position: 'absolute', left: `${disbPct}%`, top: 0, height: '100%', width: `${allocPct - disbPct}%`, background: color, opacity: 0.7, transition: 'width 0.6s' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: allocPct > 50 ? 'white' : 'var(--text)' }}>
                    {allocPct}% committed
                  </div>
                </div>

                {/* Amount breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                  <BudgetFigure label="Total Budget" value={fmt(item.total_budget)} color="var(--navy)" />
                  <BudgetFigure label="Committed" value={fmt(item.allocated)} color={color} />
                  <BudgetFigure label="Disbursed" value={fmt(item.disbursed)} color="#15803D" />
                  <BudgetFigure label="Available" value={fmt(remaining)} color={remaining > 0 ? '#0369A1' : '#DC2626'} />
                </div>

                {remaining <= 0 && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#FEF2F2', borderRadius: '6px', fontSize: '0.8rem', color: '#DC2626', fontWeight: 500 }}>
                    ⚠️ Budget fully committed — new applications under this scheme will be waitlisted
                  </div>
                )}
                {remaining > 0 && remaining < item.total_budget * 0.1 && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#FFF8E7', borderRadius: '6px', fontSize: '0.8rem', color: '#B45309', fontWeight: 500 }}>
                    ⚠️ Less than 10% budget remaining — consider budget revision
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Policy reference note */}
      <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', background: '#F8F9FC', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <strong>📋 Policy Reference:</strong> Budget allocations as per Uttarakhand Yoga Policy 2025.
        Capital Subsidy: Hills ≤₹20L (50%), Plains ≤₹10L (25%).
        Research Grant: ≤₹10L/project.
        Teacher Certification: YCB exam fee reimbursement, 500 beneficiaries/year.
        Existing Institution: ₹250/hr × max 20 hrs/month × max 3 months.
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle, color, icon }: { title: string; value: string; subtitle: string; color: string; icon: string }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
          <p style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700, color }}>{value}</p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
    </div>
  );
}

function BudgetFigure({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: '0.6rem 0.75rem', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
      <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: color, flexShrink: 0 }} />
      {label}
    </div>
  );
}

function SmallBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', background: color + '15', color, border: `1px solid ${color}30`, fontSize: '0.75rem', fontWeight: 600 }}>
      {label}
    </span>
  );
}

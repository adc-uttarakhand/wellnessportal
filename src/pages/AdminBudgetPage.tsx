import { useState, useEffect } from 'react';
import { adminApi } from '../utils/api';
import { SchemeType, SCHEME_LABELS } from '../types';

interface BudgetItem {
  scheme_type: SchemeType;
  financial_year: string;
  total_budget_inr: number;
  approved_amount_inr: number;
  disbursed_amount_inr: number;
}

export default function AdminBudgetPage() {
  const [data, setData] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFY, setSelectedFY] = useState('2025-26');

  useEffect(() => { fetchBudget(); }, []);

  async function fetchBudget() {
    try {
      setLoading(true);
      const res = await adminApi.budget();
      setData(res.data);
    } catch {
      setError('Failed to load budget data.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = data.filter(d => d.financial_year === selectedFY);
  const totalBudget = filtered.reduce((s, d) => s + Number(d.total_budget_inr), 0);
  const totalApproved = filtered.reduce((s, d) => s + Number(d.approved_amount_inr), 0);
  const totalDisbursed = filtered.reduce((s, d) => s + Number(d.disbursed_amount_inr), 0);

  function fmt(n: number) {
    if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
    if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  }

  function pct(num: number, den: number) {
    if (!den) return 0;
    return Math.min(100, Math.round((num / den) * 100));
  }

  const schemeColors: Record<SchemeType, string> = {
    CAPITAL_SUBSIDY: '#E8751A', RESEARCH_GRANT: '#7C3AED',
    TEACHER_CERTIFICATION: '#0891B2', EXISTING_INSTITUTION: '#15803D',
  };

  const FY_OPTIONS = [...new Set(data.map(d => d.financial_year))].sort();

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--navy)' }}>Budget Utilization</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Scheme-wise budget — Uttarakhand Yoga Policy 2025
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Financial Year:</label>
          <select className="form-input" style={{ width: '130px' }} value={selectedFY} onChange={e => setSelectedFY(e.target.value)}>
            {(FY_OPTIONS.length ? FY_OPTIONS : ['2025-26', '2026-27', '2027-28']).map(fy => (
              <option key={fy} value={fy}>{fy}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <SummaryCard title="Total Budget" value={fmt(totalBudget)} subtitle={`FY ${selectedFY}`} color="#1A2B4A" icon="🏦" />
        <SummaryCard title="Committed" value={fmt(totalApproved)} subtitle={`${pct(totalApproved, totalBudget)}% of budget`} color="#E8751A" icon="📋" />
        <SummaryCard title="Disbursed" value={fmt(totalDisbursed)} subtitle={`${pct(totalDisbursed, totalBudget)}% of budget`} color="#15803D" icon="💰" />
        <SummaryCard title="Available" value={fmt(totalBudget - totalApproved)} subtitle={`${pct(totalBudget - totalApproved, totalBudget)}% remaining`} color="#0369A1" icon="✅" />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filtered.map(item => {
            const color = schemeColors[item.scheme_type];
            const budget = Number(item.total_budget_inr);
            const approved = Number(item.approved_amount_inr);
            const disbursed = Number(item.disbursed_amount_inr);
            const approvedPct = pct(approved, budget);
            const disbursedPct = pct(disbursed, budget);
            const remaining = budget - approved;
            return (
              <div key={item.scheme_type} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                    <h4 style={{ margin: 0, color: 'var(--navy)' }}>{SCHEME_LABELS[item.scheme_type]}</h4>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>FY {item.financial_year}</span>
                </div>
                <div style={{ background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden', height: '24px', marginBottom: '0.75rem', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${disbursedPct}%`, background: '#15803D' }} />
                  <div style={{ position: 'absolute', left: `${disbursedPct}%`, top: 0, height: '100%', width: `${approvedPct - disbursedPct}%`, background: color, opacity: 0.7 }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: approvedPct > 50 ? 'white' : 'var(--text)' }}>
                    {approvedPct}% committed
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  <BudgetFigure label="Total Budget" value={fmt(budget)} color="var(--navy)" />
                  <BudgetFigure label="Committed" value={fmt(approved)} color={color} />
                  <BudgetFigure label="Disbursed" value={fmt(disbursed)} color="#15803D" />
                  <BudgetFigure label="Available" value={fmt(remaining)} color={remaining > 0 ? '#0369A1' : '#DC2626'} />
                </div>
                {remaining <= 0 && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#FEF2F2', borderRadius: '6px', fontSize: '0.8rem', color: '#DC2626', fontWeight: 500 }}>
                    ⚠️ Budget fully committed — new applications will be waitlisted
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

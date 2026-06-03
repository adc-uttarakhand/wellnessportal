import { useState, useEffect } from 'react';
import { adminApi } from '../utils/api';
import { DISTRICTS } from '../types';

type RegTab = 'centres' | 'professionals';

export default function AdminRegistrationsPage() {
  const [tab, setTab] = useState<RegTab>('centres');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => { fetchData(); }, [tab]);

  async function fetchData() {
    setLoading(true); setError('');
    try {
      const res = await adminApi.registrations();
      const all = Array.isArray(res.data) ? res.data : (res.data[tab] || []);
      setData(all);
    } catch { setError('Failed to load registrations.'); }
    finally { setLoading(false); }
  }

  async function toggleVerify(id: number, type: 'centre' | 'professional') {
    setActionLoading(id);
    try { await adminApi.verify(type, id); fetchData(); }
    catch { setError('Failed to update.'); }
    finally { setActionLoading(null); }
  }

  const filtered = data.filter(item => {
    const name = String(item.centre_name || item.full_name || '').toLowerCase();
    const district = String(item.district || '');
    return (!search || name.includes(search.toLowerCase())) && (!districtFilter || district === districtFilter);
  });

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--navy)' }}>Registration Verification</h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Verify Yoga Centres and Professionals before they can apply for schemes
        </p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
        {(['centres', 'professionals'] as RegTab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setSearch(''); setDistrictFilter(''); }}
            style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, color: tab === t ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-2px', fontSize: '0.9rem' }}>
            {t === 'centres' ? '🏛️ Yoga Centres' : '🧘 Professionals'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input className="form-input" style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}
          placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-input" style={{ width: '180px' }} value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
          <option value="">All Districts</option>
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={() => { setSearch(''); setDistrictFilter(''); }}>Clear</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No registrations found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((item) => {
            const id = Number(item.id);
            const name = String(item.centre_name || item.full_name || '');
            const district = String(item.district || '');
            const isVerified = Boolean(item.is_verified);
            const phone = String(item.contact_mobile || item.mobile || '');
            const centreType = item.centre_type ? String(item.centre_type) : null;
            const ycbLevel = item.ycb_level ? String(item.ycb_level).replace('_', ' ') : null;
            const experience = item.years_experience !== undefined ? String(item.years_experience) : null;
            const type: 'centre' | 'professional' = tab === 'centres' ? 'centre' : 'professional';

            return (
              <div key={id} className="card" style={{ border: isVerified ? '1px solid #86EFAC' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: '1rem' }}>{name}</h4>
                      <span style={{ padding: '0.15rem 0.6rem', borderRadius: '12px', background: isVerified ? '#DCFCE7' : '#FEF3C7', color: isVerified ? '#15803D' : '#B45309', fontSize: '0.75rem', fontWeight: 600 }}>
                        {isVerified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span>📍 {district}</span>
                      {phone && <span>📱 {phone}</span>}
                      {centreType && <span>🏷️ {centreType}</span>}
                      {ycbLevel && <span>🏅 YCB {ycbLevel}</span>}
                      {experience && <span>⏱️ {experience} yrs exp.</span>}
                    </div>
                  </div>
                  <button className="btn"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', background: isVerified ? '#FEE2E2' : '#DCFCE7', color: isVerified ? '#DC2626' : '#15803D', border: `1px solid ${isVerified ? '#FCA5A5' : '#86EFAC'}` }}
                    onClick={() => toggleVerify(id, type)} disabled={actionLoading === id}>
                    {actionLoading === id ? '...' : isVerified ? 'Revoke' : 'Verify ✓'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

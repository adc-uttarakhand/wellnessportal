import { useState, useEffect } from 'react';
import { DISTRICTS } from '../types';

interface Centre {
  id: number;
  centre_name: string;
  district: string;
  centre_type: string;
  address: string;
  contact_person: string;
  contact_mobile: string;
  capacity_per_session: number;
  is_verified: boolean;
  created_at: string;
}

export default function YogaCentreDirectoryPage() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  useEffect(() => { fetchCentres(); }, []);

  async function fetchCentres() {
    try {
      const res = await fetch('/api/registrations/yoga-centre/public');
      const data = await res.json();
      setCentres(data);
    } catch { setCentres([]); }
    finally { setLoading(false); }
  }

  const filtered = centres.filter(c => {
    const matchSearch = !search || c.centre_name.toLowerCase().includes(search.toLowerCase()) || c.address?.toLowerCase().includes(search.toLowerCase());
    const matchDist = !districtFilter || c.district === districtFilter;
    return matchSearch && matchDist;
  });

  const byDistrict = DISTRICTS.reduce((acc, d) => {
    acc[d] = filtered.filter(c => c.district === d);
    return acc;
  }, {} as Record<string, Centre[]>);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--navy)' }}>
          🏛️ Uttarakhand Yoga Centre Registry
        </h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Registered Yoga Centres under Uttarakhand Yoga Policy 2025 — {centres.length} centres registered
        </p>
      </div>

      {/* Stats by district */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{centres.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Registered</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#15803D' }}>{centres.filter(c => c.is_verified).length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0369A1' }}>{DISTRICTS.filter(d => centres.some(c => c.district === d)).length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Districts Covered</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7C3AED' }}>{centres.reduce((s, c) => s + (c.capacity_per_session || 0), 0)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Capacity</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input className="form-input" style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}
          placeholder="Search by name or address..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-input" style={{ width: '180px' }} value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
          <option value="">All Districts</option>
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={() => { setSearch(''); setDistrictFilter(''); }}>Clear</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading directory...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
          <p>No yoga centres found</p>
        </div>
      ) : districtFilter ? (
        // Single district view
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(c => <CentreCard key={c.id} centre={c} />)}
        </div>
      ) : (
        // District-wise view
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {DISTRICTS.filter(d => byDistrict[d]?.length > 0).map(district => (
            <div key={district}>
              <h3 style={{ margin: '0 0 0.75rem', color: 'var(--navy)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📍 {district}
                <span style={{ fontSize: '0.75rem', background: 'var(--primary)20', color: 'var(--primary)', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 400 }}>
                  {byDistrict[district].length} centres
                </span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
                {byDistrict[district].map(c => <CentreCard key={c.id} centre={c} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CentreCard({ centre }: { centre: Centre }) {
  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: '0.95rem' }}>{centre.centre_name}</h4>
        <span style={{ padding: '0.15rem 0.6rem', borderRadius: '12px', background: centre.is_verified ? '#DCFCE7' : '#FEF3C7', color: centre.is_verified ? '#15803D' : '#B45309', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0, marginLeft: '0.5rem' }}>
          {centre.is_verified ? '✓ Verified' : '⏳ Pending'}
        </span>
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {centre.centre_type && <span>🏷️ {centre.centre_type}</span>}
        {centre.address && <span>📍 {centre.address}</span>}
        {centre.contact_person && <span>👤 {centre.contact_person}</span>}
        {centre.contact_mobile && <span>📱 {centre.contact_mobile}</span>}
        {centre.capacity_per_session && <span>👥 Capacity: {centre.capacity_per_session} per session</span>}
      </div>
    </div>
  );
}

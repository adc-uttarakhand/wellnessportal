import { useState, useEffect } from 'react';
import { adminApi } from '../utils/api';
import { DISTRICTS } from '../types';

type RegTab = 'centres' | 'professionals';

interface YogaCentre {
  id: string; centre_name: string; district: string; centre_type: string;
  contact_person: string; contact_phone: string; established_year?: string;
  capacity?: number; is_verified: boolean; created_at: string;
  owner?: { name: string; email: string };
  description?: string;
}

interface YogaProfessional {
  id: string; full_name: string; district: string; highest_ycb_level?: number;
  years_experience?: number; specializations?: string;
  phone: string; is_verified: boolean; created_at: string;
  user?: { name: string; email: string };
  gender?: string; bio?: string;
}

export default function AdminRegistrationsPage() {
  const [tab, setTab] = useState<RegTab>('centres');
  const [centres, setCentres] = useState<YogaCentre[]>([]);
  const [professionals, setProfessionals] = useState<YogaProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, [tab]);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      if (tab === 'centres') {
        const res = await adminApi.get('/registrations/centres');
        setCentres(res.data);
      } else {
        const res = await adminApi.get('/registrations/professionals');
        setProfessionals(res.data);
      }
    } catch {
      setError('Failed to load registrations.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleVerify(id: string, type: RegTab, current: boolean) {
    setActionLoading(id);
    try {
      await adminApi.patch(`/registrations/${type === 'centres' ? 'centre' : 'professional'}/${id}/verify`, {
        is_verified: !current,
      });
      if (type === 'centres') {
        setCentres(prev => prev.map(c => c.id === id ? { ...c, is_verified: !current } : c));
      } else {
        setProfessionals(prev => prev.map(p => p.id === id ? { ...p, is_verified: !current } : p));
      }
    } catch {
      setError('Failed to update verification status.');
    } finally {
      setActionLoading(null);
    }
  }

  const filteredCentres = centres.filter(c => {
    const matchSearch = !search || c.centre_name.toLowerCase().includes(search.toLowerCase()) || c.contact_person?.toLowerCase().includes(search.toLowerCase());
    const matchDist = !districtFilter || c.district === districtFilter;
    const matchVer = verifiedFilter === '' ? true : verifiedFilter === 'verified' ? c.is_verified : !c.is_verified;
    return matchSearch && matchDist && matchVer;
  });

  const filteredProfs = professionals.filter(p => {
    const matchSearch = !search || p.full_name.toLowerCase().includes(search.toLowerCase());
    const matchDist = !districtFilter || p.district === districtFilter;
    const matchVer = verifiedFilter === '' ? true : verifiedFilter === 'verified' ? p.is_verified : !p.is_verified;
    return matchSearch && matchDist && matchVer;
  });

  const pendingCentres = centres.filter(c => !c.is_verified).length;
  const pendingProfs = professionals.filter(p => !p.is_verified).length;

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--navy)' }}>Registration Verification</h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Verify Yoga Centres and Professionals before they can apply for schemes
        </p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
        {(['centres', 'professionals'] as RegTab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setSearch(''); setDistrictFilter(''); setVerifiedFilter(''); }}
            style={{ padding: '0.75rem 1.5rem', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: tab === t ? 700 : 400, color: tab === t ? 'var(--primary)' : 'var(--text-muted)', borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: '-2px', fontSize: '0.9rem', transition: 'all 0.15s' }}>
            {t === 'centres' ? '🏛️ Yoga Centres' : '🧘 Professionals'}
            {t === 'centres' && pendingCentres > 0 && (
              <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.5rem', background: '#FEF2F2', color: '#DC2626', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>{pendingCentres}</span>
            )}
            {t === 'professionals' && pendingProfs > 0 && (
              <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.5rem', background: '#FEF2F2', color: '#DC2626', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>{pendingProfs}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input className="form-input" style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}
          placeholder={`Search ${tab === 'centres' ? 'centre name' : 'professional name'}...`}
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-input" style={{ width: '180px' }} value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
          <option value="">All Districts</option>
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="form-input" style={{ width: '160px' }} value={verifiedFilter} onChange={e => setVerifiedFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending Verification</option>
          <option value="verified">Verified</option>
        </select>
        <button className="btn btn-ghost" onClick={() => { setSearch(''); setDistrictFilter(''); setVerifiedFilter(''); }}>Clear</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading registrations...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tab === 'centres' ? (
            filteredCentres.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No centres found</div>
            ) : filteredCentres.map(centre => (
              <div key={centre.id} className="card" style={{ border: centre.is_verified ? '1px solid #86EFAC' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: '1rem' }}>{centre.centre_name}</h4>
                      <span style={{ padding: '0.15rem 0.6rem', borderRadius: '12px', background: centre.is_verified ? '#DCFCE7' : '#FEF3C7', color: centre.is_verified ? '#15803D' : '#B45309', fontSize: '0.75rem', fontWeight: 600 }}>
                        {centre.is_verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span>📍 {centre.district}</span>
                      <span>🏷️ {centre.centre_type?.replace(/_/g, ' ')}</span>
                      {centre.capacity && <span>👥 Capacity: {centre.capacity}</span>}
                      {centre.established_year && <span>🗓️ Est. {centre.established_year}</span>}
                      <span>📱 {centre.contact_phone}</span>
                    </div>
                    {centre.description && expandedId === centre.id && (
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text)', background: 'var(--bg)', padding: '0.6rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                        {centre.description}
                      </p>
                    )}
                    {centre.owner && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Registered by: {centre.owner.name} ({centre.owner.email})
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      onClick={() => setExpandedId(expandedId === centre.id ? null : centre.id)}>
                      {expandedId === centre.id ? 'Less ▲' : 'Details ▼'}
                    </button>
                    <button
                      className="btn"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', background: centre.is_verified ? '#FEE2E2' : '#DCFCE7', color: centre.is_verified ? '#DC2626' : '#15803D', border: `1px solid ${centre.is_verified ? '#FCA5A5' : '#86EFAC'}` }}
                      onClick={() => toggleVerify(centre.id, 'centres', centre.is_verified)}
                      disabled={actionLoading === centre.id}
                    >
                      {actionLoading === centre.id ? '...' : centre.is_verified ? 'Revoke' : 'Verify ✓'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            filteredProfs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No professionals found</div>
            ) : filteredProfs.map(prof => (
              <div key={prof.id} className="card" style={{ border: prof.is_verified ? '1px solid #86EFAC' : '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: '1rem' }}>{prof.full_name}</h4>
                      <span style={{ padding: '0.15rem 0.6rem', borderRadius: '12px', background: prof.is_verified ? '#DCFCE7' : '#FEF3C7', color: prof.is_verified ? '#15803D' : '#B45309', fontSize: '0.75rem', fontWeight: 600 }}>
                        {prof.is_verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span>📍 {prof.district}</span>
                      {prof.gender && <span>👤 {prof.gender}</span>}
                      {prof.highest_ycb_level && <span>🏅 YCB Level {prof.highest_ycb_level}</span>}
                      {prof.years_experience !== undefined && <span>⏱️ {prof.years_experience} yrs exp.</span>}
                      <span>📱 {prof.phone}</span>
                    </div>
                    {prof.specializations && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Specializations: {prof.specializations}
                      </div>
                    )}
                    {prof.bio && expandedId === prof.id && (
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text)', background: 'var(--bg)', padding: '0.6rem 0.75rem', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                        {prof.bio}
                      </p>
                    )}
                    {prof.user && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Account: {prof.user.name} ({prof.user.email})
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {prof.bio && (
                      <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        onClick={() => setExpandedId(expandedId === prof.id ? null : prof.id)}>
                        {expandedId === prof.id ? 'Less ▲' : 'Bio ▼'}
                      </button>
                    )}
                    <button
                      className="btn"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', background: prof.is_verified ? '#FEE2E2' : '#DCFCE7', color: prof.is_verified ? '#DC2626' : '#15803D', border: `1px solid ${prof.is_verified ? '#FCA5A5' : '#86EFAC'}` }}
                      onClick={() => toggleVerify(prof.id, 'professionals', prof.is_verified)}
                      disabled={actionLoading === prof.id}
                    >
                      {actionLoading === prof.id ? '...' : prof.is_verified ? 'Revoke' : 'Verify ✓'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

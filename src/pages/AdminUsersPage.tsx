import { useState, useEffect } from 'react';
import { adminApi } from '../utils/api';
import { User, DISTRICTS } from '../types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [createForm, setCreateForm] = useState({ full_name: '', email: '', username: '', password: '', role: 'DISTRICT_ADMIN', district: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await adminApi.users();
      setUsers(res.data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(userId: number) {
    setActionLoading(userId);
    try {
      await adminApi.toggleUser(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u } : u));
      fetchUsers();
    } catch {
      setError('Failed to update user status.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreate() {
    setCreateLoading(true);
    setCreateError('');
    try {
      await adminApi.createUser(createForm as unknown as Record<string, unknown>);
      fetchUsers();
      setShowCreateModal(false);
      setCreateForm({ full_name: '', email: '', username: '', password: '', role: 'DISTRICT_ADMIN', district: '' });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setCreateError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setCreateLoading(false);
    }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchDist = !districtFilter || u.district === districtFilter;
    return matchSearch && matchRole && matchDist;
  });

  const roleBadgeColor: Record<string, string> = {
    STATE_ADMIN: '#7C3AED', DISTRICT_ADMIN: '#1D4ED8',
    YOGA_CENTRE: '#0369A1', YOGA_PROFESSIONAL: '#0891B2', APPLICANT: '#374151',
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--navy)' }}>User Management</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{users.length} total users</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Create Admin User</button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input className="form-input" style={{ flex: 1, minWidth: '200px', maxWidth: '320px' }}
          placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-input" style={{ width: '180px' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="STATE_ADMIN">State Admin</option>
          <option value="DISTRICT_ADMIN">District Admin</option>
          <option value="YOGA_CENTRE">Yoga Centre</option>
          <option value="YOGA_PROFESSIONAL">Yoga Professional</option>
          <option value="APPLICANT">Applicant</option>
        </select>
        <select className="form-input" style={{ width: '180px' }} value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
          <option value="">All Districts</option>
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={() => { setSearch(''); setRoleFilter(''); setDistrictFilter(''); }}>Clear</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>District</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No users found</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                  <td>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', background: (roleBadgeColor[u.role] || '#666') + '15', color: roleBadgeColor[u.role] || '#666', fontSize: '0.75rem', fontWeight: 600 }}>
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{u.district || '—'}</td>
                  <td>
                    <button className="btn btn-ghost"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#DC2626', borderColor: '#FCA5A5' }}
                      onClick={() => toggleActive(u.id)}
                      disabled={actionLoading === u.id || u.role === 'STATE_ADMIN'}>
                      {actionLoading === u.id ? '...' : 'Toggle Active'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', width: '480px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Create Admin User</h3>
            {createError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{createError}</div>}
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={createForm.full_name} onChange={e => setCreateForm(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input className="form-input" value={createForm.username} onChange={e => setCreateForm(p => ({ ...p, username: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Temporary Password *</label>
              <input className="form-input" type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-input" value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="DISTRICT_ADMIN">District Admin</option>
                  <option value="STATE_ADMIN">State Admin</option>
                </select>
              </div>
              {createForm.role === 'DISTRICT_ADMIN' && (
                <div className="form-group">
                  <label className="form-label">District *</label>
                  <select className="form-input" value={createForm.district} onChange={e => setCreateForm(p => ({ ...p, district: e.target.value }))}>
                    <option value="">Select</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-ghost" onClick={() => { setShowCreateModal(false); setCreateError(''); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}
                disabled={createLoading || !createForm.full_name || !createForm.email || !createForm.password || !createForm.username}>
                {createLoading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

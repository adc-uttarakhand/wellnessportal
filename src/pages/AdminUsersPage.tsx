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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    name: '', email: '', password: '', role: 'DISTRICT_ADMIN', district: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await adminApi.get('/users');
      setUsers(res.data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(userId: string, currentActive: boolean) {
    setActionLoading(userId);
    try {
      await adminApi.patch(`/users/${userId}`, { is_active: !currentActive });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentActive } : u));
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
      const res = await adminApi.post('/users', createForm);
      setUsers(prev => [res.data, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', role: 'DISTRICT_ADMIN', district: '' });
    } catch (e: any) {
      setCreateError(e.response?.data?.message || 'Failed to create user.');
    } finally {
      setCreateLoading(false);
    }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchDist = !districtFilter || u.district === districtFilter;
    return matchSearch && matchRole && matchDist;
  });

  const roleBadgeColor: Record<string, string> = {
    STATE_ADMIN: '#7C3AED',
    DISTRICT_ADMIN: '#1D4ED8',
    YOGA_CENTRE: '#0369A1',
    YOGA_PROFESSIONAL: '#0891B2',
    APPLICANT: '#374151',
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--navy)' }}>User Management</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {users.length} total users registered on the portal
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Admin User
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          className="form-input"
          style={{ flex: '1', minWidth: '200px', maxWidth: '320px' }}
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
        <button className="btn btn-ghost" onClick={() => { setSearch(''); setRoleFilter(''); setDistrictFilter(''); }}>
          Clear
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {Object.entries(roleBadgeColor).map(([role, color]) => {
          const count = users.filter(u => u.role === role).length;
          if (!count) return null;
          return (
            <span key={role} style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', background: color + '15', color, border: `1px solid ${color}30`, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}
              onClick={() => setRoleFilter(roleFilter === role ? '' : role)}>
              {role.replace(/_/g, ' ')}: {count}
            </span>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading users...</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>District</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No users found</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                  <td>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', background: (roleBadgeColor[u.role] || '#666') + '15', color: roleBadgeColor[u.role] || '#666', fontSize: '0.75rem', fontWeight: 600 }}>
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{u.district || '—'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', background: u.is_active ? '#DCFCE7' : '#FEE2E2', color: u.is_active ? '#15803D' : '#DC2626', fontSize: '0.75rem', fontWeight: 600 }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: u.is_active ? '#DC2626' : '#15803D', borderColor: u.is_active ? '#FCA5A5' : '#86EFAC' }}
                        onClick={() => toggleActive(u.id, u.is_active)}
                        disabled={actionLoading === u.id || u.role === 'STATE_ADMIN'}
                      >
                        {actionLoading === u.id ? '...' : u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', width: '480px', maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 1.25rem', color: 'var(--navy)' }}>Create Admin User</h3>
            {createError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{createError}</div>}
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Dr. Rajesh Kumar" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} placeholder="official email" />
            </div>
            <div className="form-group">
              <label className="form-label">Temporary Password *</label>
              <input className="form-input" type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters" />
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
              <button className="btn btn-primary" onClick={handleCreate} disabled={createLoading || !createForm.name || !createForm.email || !createForm.password}>
                {createLoading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

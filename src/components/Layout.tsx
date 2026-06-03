import React, { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from './common';

interface NavItem { id: string; label: string; icon: ReactNode; roles: string[]; href: string; }

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', roles: ['STATE_ADMIN','DISTRICT_ADMIN','YOGA_CENTRE','YOGA_PROFESSIONAL','APPLICANT'],
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { id: 'registration', label: 'My Registration', href: '/registration', roles: ['YOGA_CENTRE','YOGA_PROFESSIONAL'],
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { id: 'applications', label: 'My Applications', href: '/my-applications', roles: ['APPLICANT','YOGA_CENTRE','YOGA_PROFESSIONAL'],
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
  { id: 'apply', label: 'Apply for Scheme', href: '/applications/new', roles: ['APPLICANT','YOGA_CENTRE','YOGA_PROFESSIONAL'],
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
  { id: 'review', label: 'Review Applications', href: '/applications', roles: ['STATE_ADMIN','DISTRICT_ADMIN'],
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
  { id: 'registrations', label: 'Registrations', href: '/admin/registrations', roles: ['STATE_ADMIN','DISTRICT_ADMIN'],
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { id: 'users', label: 'User Management', href: '/admin/users', roles: ['STATE_ADMIN'],
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
  { id: 'budget', label: 'Budget & Reports', href: '/admin/budget', roles: ['STATE_ADMIN'],
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
];

interface LayoutProps { children: ReactNode; currentPath: string; onNavigate: (path: string) => void; }

export function AppLayout({ children, currentPath, onNavigate }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const visibleNav = NAV_ITEMS.filter(item => user && item.roles.includes(user.role));

  const roleLabel: Record<string, string> = {
    STATE_ADMIN: 'State Admin',
    DISTRICT_ADMIN: `District Admin${user?.district ? ` — ${user.district}` : ''}`,
    YOGA_CENTRE: 'Yoga Centre', YOGA_PROFESSIONAL: 'Yoga Professional', APPLICANT: 'Applicant',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="px-4 py-5 border-b border-gray-100">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">YP</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 leading-tight">Yoga Policy Portal</p>
                <p className="text-xs text-gray-400 leading-tight">Uttarakhand 2025</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-green-700 rounded-xl flex items-center justify-center mx-auto">
              <span className="text-white text-xs font-bold">YP</span>
            </div>
          )}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleNav.map(item => (
            <button key={item.id} onClick={() => onNavigate(item.href)} title={!sidebarOpen ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${currentPath.startsWith(item.href) ? 'bg-green-50 text-green-700 font-medium border-r-2 border-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
        {sidebarOpen && user && (
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-800 truncate">{user.full_name}</p>
            <p className="text-xs text-gray-400 truncate">{roleLabel[user.role] || user.role}</p>
          </div>
        )}
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
              <span>Government of Uttarakhand</span><span>•</span><span>Department of AYUSH</span>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="hidden md:inline">Logout</span>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export function ForcePasswordChange({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Min 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('yoga_token')}` },
        body: JSON.stringify({ new_password: password }),
      });
      onSuccess();
    } catch { setError('Failed. Try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Change Your Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-green-700 text-white py-2.5 rounded-lg font-medium text-sm disabled:opacity-50">
            {loading ? 'Saving...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Re-export LoadingSpinner for any imports from this file
export { LoadingSpinner };

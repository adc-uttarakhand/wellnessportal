import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, FileText, PlusCircle, Building2,
  Users, BarChart2, CheckSquare, LogOut, ShieldCheck, Wallet,
} from 'lucide-react';

interface NavItemDef {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
  section?: string;
}

const NAV_ITEMS: NavItemDef[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} />, section: 'main' },
  { label: 'My Applications', path: '/applications', icon: <FileText size={16} />, section: 'main' },
  { label: 'Apply for Incentive', path: '/applications/new/choose', icon: <PlusCircle size={16} />, section: 'main', roles: ['YOGA_CENTRE', 'YOGA_PROFESSIONAL', 'APPLICANT'] },
  { label: 'My Registration', path: '/registration', icon: <Building2 size={16} />, section: 'main', roles: ['YOGA_CENTRE', 'YOGA_PROFESSIONAL'] },
  { label: 'Yoga Centre Directory', path: '/yoga-centres', icon: <Building2 size={16} />, section: 'main' },
  { label: 'All Applications', path: '/applications', icon: <FileText size={16} />, section: 'admin', roles: ['STATE_ADMIN', 'DISTRICT_ADMIN'] },
  { label: 'Registrations', path: '/admin/registrations', icon: <CheckSquare size={16} />, section: 'admin', roles: ['STATE_ADMIN', 'DISTRICT_ADMIN'] },
  { label: 'Budget Tracker', path: '/admin/budget', icon: <Wallet size={16} />, section: 'admin', roles: ['STATE_ADMIN', 'DISTRICT_ADMIN'] },
  { label: 'User Management', path: '/admin/users', icon: <Users size={16} />, section: 'admin', roles: ['STATE_ADMIN'] },
  { label: 'Reports', path: '/admin/reports', icon: <BarChart2 size={16} />, section: 'admin', roles: ['STATE_ADMIN', 'DISTRICT_ADMIN'] },
];

const ROLE_LABELS: Record<string, string> = {
  STATE_ADMIN: 'State Administrator',
  DISTRICT_ADMIN: 'District Administrator',
  YOGA_CENTRE: 'Yoga Centre',
  YOGA_PROFESSIONAL: 'Yoga Professional',
  APPLICANT: 'Applicant',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredNav = NAV_ITEMS.filter(item =>
    !item.roles || (user && item.roles.includes(user.role))
  );

  const mainNav = filteredNav.filter(n => n.section === 'main');
  const adminNav = filteredNav.filter(n => n.section === 'admin');

  const isActive = (path: string) => location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const pageTitle = (() => {
    const p = location.pathname;
    if (p === '/dashboard') return 'Dashboard';
    if (p.includes('applications/new')) return 'New Application';
    if (p.includes('applications')) return 'Applications';
    if (p.includes('admin/users')) return 'User Management';
    if (p.includes('admin/budget')) return 'Budget Tracker';
    if (p.includes('admin/registrations')) return 'Registrations';
    if (p.includes('registration')) return 'My Registration';
    return 'Portal';
  })();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="emblem">🏔️</div>
          <h2>उत्तराखण्ड योग नीति पोर्टल</h2>
          <p>Yoga Policy 2025 · AYUSH Dept.</p>
        </div>

        <nav className="sidebar-nav">
          {mainNav.length > 0 && (
            <>
              <div className="nav-section-label">Menu</div>
              {mainNav.map(item => (
                <div
                  key={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.icon}
                  {item.label}
                </div>
              ))}
            </>
          )}

          {adminNav.length > 0 && (
            <>
              <div className="nav-section-label">Administration</div>
              {adminNav.map(item => (
                <div
                  key={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.icon}
                  {item.label}
                </div>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">{getInitials(user?.full_name || 'U')}</div>
            <div className="user-info">
              <div className="user-name">{user?.full_name}</div>
              <div className="user-role">{ROLE_LABELS[user?.role || ''] || user?.role}</div>
            </div>
          </div>
          <button className="logout-btn" style={{marginBottom:"6px", background:"transparent", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.8)"}} onClick={() => navigate("/change-password")}>🔐 Change Password</button>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">{pageTitle}</div>
          <div className="topbar-actions">
            {user?.district && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--sky)', padding: '4px 10px', borderRadius: 20 }}>
                📍 {user.district}
              </span>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <ShieldCheck size={13} color="var(--green-uk)" />
              {user?.role}
            </span>
          </div>
        </div>

        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

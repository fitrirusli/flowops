import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Building2,
  ChevronDown,
  FileText,
  GitBranch,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useSession } from './SessionContext';
import { Avatar, ErrorMessage, Logo } from '../components/ui';
import { date } from '../lib/format';

export default function Layout() {
  const { user, organization, logout, selectOrganization } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [error, setError] = useState(null);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const admin = organization.roles.includes('administrator');
  const auditor = organization.roles.includes('auditor');
  const requester = organization.roles.includes('requester');
  const approver = organization.roles.includes('approver');
  const links = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/requests', label: requester ? 'My requests' : 'Requests', icon: FileText },
    ...(approver ? [{ to: '/inbox', label: 'Approval inbox', icon: Inbox }] : []),
  ];
  async function signOut() {
    setSigningOut(true);
    setError(null);
    try {
      await logout();
      navigate('/');
    } catch (failure) {
      setError(failure);
      setSigningOut(false);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobileOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Logo dark />
          <button
            className="mobile-close icon-button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-picker">
          <span className="workspace-icon">
            <Building2 size={19} />
          </span>
          <div>
            <small>WORKSPACE</small>
            <label className="sr-only" htmlFor="organization-select">
              Choose organization
            </label>
            <select
              id="organization-select"
              value={organization.id}
              onChange={async (event) => {
                await selectOrganization(event.target.value);
                navigate('/');
                setMobileOpen(false);
              }}
            >
              {user.organizations.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <ChevronDown size={14} />
        </div>
        {requester && (
          <NavLink
            className="button button-primary new-request-button"
            to="/requests/new"
            onClick={() => setMobileOpen(false)}
          >
            <Plus size={17} />
            New request
          </NavLink>
        )}
        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/' || to === '/requests'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="nav-label management-label">MANAGEMENT</div>
        <nav className="main-nav" aria-label="Workspace management">
          <NavLink
            to="/policies"
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            onClick={() => setMobileOpen(false)}
          >
            <GitBranch size={18} />
            Approval policy
          </NavLink>
          {admin && (
            <NavLink
              to="/members"
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              onClick={() => setMobileOpen(false)}
            >
              <Users size={18} />
              Members & roles
            </NavLink>
          )}
          {(admin || auditor) && (
            <NavLink
              to="/activity"
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              onClick={() => setMobileOpen(false)}
            >
              <Activity size={18} />
              Audit history
            </NavLink>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-note">
            <ShieldCheck size={20} />
            <strong>Your workspace, protected.</strong>
            <p>Requests and decisions stay within your organization.</p>
          </div>
          <NavLink className="sidebar-help" to="/guide" onClick={() => setMobileOpen(false)}>
            <BookOpen size={17} />
            Workspace guide
            <ArrowUpRight size={14} />
          </NavLink>
          <div className="sidebar-profile">
            <Avatar name={user.name} />
            <div>
              <strong>{user.name}</strong>
              <span>
                {admin
                  ? 'Administrator'
                  : approver
                    ? 'Approver'
                    : auditor
                      ? 'Auditor'
                      : 'Requester'}
              </span>
            </div>
            <button
              className="icon-button"
              aria-label="Sign out"
              title="Sign out"
              disabled={signingOut}
              onClick={signOut}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb-root">Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <span>{organization.name}</span>
          </div>
          <div className="topbar-right">
            <span className="workspace-live">
              <span />
              Workspace active
            </span>
            <span className="topbar-date">{date(new Date())}</span>
            <Avatar name={user.name} size="small" />
          </div>
        </header>
        <main id="main-content" className="page-content" key={organization.id}>
          <ErrorMessage error={error} />
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>
            FlowOps <span>·</span> Purchase approval engine
          </span>
          <span>Every decision has a clear path.</span>
        </footer>
      </div>
    </div>
  );
}

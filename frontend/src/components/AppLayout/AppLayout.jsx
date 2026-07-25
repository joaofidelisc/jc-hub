import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AppLayout.css';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    path: '/instagram/setup',
    label: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0"/>
      </svg>
    ),
  },
  {
    path: '/messenger/setup',
    label: 'Messenger',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    path: '/instagram/keywords',
    label: 'Automações',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Perfil',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

const AppLayout = ({ children, title, subtitle, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return false;
    const stored = localStorage.getItem('sidebarOpen');
    return stored !== null ? stored === 'true' : true;
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleDesktopSidebar = () => {
    setSidebarOpen(prev => {
      localStorage.setItem('sidebarOpen', String(!prev));
      return !prev;
    });
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(prev => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    toast.success('Logout realizado com sucesso!');
    navigate('/login', { replace: true });
  };

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const SidebarContent = () => (
    <>
      <div className="sidebar-header">
        <Link to="/" className="brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor"/>
            </svg>
          </div>
          <span className="brand-text">Simplifica.AI</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item) ? 'active' : ''}`}
            title={!sidebarOpen ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={handleLogout} title={!sidebarOpen ? 'Sair' : undefined}>
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </span>
          <span className="nav-label">Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className={`sidebar desktop-sidebar ${sidebarOpen ? 'expanded' : 'collapsed'}`}>
        <SidebarContent />
        <button className="sidebar-collapse-btn" onClick={toggleDesktopSidebar} aria-label="Toggle sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {sidebarOpen
              ? <path d="M15 18l-6-6 6-6"/>
              : <path d="M9 18l6-6-6-6"/>
            }
          </svg>
        </button>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-label="Close sidebar"/>
      )}
      <aside className={`sidebar mobile-sidebar ${mobileOpen ? 'open' : ''}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className={`main-wrapper ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        <header className="topbar">
          {/* Mobile menu toggle */}
          <button className="mobile-menu-btn" onClick={toggleMobileSidebar} aria-label="Open menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>

          <div className="topbar-title">
            {title && <h1 className="page-title">{title}</h1>}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>

          {user && (
            <Link to="/profile" className="topbar-user">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="user-name">{user.name}</span>
            </Link>
          )}
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AppLayout.css';



const AppLayout = ({ children, title, subtitle, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
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
      path: '/criador-ia',
      label: 'Nova (Criador IA)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
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

  if (user?.role === 'superadmin') {
    navItems.push({
      path: '/admin',
      label: 'Admin',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
    });
  }

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
              <rect x="3" y="8" width="18" height="12" rx="2" fill="currentColor" opacity=".3"/>
              <path d="M8 8V6a4 4 0 118 0v2M12 13v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-text">JC Hub</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
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
    <div className="app-layout dark-theme">
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

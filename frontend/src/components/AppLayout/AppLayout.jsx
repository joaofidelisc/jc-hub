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
      path: '/planejamentos',
      label: 'Planejamentos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
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
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const toggleDesktopSidebar = () => {
    setSidebarOpen(prev => {
      localStorage.setItem('sidebarOpen', String(!prev));
      return !prev;
    });
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(prev => !prev);
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    }
  }, [theme]);

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

  const BrandLogo = () => (
    <Link to="/" className="brand">
      <div className="brand-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </div>
      <span className="brand-text">JC Hub</span>
    </Link>
  );

  const SidebarContent = () => (
    <>
      <div className="sidebar-profile">
        <div className="sidebar-profile-avatar">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="sidebar-profile-info">
          <span className="sidebar-profile-name">{user?.name || 'Usuário'}</span>
          <span className="sidebar-profile-role">{user?.role === 'superadmin' ? 'Super Admin' : 'Criador'}</span>
        </div>
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
    </>
  );

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="topbar-brand-container">
          <BrandLogo />
        </div>
        
        <div className="topbar-main">
          <button className="mobile-menu-btn" onClick={toggleMobileSidebar} aria-label="Open menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <div className="topbar-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Buscar projetos..." />
          </div>

          <div className="topbar-actions">
            {user && (
              <div className="topbar-user-dropdown">
                <div className="user-avatar-small">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="user-name-small">{user.name?.split(' ')[0]}</span>
              </div>
            )}
            
            <button className="icon-btn" onClick={handleLogout} title="Sair">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="app-body">
        {/* Desktop Sidebar */}
        <aside className={`sidebar desktop-sidebar ${sidebarOpen ? 'expanded' : 'collapsed'}`}>
          <SidebarContent />
          <button className="sidebar-collapse-btn desktop-only" onClick={toggleDesktopSidebar} aria-label="Toggle sidebar">
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

        {/* Main Content */}
        <div className={`main-wrapper ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
          <div className="page-header">
            {title && (
              <div className="page-title-group">
                <span className="page-title-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                </span>
                <h1 className="page-title">{title}</h1>
              </div>
            )}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>

          <main className="page-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;

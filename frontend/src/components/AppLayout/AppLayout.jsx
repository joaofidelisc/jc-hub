import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AppLayout.css';

const icons = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  create: <><path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8L12 3z"/><path d="M19 15l.9 2.2L22 18l-2.1.8L19 21l-.9-2.2L16 18l2.1-.8L19 15z"/></>,
  week: <><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="18" cy="18" r="2"/></>,
  whatsapp: <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>,
  instagram: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  business: <><path d="M3 21h18M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6M9 10h.01M15 10h.01"/></>,
  profile: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  admin: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></>,
};

const SvgIcon = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

function AppLayout({ children, title, subtitle, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const mainItems = [
    { path: '/', label: 'Visão geral', icon: icons.dashboard, end: true },
    { path: '/criador-ia', label: 'Criar planejamento', icon: icons.create },
    { path: '/planejamentos', label: 'Planejamentos', icon: icons.calendar },
    { path: '/minha-semana', label: 'Minha semana', icon: icons.week },
    { path: '/whatsapp-inteligente', label: 'WhatsApp IA', icon: icons.whatsapp },
    { path: '/instagram-inteligente', label: 'Instagram IA', icon: icons.instagram },
    { path: '/meu-negocio', label: 'Meu negócio', icon: icons.business },
  ];

  const accountItems = [{ path: '/profile', label: 'Minha conta', icon: icons.profile }];
  if (user?.role === 'superadmin') accountItems.push({ path: '/admin', label: 'Administração', icon: icons.admin });

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    toast.success('Você saiu da sua conta.');
    navigate('/login', { replace: true });
  };

  const renderItems = (items) => items.map(item => (
    <NavLink key={item.path} to={item.path} end={item.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-icon"><SvgIcon>{item.icon}</SvgIcon></span>
      <span>{item.label}</span>
    </NavLink>
  ));

  const sidebar = (
    <>
      <Link to="/" className="brand" aria-label="JC Hub - início">
        <span className="brand-icon"><span>JC</span></span>
        <span className="brand-copy"><strong>JC Hub</strong><small>Content Studio</small></span>
      </Link>
      <nav className="sidebar-nav" aria-label="Navegação principal">
        <p className="nav-section-label">Workspace</p>
        {renderItems(mainItems)}
        <p className="nav-section-label account-label">Conta</p>
        {renderItems(accountItems)}
      </nav>
      <div className="sidebar-user">
        <Link to="/profile" className="sidebar-user-link">
          <span className="sidebar-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          <span className="sidebar-user-copy"><strong>{user?.name || 'Usuário'}</strong><small>{user?.role === 'superadmin' ? 'Super Admin' : 'Criador'}</small></span>
        </Link>
        <button type="button" className="logout-button" onClick={handleLogout} title="Sair" aria-label="Sair">
          <SvgIcon><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></SvgIcon>
        </button>
      </div>
    </>
  );

  return (
    <div className="app-layout">
      <aside className="sidebar desktop-sidebar">{sidebar}</aside>
      {mobileOpen && <button className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" />}
      <aside className={`sidebar mobile-sidebar ${mobileOpen ? 'open' : ''}`}>{sidebar}</aside>
      <div className="main-wrapper">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <SvgIcon><path d="M4 6h16M4 12h16M4 18h16"/></SvgIcon>
          </button>
          <div className="topbar-heading"><h1>{title || 'Visão geral'}</h1>{subtitle && <p>{subtitle}</p>}</div>
          <div className="topbar-actions">
            <span className="workspace-status"><i /> IA disponível</span>
            <Link to="/profile" className="topbar-profile" aria-label="Abrir minha conta">
              <span className="topbar-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              <span><strong>{user?.name?.split(' ')[0] || 'Usuário'}</strong><small>{user?.email || 'Minha conta'}</small></span>
            </Link>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;

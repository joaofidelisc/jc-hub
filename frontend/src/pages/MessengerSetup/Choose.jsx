import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Choose.css';

const ChooseSetup = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login', { replace: true });
          return;
        }

        const { data } = await axios.get('/api/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!data?.user) {
          navigate('/login', { replace: true });
          return;
        }

        setUser(data.user);
      } catch (error) {
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    toast.success('Logout realizado com sucesso!');
    navigate('/login', { replace: true });
  };

  const onContinue = () => {
    navigate(`/messenger/setup`);
  };

  if (loading) {
    return (
      <div className="choose-loading">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="choose-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="brand">
            <svg className="brand-icon" viewBox="0 0 24 24" fill="none">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor"/>
            </svg>
            {sidebarOpen && <span className="brand-text">JC Hub</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className="nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span className="nav-label">Dashboard</span>}
          </Link>
          <Link to="/instagram/setup" className="nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {sidebarOpen && <span className="nav-label">Integração Instagram</span>}
          </Link>
          <Link to="/messenger/setup" className="nav-item active">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
                <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span className="nav-label">Integração Messenger</span>}
          </Link>
          <Link to="/instagram/keywords" className="nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span className="nav-label">Automações</span>}
          </Link>
          <Link to="/profile" className="nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span className="nav-label">Perfil</span>}
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span className="nav-label">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`choose-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Top Bar */}
        <header className="choose-header">
          <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">Configurar Integração com Messenger</h1>
              <p className="page-subtitle">Siga os passos para conectar sua página do Facebook</p>
            </div>
            <Link to="/profile" className="user-info">
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="user-name">{user?.name || 'Usuário'}</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="choose-content">
          {/* Hero Section */}
          <div className="choose-hero">
            <div className="hero-badge">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Configuração Inicial</span>
            </div>
            <h1 className="hero-title">Automação para Messenger</h1>
            <p className="hero-description">
              Conecte sua página do Facebook para automatizar respostas e interagir com seus clientes no Messenger.
            </p>
          </div>

          {/* Info Banner */}
          <div className="info-banner">
            <svg className="info-icon" viewBox="0 0 24 24" fill="none">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="info-content">
              <strong>Primeira vez configurando?</strong>
              <span>
                Confira nosso <Link to="/messenger/instructions-detailed" className="info-link">
                  guia completo passo a passo
                </Link>
              </span>
            </div>
          </div>

          <div className="choose-actions">
            <Link to="/" className="btn btn-secondary">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke="currentColor" strokeWidth="2" 
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Voltar
            </Link>
            <button className="btn btn-primary" type="button" onClick={onContinue}>
              <span>Continuar</span>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke="currentColor" strokeWidth="2" 
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChooseSetup;

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
  const [mode, setMode] = useState('both');

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
    navigate(`/instagram/setup/tokens?mode=${mode}`);
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
          <Link to="/instagram/setup" className="nav-item active">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {sidebarOpen && <span className="nav-label">Integração Instagram</span>}
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
              <h1 className="page-title">Configurar Integração</h1>
              <p className="page-subtitle">Escolha o tipo de automação para sua conta</p>
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
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Configuração Inicial</span>
            </div>
            <h1 className="hero-title">Tipo de Automação</h1>
            <p className="hero-description">
              Selecione como deseja automatizar suas interações no Instagram
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
                Confira nosso <Link to="/instagram/instructions-detailed" className="info-link">
                  guia completo passo a passo
                </Link>
              </span>
            </div>
          </div>

          {/* Options Grid */}
          <div className="automation-grid">
            {/* Option 1: Comments */}
            <label className={`automation-card ${mode === 'comments' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="mode"
                value="comments"
                checked={mode === 'comments'}
                onChange={() => setMode('comments')}
                className="automation-radio"
              />
              
              <div className="card-header-section">
                <div className="card-icon-wrapper">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <div className="card-check">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" 
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="card-content">
                <h3 className="card-title">Respostas em Comentários</h3>
                <p className="card-description">
                  Responda automaticamente a comentários em seus posts usando palavras-chave personalizadas
                </p>

                <ul className="card-features">
                  <li>
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" 
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Detecção por palavras-chave
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" 
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Respostas personalizadas
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" 
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Engajamento instantâneo
                  </li>
                </ul>
              </div>
            </label>

            {/* Option 2: Direct Messages */}
            <label className={`automation-card ${mode === 'direct' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="mode"
                value="direct"
                checked={mode === 'direct'}
                onChange={() => setMode('direct')}
                className="automation-radio"
              />
              
              <div className="card-header-section">
                <div className="card-icon-wrapper">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <div className="card-check">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" 
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="card-content">
                <h3 className="card-title">Mensagens Diretas</h3>
                <p className="card-description">
                  Envie mensagens diretas automáticas para seus seguidores com base em interações
                </p>

                <ul className="card-features">
                  <li>
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" 
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Mensagens personalizadas
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" 
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Botões de ação customizados
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" 
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Conversão otimizada
                  </li>
                </ul>
              </div>
            </label>

            {/* Option 3: Both */}
            <label className={`automation-card ${mode === 'both' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="mode"
                value="both"
                checked={mode === 'both'}
                onChange={() => setMode('both')}
                className="automation-radio"
              />
              
              <div className="card-header-section">
                <div className="card-icon-wrapper card-icon-featured">
                  <div className="card-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="featured-badge">Recomendado</span>
                </div>
                
                <div className="card-check">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" 
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="card-content">
                <h3 className="card-title">Automação Completa</h3>
                <p className="card-description">
                  Configure comentários e mensagens diretas juntos para máxima eficiência
                </p>

                <ul className="card-features">
                  <li>
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" 
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Todos os recursos incluídos
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" 
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Engajamento maximizado
                  </li>
                  <li>
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" 
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Melhor custo-benefício
                  </li>
                </ul>
              </div>
            </label>
          </div>

          {/* Actions */}
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

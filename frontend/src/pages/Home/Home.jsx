import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AppLayout from '../../components/AppLayout/AppLayout';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalRules: 0, activeRules: 0, aiEnabled: false });
  const [messengerStats, setMessengerStats] = useState({ configured: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { navigate('/login', { replace: true }); return; }

        const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!data?.user) { navigate('/login', { replace: true }); return; }
        setUser(data.user);

        const [keywordsRes, statusRes, messengerStatusRes] = await Promise.all([
          axios.get(`/api/ig/instagram/keywords?user_id=${data.user.id}`),
          axios.get(`/api/ig/instagram/status?user_id=${data.user.id}`),
          axios.get(`/api/ig/messenger/status?user_id=${data.user.id}`),
        ]);

        const items = keywordsRes.data.items || [];
        setStats({
          totalRules: items.length,
          activeRules: items.filter(i => i.active).length,
          aiEnabled: statusRes.data.allow_ai_direct || false,
        });
        setMessengerStats({ configured: messengerStatusRes.data.configured || false });
      } catch {
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"/>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral da sua automação" user={user}>
      {/* Welcome */}
      <div className="welcome-bar">
        <div>
          <h2 className="welcome-title">Olá, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="welcome-sub">Aqui está o status do seu sistema de automação.</p>
        </div>
        <Link to="/instagram/keywords" className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nova regra
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <div className="stat-body">
            <span className="stat-label">Total de Regras</span>
            <span className="stat-value">{stats.totalRules}</span>
            <span className="stat-note">Instagram</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div className="stat-body">
            <span className="stat-label">Regras Ativas</span>
            <span className="stat-value">{stats.activeRules}</span>
            <span className="stat-note">Em operação</span>
          </div>
        </div>

        <div className="stat-card">
          <div className={`stat-icon-wrap ${messengerStats.configured ? 'success' : 'warning'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <div className="stat-body">
            <span className="stat-label">Messenger</span>
            <span className="stat-value stat-status">{messengerStats.configured ? 'Ativo' : 'Inativo'}</span>
            <span className="stat-note">
              {messengerStats.configured ? 'Integração ativa' : 'Configuração necessária'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className={`stat-icon-wrap ${stats.aiEnabled ? 'success' : 'warning'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div className="stat-body">
            <span className="stat-label">Gemini IA</span>
            <span className="stat-value stat-status">{stats.aiEnabled ? 'Ativo' : 'Inativo'}</span>
            <span className="stat-note">
              {stats.aiEnabled ? 'Respondendo via IA' : 'Configure nas Automações'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <h3 className="section-heading">Ações Rápidas</h3>
      <div className="actions-grid">
        <Link to="/instagram/keywords" className="action-card">
          <div className="action-icon indigo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div className="action-body">
            <h4>Nova Regra de Automação</h4>
            <p>Configure palavras-chave e respostas automáticas para comentários e DMs</p>
          </div>
          <svg className="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14m-7-7l7 7-7 7"/>
          </svg>
        </Link>

        <Link to="/instagram/setup" className="action-card">
          <div className="action-icon violet">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" strokeWidth="0"/>
            </svg>
          </div>
          <div className="action-body">
            <h4>Configurar Instagram</h4>
            <p>Gerencie tokens de acesso e modo de automação para o Instagram</p>
          </div>
          <svg className="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14m-7-7l7 7-7 7"/>
          </svg>
        </Link>

        <Link to="/messenger/setup" className="action-card">
          <div className="action-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <div className="action-body">
            <h4>Integração Messenger</h4>
            <p>Configure a automação para o Messenger da sua página do Facebook</p>
          </div>
          <svg className="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14m-7-7l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </AppLayout>
  );
};

export default Home;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppLayout from '../../components/AppLayout/AppLayout';
import '../InstagramSetup/InstagramSetup.css';
import './MessengerSetup.css';

const MessengerSetup = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [form, setForm] = useState({ pageId: '', verifyToken: '', accessToken: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { navigate('/login', { replace: true }); return; }

        const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!data?.user) { navigate('/login', { replace: true }); return; }
        setUser(data.user);

        const statusRes = await axios.get(`/api/ig/messenger/status?user_id=${data.user.id}`);
        if (statusRes.data.configured) { setConfigured(true); setCurrentStep(3); }
      } catch (error) {
        console.error('Erro ao carregar:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pageId.trim() || !form.verifyToken.trim() || !form.accessToken.trim()) {
      toast.error('Preencha todos os campos obrigatórios'); return;
    }
    setSubmitting(true);
    try {
      await axios.post('/api/ig/messenger/setup', {
        user_id: user.id,
        page_id: form.pageId.trim(),
        verify_token: form.verifyToken.trim(),
        access_token: form.accessToken.trim(),
      });
      toast.success('Integração configurada com sucesso!');
      setConfigured(true); setCurrentStep(3);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Erro ao configurar integração');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner"/><p>Carregando configurações...</p></div>;
  }

  return (
    <AppLayout title="Messenger" subtitle="Configure sua integração com o Messenger" user={user}>
      {/* Progress */}
      <div className="progress-steps">
        {[
          { label: 'Credenciais', desc: 'Page ID e tokens' },
          { label: 'Webhook', desc: 'Configuração no Meta' },
          { label: 'Concluído', desc: 'Integração ativa' },
        ].map((step, i) => (
          <React.Fragment key={i}>
            <div className={`progress-step ${currentStep >= i + 1 ? 'active' : ''} ${currentStep > i + 1 ? 'done' : ''}`}>
              <div className="step-circle">
                {currentStep > i + 1 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                ) : i + 1}
              </div>
              <div className="step-info">
                <span className="step-label">{step.label}</span>
                <span className="step-desc">{step.desc}</span>
              </div>
            </div>
            {i < 2 && <div className="step-line"/>}
          </React.Fragment>
        ))}
      </div>

      {configured && (
        <div className="status-banner success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <strong>Integração Ativa</strong>
            <span>Sua página do Messenger está conectada e funcionando.</span>
          </div>
        </div>
      )}

      <div className="card config-card">
        <form onSubmit={handleSubmit}>
          <div className="config-section">
            <div className="config-section-header">
              <div className="config-section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
              <div>
                <h2 className="config-section-title">Credenciais de Acesso</h2>
                <p className="config-section-sub">Tokens de autenticação da API do Messenger</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Page ID <span className="required">*</span></label>
              <input
                type="text" name="pageId" className="form-input"
                value={form.pageId} onChange={handleChange}
                placeholder="ID numérico da sua Página do Facebook"
                required
              />
              <span className="form-hint">Encontre o ID na seção "Sobre" da sua página do Facebook.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Verify Token <span className="required">*</span></label>
              <input
                type="text" name="verifyToken" className="form-input"
                value={form.verifyToken} onChange={handleChange}
                placeholder="Token secreto para verificação do webhook"
                required
              />
              <span className="form-hint">Defina um token secreto — o mesmo que você configurará no painel Meta.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Access Token <span className="required">*</span></label>
              <textarea
                name="accessToken" className="form-textarea"
                value={form.accessToken} onChange={handleChange}
                placeholder="Token de acesso da página do Facebook"
                rows="4" required
              />
              <span className="form-hint">Token de acesso de longa duração obtido no Facebook App Dashboard.</span>
            </div>
          </div>

          <div className="config-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <><span className="loading-spinner-sm"/>&nbsp;Salvando...</> : (configured ? 'Atualizar Configuração' : 'Salvar e Ativar')}
            </button>
            <Link to="/messenger/instructions" className="btn btn-secondary">Ver Instruções</Link>
          </div>
        </form>
      </div>

      {configured && (
        <div className="next-steps">
          <h3 className="section-heading" style={{marginBottom:'1rem'}}>Próximos Passos</h3>
          <div className="next-steps-grid">
            <Link to="/" className="next-step-card">
              <div className="next-step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div>
                <h4>Voltar ao Dashboard</h4>
                <p>Veja o status geral do seu sistema</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="next-arrow">
                <path d="M5 12h14m-7-7l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default MessengerSetup;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import './InstagramSetup.css';

const InstagramSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasSavedTokens, setHasSavedTokens] = useState(false);
  const [modes, setModes] = useState('both');
  const [clientId, setClientId] = useState('');

  useLayout('Instagram', 'Conecte sua conta do Instagram Profissional em um clique', user);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { navigate('/login', { replace: true }); return; }

        const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!data?.user) { navigate('/login', { replace: true }); return; }
        setUser(data.user);

        // Fetch OAuth client_id
        const configRes = await axios.get('/api/ig/oauth/config');
        setClientId(configRes.data.client_id || '');

        // Check if coming from oauth success
        const urlParams = new URLSearchParams(location.search);
        if (urlParams.get('step') === '3') {
           setHasSavedTokens(true);
           setCurrentStep(2); // In structural terms, our step 2 is Automations
        } else {
           const statusRes = await axios.get(`/api/ig/instagram/status?user_id=${data.user.id}`);
           if (statusRes.data.configured) {
             setHasSavedTokens(true);
             setModes(statusRes.data.modes || 'both');
             setCurrentStep(2); // If already connected, jump to Automations
           }
        }
      } catch (error) {
        console.error('Erro ao carregar:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate, location]);

  const handleFacebookLogin = () => {
    if (!clientId) {
      toast.error('O Aplicativo Meta ainda não foi configurado pelo Administrador.');
      return;
    }
    const redirectUri = `${window.location.protocol}//${window.location.host}/instagram/oauth/callback`;
    const scopes = 'instagram_basic,instagram_manage_comments,instagram_manage_messages,pages_show_list,pages_manage_metadata';
    const authUrl = `https://www.facebook.com/v24.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${user.id}`;
    
    window.location.href = authUrl;
  };

  const handleFinishSetup = async () => {
    setSubmitting(true);
    try {
      // Just update the automation modes using the same setup endpoint
      await axios.post('/api/ig/instagram/setup', {
        user_id: user.id,
        verify_token: 'OAUTH_AUTO',
        access_token: 'OAUTH_AUTO',
        modes: modes,
      });
      toast.success('Configuração finalizada!');
      setCurrentStep(3); // Shows success screen
    } catch(err) {
      toast.error('Erro ao finalizar configuração');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"/>
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <>
      <div className="progress-steps" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Conexão', desc: 'Login com Meta' },
          { label: 'Automação', desc: 'Comportamento' },
          { label: 'Concluído', desc: 'Pronto!' }
        ].map((step, i) => (
          <React.Fragment key={i}>
            <div className={`progress-step ${currentStep >= i + 1 ? 'active' : ''} ${currentStep > i + 1 ? 'done' : ''}`}>
              <div className="step-circle">
                {currentStep > i + 1 ? "✓" : i + 1}
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

      <div className="card config-card">
        {/* === STEP 1: FACEBOOK OAUTH === */}
        {currentStep === 1 && (
          <div className="config-section" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '40px', height: '40px' }}>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#0f172a' }}>Conectar Instagram</h2>
            <p style={{ color: '#475569', maxWidth: '500px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
              Vincule sua conta profissional do Instagram de forma segura através do Facebook. Não precisamos de senhas, apenas sua permissão para interagir via automação.
            </p>
            
            <button 
              onClick={handleFacebookLogin} 
              className="btn btn-primary" 
              style={{ backgroundColor: '#1877f2', borderColor: '#1877f2', padding: '1rem 2rem', fontSize: '1.1rem', display: 'inline-flex', alignItems: 'center' }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" style={{ marginRight: '10px', fill: '#fff' }}>
                <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7h-2.54V12h2.54V9.79c0-2.5 1.5-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.88l-.46 2.95h-2.42v7.01C18.34 21.21 22 17.06 22 12.06c0-5.53-4.5-10.02-10-10.02z"></path>
              </svg>
              Continuar com Facebook
            </button>
            <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
              Certifique-se de vincular a Página do Facebook conectada ao seu Instagram.
            </div>
          </div>
        )}

        {/* === STEP 2: AUTOMATION === */}
        {currentStep === 2 && (
          <div className="config-section">
            <div className="config-section-header">
              <div>
                <h2 className="config-section-title">Passo 2: Modos de Automação</h2>
                <p className="config-section-sub">Sua conta está conectada! Agora, ative as funcionalidades de engajamento automático.</p>
              </div>
            </div>

            <div className="mode-cards" style={{ marginBottom: '2rem' }}>
              {[
                { value: 'comments', label: 'Apenas Comentários', desc: 'Responde postagens do feed' },
                { value: 'messages', label: 'Apenas Mensagens (DM)', desc: 'Responde directs automaticamente' },
                { value: 'both', label: 'Ambos', desc: 'Responder directs e comentários', badge: 'Recomendado' },
              ].map(opt => (
                <label key={opt.value} className={`mode-card ${modes === opt.value ? 'selected' : ''}`}>
                  <input type="radio" value={opt.value} checked={modes === opt.value} onChange={(e) => setModes(e.target.value)}/>
                  <div className="mode-card-body">
                    <span className="mode-title">{opt.label}</span>
                    <span className="mode-desc">{opt.desc}</span>
                    {opt.badge && <span className="mode-badge">{opt.badge}</span>}
                  </div>
                  <div className="mode-check">✓</div>
                </label>
              ))}
            </div>

            <div className="form-actions" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(1)}>Voltar para Conexão</button>
              <button type="button" className="btn btn-primary" onClick={handleFinishSetup} disabled={submitting}>
                {submitting ? 'Finalizando...' : 'Concluir Setup'}
              </button>
            </div>
          </div>
        )}

        {/* === STEP 3: DONE === */}
        {currentStep === 3 && (
          <div className="config-section" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '40px', height: '40px' }}>
                <path d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#0f172a' }}>Integração Concluída!</h2>
            <p style={{ color: '#475569', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: '1.5' }}>
              A automação do Instagram está conectada e ativada. Agora você pode criar as regras de inteligência artificial para interagir com seus seguidores.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyItems: 'center', justifyContent: 'center' }}>
              <Link to="/instagram/keywords" className="btn btn-primary" style={{ flexWrap: 'wrap' }}>
                Gerenciar Automações (Regras e DMs)
              </Link>
              <button onClick={() => setCurrentStep(2)} className="btn btn-secondary">
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InstagramSetup;

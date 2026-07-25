import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './SetupTokens.css';

const SetupTokens = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'both';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [show, setShow] = useState({
    verify: false,
    access: false,
  });

  const [form, setForm] = useState({
    verifyToken: '',
    accessToken: '',
  });

  const [errors, setErrors] = useState({
    verifyToken: '',
    accessToken: '',
  });

  const verifyRef = useRef(null);
  const accessRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return navigate('/login', { replace: true });
        const { data } = await axios.get('/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!data?.user) return navigate('/login', { replace: true });
        setUser(data.user);
      } catch {
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const toggleSidebar = () => setSidebarOpen(o => !o);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    toast.success('Logout realizado');
    navigate('/login', { replace: true });
  };

  const getModeLabel = () => {
    if (mode === 'comments') return 'Apenas Comentários';
    if (mode === 'direct') return 'Apenas Mensagens Diretas';
    return 'Automação Completa';
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
  };

  const validate = useCallback(() => {
    const er = { verifyToken: '', accessToken: '' };
    let ok = true;
    if (!form.verifyToken.trim()) {
      er.verifyToken = 'Verify Token é obrigatório';
      ok = false;
    } else if (form.verifyToken.trim().length < 8) {
      er.verifyToken = 'Mínimo 8 caracteres';
      ok = false;
    }
    if (!form.accessToken.trim()) {
      er.accessToken = 'Access Token é obrigatório';
      ok = false;
    } else if (form.accessToken.trim().length < 20) {
      er.accessToken = 'Token muito curto (possível inválido)';
      ok = false;
    }
    setErrors(er);
    // foco no primeiro erro
    if (!ok) {
      if (er.verifyToken && verifyRef.current) verifyRef.current.focus();
      else if (er.accessToken && accessRef.current) accessRef.current.focus();
    }
    return ok;
  }, [form.verifyToken, form.accessToken]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user?.id) return toast.warn('Usuário inválido.');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await axios.post('/api/ig/instagram/setup', {
        user_id: user.id,
        verify_token: form.verifyToken.trim(),
        access_token: form.accessToken.trim(),
        modes: mode,
      });
      toast.success('Credenciais salvas');
      navigate('/instagram/keywords', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Falha ao salvar.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleShow = (field) =>
    setShow(s => ({ ...s, [field]: !s[field] }));

  const copyWebhook = () => {
    const url = `${window.location.origin}/api/instagram-comment-chat`;
    navigator.clipboard.writeText(url).then(() => toast.success('URL copiada'));
  };

  if (loading) {
    return (
      <div className="tokens-loading">
        <div className="loading-spinner" />
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="tokens-root">
      {/* Sidebar */}
      <aside className={`tokens-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="tsb-header">
          <div className="brand">
            <svg className="brand-icon" viewBox="0 0 24 24" fill="none">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor" />
            </svg>
            {sidebarOpen && <span className="brand-text">Simplifica.AI</span>}
          </div>
        </div>
        <nav className="tsb-nav">
          <Link to="/" className="nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {sidebarOpen && <span className="nav-label">Dashboard</span>}
          </Link>
          <Link to="/instagram/setup" className="nav-item active">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="5"
                stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="4"
                stroke="currentColor" strokeWidth="2" />
            </svg>
            {sidebarOpen && <span className="nav-label">Integração</span>}
          </Link>
          <Link to="/instagram/keywords" className="nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {sidebarOpen && <span className="nav-label">Automações</span>}
          </Link>
          <Link to="/profile" className="nav-item">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {sidebarOpen && <span className="nav-label">Perfil</span>}
          </Link>
        </nav>
        <div className="tsb-footer">
            <button className="nav-item logout-btn" onClick={handleLogout}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {sidebarOpen && <span className="nav-label">Sair</span>}
            </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`tokens-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="tokens-topbar">
          <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Alternar menu">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="topbar-info">
            <div className="topbar-texts">
              <h1 className="page-title">Credenciais de Acesso</h1>
              <p className="page-subtitle">Forneça os tokens para ativar a integração</p>
            </div>
            <Link to="/profile" className="user-pill">
              <div className="user-avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
              <span className="user-name">{user?.name || 'Usuário'}</span>
            </Link>
          </div>
        </header>

        <div className="tokens-content">
          {/* Hero */}
          <div className="tokens-hero">
            <div className="hero-badge">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Etapa 2: Credenciais</span>
            </div>
            <h1 className="hero-title">Tokens de Autenticação</h1>
            <p className="hero-description">
              Forneça os tokens de acesso da API do Instagram para validar o webhook e permitir as automações.
            </p>
          </div>

          {/* Banner ajuda */}
          <section className="help-banner" role="note">
            <svg className="hb-icon" viewBox="0 0 24 24" fill="none">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="hb-text">
              <strong>Precisa de orientação?</strong>
              <span>Consulte o <Link to="/instagram/instructions-detailed" className="hb-link">guia passo a passo</Link>.</span>
            </div>
          </section>

          {/* Card principal */}
          <section className="tokens-card" aria-labelledby="card-title">
            <div className="card-head">
              <div className="ch-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="ch-text">
                <h2 id="card-title" className="card-title">Configuração de Tokens</h2>
                <p className="card-desc">Valores obtidos no painel Meta for Developers.</p>
              </div>
            </div>
            <form onSubmit={submit} noValidate className="tokens-form">
              <div className="form-grid">
                {/* Verify Token */}
                <div className="form-block">
                  <label className="form-label" htmlFor="verifyToken">
                    Verify Token
                    <span className="badge-neutral">Você define</span>
                  </label>
                  <div className={`field-wrapper ${errors.verifyToken ? 'has-error' : ''}`}>
                    <input
                      ref={verifyRef}
                      id="verifyToken"
                      name="verifyToken"
                      type={show.verify ? 'text' : 'password'}
                      autoComplete="off"
                      className="field-input"
                      value={form.verifyToken}
                      onChange={onChange}
                      placeholder="Ex: secure_my_webhook_123"
                      aria-invalid={!!errors.verifyToken}
                      aria-describedby={errors.verifyToken ? 'err-verify' : 'hint-verify'}
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => toggleShow('verify')}
                      aria-label={show.verify ? 'Ocultar valor' : 'Mostrar valor'}
                    >
                      {show.verify ? (
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.verifyToken ? (
                    <span id="err-verify" className="error-text">{errors.verifyToken}</span>
                  ) : (
                    <p id="hint-verify" className="field-hint">Usado na verificação do webhook no Meta for Developers.</p>
                  )}
                </div>

                {/* Access Token */}
                <div className="form-block">
                  <label className="form-label" htmlFor="accessToken">
                    Page Access Token
                    <span className="badge-primary">Meta fornece</span>
                  </label>
                  <div className={`field-wrapper ${errors.accessToken ? 'has-error' : ''}`}>
                    <input
                      ref={accessRef}
                      id="accessToken"
                      name="accessToken"
                      type={show.access ? 'text' : 'password'}
                      autoComplete="off"
                      className="field-input"
                      value={form.accessToken}
                      onChange={onChange}
                      placeholder="Cole aqui o token de longa duração"
                      aria-invalid={!!errors.accessToken}
                      aria-describedby={errors.accessToken ? 'err-access' : 'hint-access'}
                    />
                    <button
                      type="button"
                      className="toggle-visibility"
                      onClick={() => toggleShow('access')}
                      aria-label={show.access ? 'Ocultar valor' : 'Mostrar valor'}
                    >
                      {show.access ? (
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.accessToken ? (
                    <span id="err-access" className="error-text">{errors.accessToken}</span>
                  ) : (
                    <p id="hint-access" className="field-hint">Gerado após vincular a página/conta no painel do Meta.</p>
                  )}
                </div>
              </div>

              {/* Webhook */}
              <div className="webhook-box">
                <div className="webhook-head">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h3>Webhook</h3>
                </div>
                <p className="webhook-help">Use esta URL ao registrar o webhook no Meta for Developers:</p>
                <div className="webhook-row">
                  <code className="webhook-code">{window.location.origin}/api/instagram-comment-chat</code>
                  <button type="button" className="copy-btn" onClick={copyWebhook} aria-label="Copiar URL">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="form-actions">
                <Link to="/instagram/setup" className="btn-secondary">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Voltar
                </Link>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="btn-spinner" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <span>Salvar e Continuar</span>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SetupTokens;

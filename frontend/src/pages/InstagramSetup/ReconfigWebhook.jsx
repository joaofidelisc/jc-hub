import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './ReconfigWebhook.css';

const ReconfigWebhook = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showVerifyToken, setShowVerifyToken] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [form, setForm] = useState({
    verifyToken: '',
    accessToken: '',
    modes: 'both',
  });
  const [allowAI, setAllowAI] = useState(false);
  const [business, setBusiness] = useState({
    ramo: '',
    horario: '',
    contato: '',
    extras: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return navigate('/login', { replace: true });
        const { data } = await axios.get('/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!data?.user) throw new Error('no user');
        setUser(data.user);

        const statusRes = await axios.get(`/api/ig/instagram/status?user_id=${data.user.id}`);
        setAllowAI(!!statusRes.data.allow_ai_direct);
        const ctx = statusRes.data.ai_business_context || '';
        if (ctx) {
          // tentativa simples de recuperar blocos por marcadores
          const parts = ctx.split('\n');
          setBusiness({
            ramo: parts.find(l => l.startsWith('Ramo:'))?.replace('Ramo:', '').trim() || '',
            horario: parts.find(l => l.startsWith('Horário:'))?.replace('Horário:', '').trim() || '',
            contato: parts.find(l => l.startsWith('Contato:'))?.replace('Contato:', '').trim() || '',
            extras: parts.filter(l => l.startsWith('Extras:')).map(l => l.replace('Extras:', '').trim()).join('\n') || ''
          });
        }
      } catch {
        navigate('/login', { replace: true });
      }
    };
    load();
  }, [navigate]);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return toast.warn('Usuário inválido.');
    
    if (!form.verifyToken.trim()) {
      return toast.warn('VERIFY_TOKEN é obrigatório.');
    }
    
    if (!form.accessToken.trim()) {
      return toast.warn('PAGE_ACCESS_TOKEN é obrigatório.');
    }

    setSubmitting(true);
    try {
      await axios.post('/api/ig/instagram/setup', {
        user_id: user.id,
        verify_token: form.verifyToken.trim(),
        access_token: form.accessToken.trim(),
        modes: form.modes,
      });
      toast.success('Webhook reconfigurado com sucesso!');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Falha ao reconfigurar webhook.');
    } finally {
      setSubmitting(false);
    }
  };

  const onBizChange = (e) => {
    const { name, value } = e.target;
    setBusiness(b => ({ ...b, [name]: value }));
  };

  const saveAIContext = async (e) => {
    e.preventDefault();
    if (!user?.id) return toast.warn('Usuário inválido.');
    const ctx =
      `Ramo: ${business.ramo}\nHorário: ${business.horario}\nContato: ${business.contato}\nExtras: ${business.extras}`.trim();
    try {
      const { data } = await axios.post('/api/ig/instagram/ai', {
        user_id: user.id,
        allow_ai_direct: allowAI,
        ai_business_context: ctx
      });
      setAllowAI(!!data.allow_ai_direct);
      toast.success('Configuração de IA salva.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Falha ao salvar contexto de IA.');
    }
  };

  const toggleAllowAI = () => setAllowAI(v => !v);

  if (!user) {
    return (
      <div className="reconfig-page center">
        <div className="loader">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="reconfig-page">
      <header className="reconfig-header">
        <Link to="/" className="brand brand-link">Simplifica.AI</Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Início</Link>
          <Link to="/profile" className="nav-link">Perfil</Link>
        </nav>
      </header>

      <main className="reconfig-content">
        <section className="reconfig-card">
          <div className="card-icon">🔄</div>
          <h1 className="title">Reconfigurar Webhook</h1>
          <p className="subtitle">
            Atualize suas credenciais do Instagram para continuar recebendo eventos do webhook.
          </p>

          <div className="instructions-section">
            <h2 className="instructions-title">📋 Instruções de configuração</h2>
            
            <div className="instruction-step">
              <div className="step-badge">1</div>
              <div className="step-info">
                <h3>Acesse o Meta for Developers</h3>
                <p>
                  Vá para{' '}
                  <a
                    href="https://developers.facebook.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link"
                  >
                    developers.facebook.com
                  </a>{' '}
                  e acesse sua aplicação do Instagram.
                </p>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-badge">2</div>
              <div className="step-info">
                <h3>Configure o Webhook</h3>
                <p>Na seção <strong>Webhooks</strong>, configure a URL de callback:</p>
                <div className="code-block-wrapper">
                  <code className="code-block">
                    https://cardozotech.online/api/instagram-comment-chat
                  </code>
                  <button
                    type="button"
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText('https://cardozotech.online/api/instagram-comment-chat');
                      toast.success('URL copiada!');
                    }}
                    title="Copiar URL"
                  >
                    📋
                  </button>
                </div>
                <p className="mt-2">
                  <strong>Importante:</strong> Inscreva-se nos campos <strong>comments</strong> e <strong>messages</strong>.
                </p>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-badge">3</div>
              <div className="step-info">
                <h3>Crie o VERIFY_TOKEN</h3>
                <p>
                  Crie uma string aleatória e única para validar o webhook. Use a mesma no Meta e no campo abaixo.
                </p>
                <p className="hint">
                  💡 Exemplo: <code>meu_token_secreto_123</code>
                </p>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-badge">4</div>
              <div className="step-info">
                <h3>Obtenha o PAGE_ACCESS_TOKEN</h3>
                <p>
                  Na seção <strong>Instagram Graph API</strong>, gere um token de acesso de página com as permissões:
                </p>
                <ul className="permissions-list">
                  <li><code>instagram_basic</code></li>
                  <li><code>instagram_manage_comments</code></li>
                  <li><code>instagram_manage_messages</code></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="divider-line"></div>

          <form className="form" onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="verifyToken" className="form-label">
                VERIFY_TOKEN
                <span className="form-label-hint">Token de verificação do webhook</span>
              </label>
              <div className="input-with-toggle">
                <input
                  id="verifyToken"
                  name="verifyToken"
                  type={showVerifyToken ? 'text' : 'password'}
                  className="form-control"
                  placeholder="seu_verify_token_secreto"
                  value={form.verifyToken}
                  onChange={onChange}
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowVerifyToken(!showVerifyToken)}
                  title={showVerifyToken ? 'Ocultar' : 'Mostrar'}
                >
                  {showVerifyToken ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="accessToken" className="form-label">
                PAGE_ACCESS_TOKEN
                <span className="form-label-hint">Token de acesso da página do Instagram</span>
              </label>
              <div className="input-with-toggle">
                <input
                  id="accessToken"
                  name="accessToken"
                  type={showAccessToken ? 'text' : 'password'}
                  className="form-control"
                  placeholder="IGQWRPa3..."
                  value={form.accessToken}
                  onChange={onChange}
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowAccessToken(!showAccessToken)}
                  title={showAccessToken ? 'Ocultar' : 'Mostrar'}
                >
                  {showAccessToken ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="modes" className="form-label">
                Modo de operação
                <span className="form-label-hint">Escolha quais eventos processar</span>
              </label>
              <select
                id="modes"
                name="modes"
                className="form-select"
                value={form.modes}
                onChange={onChange}
              >
                <option value="both">Comentários e Direct</option>
                <option value="reply">Apenas comentários</option>
                <option value="dm">Apenas Direct</option>
              </select>
            </div>

            <div className="alert alert-warning">
              <strong>⚠️ Atenção:</strong> Após salvar, o webhook usará essas novas credenciais. 
              Certifique-se de que os tokens estão corretos e ativos antes de salvar.
            </div>

            <div className="form-actions">
              <button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Salvando...
                  </>
                ) : (
                  'Salvar configuração'
                )}
              </button>
              <Link to="/" className="btn btn-outline-secondary btn-lg">
                Cancelar
              </Link>
            </div>
          </form>

          <div className="divider-line"></div>
        </section>
      </main>
    </div>
  );
};

export default ReconfigWebhook;

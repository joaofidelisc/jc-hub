import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onChange = (event) => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await axios.post('/api/login', {
        email: form.email.trim(),
        password: form.password,
      });
      if (!data?.access_token) throw new Error('Token ausente');
      localStorage.setItem('accessToken', data.access_token);
      toast.success('Login realizado com sucesso!');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.detail || error?.response?.data?.error || 'Falha ao entrar. Verifique suas credenciais.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-label="JC Hub Content Studio">
        <div className="auth-panel-grid" aria-hidden="true" />
        <div className="auth-panel-inner">
          <div className="auth-logo">
            <span className="auth-logo-icon">JC</span>
            <span className="auth-logo-copy"><strong>JC Hub</strong><small>Content Studio</small></span>
          </div>

          <div className="auth-hero">
            <span className="auth-eyebrow"><i /> Estratégia e criação em um só lugar</span>
            <h2>Conteúdo consistente.<br/><em>Decisões mais inteligentes.</em></h2>
            <p>A Nova transforma a identidade do seu negócio em um calendário editorial conectado, sem repetir ideias.</p>
          </div>

          <div className="auth-product-preview" aria-hidden="true">
            <div className="auth-preview-head">
              <span><i /> Planejamento de agosto</span>
              <small>12 conteúdos</small>
            </div>
            <div className="auth-preview-row">
              <b>18</b>
              <span><strong>Autoridade que gera confiança</strong><small>LinkedIn · Artigo</small></span>
              <i className="preview-status">Pronto</i>
            </div>
            <div className="auth-preview-row">
              <b>20</b>
              <span><strong>Bastidores da sua entrega</strong><small>Instagram · Carrossel</small></span>
              <i className="preview-status scheduled">Agendado</i>
            </div>
          </div>

          <ul className="auth-features">
            <li><span>✓</span> Planeje qualquer período de até dois meses</li>
            <li><span>✓</span> Conteúdo adaptado para cada rede social</li>
            <li><span>✓</span> Edite o calendário conversando com a Nova</li>
          </ul>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-mobile-logo"><span>JC</span><strong>JC Hub</strong></div>
        <div className="auth-form-wrap">
          <span className="auth-form-kicker">Bem-vindo de volta</span>
          <div className="auth-form-header">
            <h1>Acesse seu workspace</h1>
            <p>Entre para continuar planejando o conteúdo do seu negócio.</p>
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="seuemail@exemplo.com"
                value={form.email}
                onChange={onChange}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha</label>
              <div className="input-password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Sua senha"
                  value={form.password}
                  onChange={onChange}
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(current => !current)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? <><span className="loading-spinner-sm" /> Entrando...</> : <>Entrar na plataforma <span aria-hidden="true">→</span></>}
            </button>
          </form>

          <p className="auth-alt">Ainda não tem uma conta? <Link to="/register">Criar conta grátis</Link></p>
        </div>
        <p className="auth-form-footer">Planejamento editorial assistido por IA</p>
      </section>
    </main>
  );
};

export default Login;

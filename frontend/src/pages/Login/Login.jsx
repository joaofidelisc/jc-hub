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

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Falha ao entrar. Verifique suas credenciais.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor"/>
              </svg>
            </div>
            <span>Simplifica.AI</span>
          </div>

          <div className="auth-hero">
            <h2>Automatize seu engajamento no Instagram</h2>
            <p>Configure respostas automáticas, palavras-chave e IA para atender seus seguidores 24/7.</p>
          </div>

          <ul className="auth-features">
            <li>
              <span className="feature-dot"/>
              Respostas automáticas para comentários
            </li>
            <li>
              <span className="feature-dot"/>
              Mensagens diretas com botões de link
            </li>
            <li>
              <span className="feature-dot"/>
              IA (Gemini) para atendimento contextual
            </li>
          </ul>
        </div>
      </div>

      {/* Right form */}
      <div className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1>Entrar</h1>
            <p>Bem-vindo de volta! Acesse sua conta abaixo.</p>
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
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
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
              {submitting ? (
                <><span className="loading-spinner-sm"/>&nbsp;Entrando...</>
              ) : 'Entrar na plataforma'}
            </button>
          </form>

          <p className="auth-alt">
            Ainda não tem conta?{' '}
            <Link to="/register">Criar conta grátis</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

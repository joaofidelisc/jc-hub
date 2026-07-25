import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../Login/Login.css';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.warn('As senhas não conferem.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/api/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success('Cadastro realizado! Faça login para continuar.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Falha ao cadastrar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left brand panel */}
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
            <h2>Comece grátis hoje mesmo</h2>
            <p>Crie sua conta em segundos e comece a automatizar o engajamento do seu Instagram de forma profissional.</p>
          </div>

          <ul className="auth-features">
            <li><span className="feature-dot"/> Setup em menos de 5 minutos</li>
            <li><span className="feature-dot"/> Sem limite de palavras-chave</li>
            <li><span className="feature-dot"/> Suporte a múltiplos posts e contas</li>
          </ul>
        </div>
      </div>

      {/* Right form */}
      <div className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1>Criar conta</h1>
            <p>Preencha os campos abaixo para começar.</p>
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="name">Nome completo</label>
              <input
                id="name" name="name" type="text"
                className="form-input"
                placeholder="Seu nome"
                value={form.name}
                onChange={onChange}
                required minLength={2}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input
                id="email" name="email" type="email"
                className="form-input"
                placeholder="seuemail@exemplo.com"
                value={form.email}
                onChange={onChange}
                required autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha</label>
              <div className="input-password-wrap">
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={onChange}
                  required minLength={6}
                  autoComplete="new-password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
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

            <div className="form-group">
              <label className="form-label" htmlFor="confirm">Confirmar senha</label>
              <div className="input-password-wrap">
                <input
                  id="confirm" name="confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Repita sua senha"
                  value={form.confirm}
                  onChange={onChange}
                  required minLength={6}
                  autoComplete="new-password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(v => !v)} tabIndex={-1}>
                  {showConfirmPassword ? (
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
                <><span className="loading-spinner-sm"/>&nbsp;Criando conta...</>
              ) : 'Criar conta grátis'}
            </button>
          </form>

          <p className="auth-alt">
            Já tem conta?{' '}
            <Link to="/login">Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

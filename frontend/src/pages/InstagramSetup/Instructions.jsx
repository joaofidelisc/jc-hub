import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Instructions.css';

const useQuery = () => new URLSearchParams(useLocation().search);

const SetupInstructions = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const modes = query.get('modes') || 'both';
  const [verifyToken, setVerifyToken] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) navigate('/login', { replace: true });
  }, [navigate]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = `${baseUrl}/api/instagram-comment-chat`;

  const modesText = useMemo(() => {
    if (modes === 'comments') return 'Respostas automáticas em comentários';
    if (modes === 'direct') return 'Interações automáticas no Direct';
    return 'Ambos (Comentários e Direct)';
  }, [modes]);

  const onSave = async (e) => {
    e.preventDefault();
    if (!verifyToken.trim()) {
      toast.warn('Informe o VERIFY_TOKEN.');
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } });
      const userId = data?.user?.id;
      if (!userId) throw new Error('Usuário inválido');

      await axios.post('/api/ig/instagram/setup', {
        user_id: userId,
        verify_token: verifyToken.trim(),
        modes,
      });
      toast.success('Configuração salva!');
      navigate('/instagram/keywords', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Falha ao salvar configuração.');
    }
  };

  return (
    <div className="ig-inst-page">
      <header className="ig-header">
        <Link to="/" className="brand brand-link">Simplifica.AI</Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Início</Link>
          <Link to="/profile" className="nav-link">Perfil</Link>
        </nav>
      </header>

      <main className="ig-inst-content">
        <section className="ig-inst-card">
          <h1 className="title">Integração com Meta (Instagram)</h1>
          <p className="subtitle">Configuração escolhida: <strong>{modesText}</strong></p>

          <ol className="steps">
            <li>
              No Meta Developers, crie/seleccione um App e adicione o produto Instagram Graph API.
            </li>
            <li>
              Em Webhooks, registre o endpoint:
              <div className="kbd">{webhookUrl}</div>
              Use o verify token que você definirá abaixo.
            </li>
            <li>
              Conceda permissões necessárias (ex.: instagram_basic, pages_show_list, pages_manage_metadata).
            </li>
            <li>
              Gere o Page Access Token no servidor (variável PAGE_ACCESS_TOKEN).
            </li>
            <li>
              Assine eventos de comentários e/ou mensagens conforme sua escolha.
            </li>
          </ol>

          <form className="setup-form" onSubmit={onSave}>
            <div className="form-floating mb-3">
              <input
                id="verifyToken"
                type="text"
                className="form-control"
                placeholder="VERIFY_TOKEN"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                required
              />
              <label htmlFor="verifyToken">VERIFY_TOKEN</label>
            </div>
            <div className="actions">
              <Link to="/instagram/setup" className="btn btn-outline-secondary">Voltar</Link>
              <button className="btn btn-primary" type="submit">Salvar e continuar</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default SetupInstructions;

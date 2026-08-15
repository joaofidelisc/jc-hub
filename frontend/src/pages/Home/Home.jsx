import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import './Home.css';

const parseDate = (value = '') => {
  const [day, month, year] = value.split('/').map(Number);
  return year ? new Date(year, month - 1, day) : new Date(8640000000000000);
};

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  useLayout('Visão geral', 'Acompanhe sua operação de conteúdo', user);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return navigate('/login', { replace: true });
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [userResponse, historyResponse] = await Promise.all([axios.get('/api/me', config), axios.get('/api/creator/history', config)]);
        setUser(userResponse.data.user);
        setHistory(historyResponse.data || []);
      } catch {
        navigate('/login', { replace: true });
      } finally { setLoading(false); }
    };
    loadData();
  }, [navigate]);

  const dashboard = useMemo(() => {
    const posts = history.flatMap(plan => (plan.plan_json?.planejamento || []).map(post => ({ ...post, plan })));
    const done = posts.filter(post => post.feito).length;
    const upcoming = posts.filter(post => !post.feito).sort((a, b) => parseDate(a.data_sugerida) - parseDate(b.data_sugerida)).slice(0, 6);
    const strategies = history.reduce((result, plan) => {
      const label = plan.plan_json?.strategy_label || 'Funil de vendas';
      result[label] = (result[label] || 0) + (plan.plan_json?.planejamento?.length || 0);
      return result;
    }, {});
    return { posts, done, upcoming, strategies };
  }, [history]);

  if (loading) return <div className="page-loading"><span className="loading-spinner"/><p>Preparando sua visão geral...</p></div>;

  const settings = user?.creator_settings || {};
  const isConfigured = Boolean(settings.niche && settings.persona && settings.products && settings.networks?.length);
  if (!isConfigured) return <div className="dashboard-onboarding"><span>✦</span><div><small>Bem-vindo ao JC Hub</small><h2>Prepare a Nova para trabalhar com a sua marca</h2><p>Salve as informações do negócio uma única vez e gere calendários coerentes para cada rede social.</p><Link to="/meu-negocio" className="btn btn-primary">Configurar Meu Negócio</Link></div></div>;

  const progress = dashboard.posts.length ? Math.round(dashboard.done / dashboard.posts.length * 100) : 0;
  const strategyEntries = Object.entries(dashboard.strategies).sort((a,b) => b[1] - a[1]).slice(0,4);
  const strategyTotal = strategyEntries.reduce((sum, item) => sum + item[1], 0) || 1;
  const colors = ['#7b61e8', '#2583ff', '#f5a623', '#13ad77'];
  let cursor = 0;
  const gradientStops = strategyEntries.map(([, count], index) => { const start = cursor; cursor += count / strategyTotal * 100; return `${colors[index]} ${start}% ${cursor}%`; }).join(', ');

  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome"><div><span className="dashboard-eyebrow">{settings.niche}</span><h2>Olá, {user?.name?.split(' ')[0]}. Seu conteúdo está em movimento.</h2><p>A Nova usa todo o calendário para manter continuidade entre o que já foi publicado e o que vem a seguir.</p></div><Link className="btn btn-primary" to="/criador-ia">＋ Criar planejamento</Link></section>

      <section className="dashboard-stats">
        <article><span className="metric-icon blue">▦</span><div><strong>{history.length}</strong><small>Planejamentos</small><p>períodos salvos</p></div></article>
        <article><span className="metric-icon violet">✦</span><div><strong>{dashboard.posts.length}</strong><small>Conteúdos</small><p>gerados pela Nova</p></div></article>
        <article><span className="metric-icon green">✓</span><div><strong>{dashboard.done}</strong><small>Publicados</small><p>{progress}% do calendário</p></div></article>
        <article><span className="metric-icon orange">◷</span><div><strong>{dashboard.posts.length - dashboard.done}</strong><small>Agendados</small><p>próximas entregas</p></div></article>
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-panel upcoming-panel">
          <header><div><h3>Próximas publicações</h3><p>Conteúdos ainda não marcados como publicados</p></div><Link to="/planejamentos">Ver todos</Link></header>
          {!dashboard.upcoming.length ? <div className="empty-state"><h3>Nenhuma publicação pendente</h3><p>Crie um novo período para alimentar seu calendário.</p><Link to="/criador-ia" className="btn btn-primary">Criar planejamento</Link></div> : <div className="dashboard-post-list">{dashboard.upcoming.map((post, index) => {
            const network = Object.keys(post.conteudo_por_rede || {})[0];
            const title = post.conteudo_por_rede?.[network]?.titulo || post.tema_central;
            return <button key={`${post.plan.id}-${index}`} onClick={() => navigate('/criador-ia', { state: { selectedPlan: post.plan } })}><span className="post-date"><strong>{post.data_sugerida?.slice(0,2)}</strong><small>{post.dia?.slice(0,3)}</small></span><span className="post-info"><small>{network || 'Rede social'} · {post.horario_sugerido?.split('—')[0]}</small><strong>{title}</strong><em>{post.etapa_estrategia || post.etapa_funil || 'Conteúdo editorial'}</em></span><span className="post-arrow">→</span></button>;
          })}</div>}
        </section>

        <aside className="dashboard-side">
          <section className="dashboard-panel strategy-panel"><header><div><h3>Mix estratégico</h3><p>Distribuição dos conteúdos</p></div></header>{strategyEntries.length ? <><div className="strategy-chart" style={{ background: `conic-gradient(${gradientStops})` }}><span><strong>{dashboard.posts.length}</strong><small>posts</small></span></div><div className="strategy-legend">{strategyEntries.map(([label,count],index) => <div key={label}><i style={{ background: colors[index] }}/><span>{label}</span><strong>{count}</strong></div>)}</div></> : <div className="empty-state compact"><p>O mix aparece após o primeiro plano.</p></div>}</section>
          <section className="dashboard-panel business-summary"><header><div><h3>Meu negócio</h3><p>Preferências em uso</p></div><Link to="/meu-negocio">Editar</Link></header><dl><div><dt>Tom de voz</dt><dd>{settings.tone || 'Não definido'}</dd></div><div><dt>Redes</dt><dd>{settings.networks?.join(', ')}</dd></div><div><dt>Estratégia padrão</dt><dd>{settings.defaultStrategy ? 'Configurada' : 'Funil de vendas'}</dd></div></dl></section>
        </aside>
      </div>
    </div>
  );
}

export default Home;

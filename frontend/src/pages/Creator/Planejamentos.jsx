import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import './Creator.css';

const getPlanStatus = (posts) => {
  const done = posts.filter(post => post.feito).length;
  if (posts.length && done === posts.length) return { id: 'done', label: 'Concluído' };
  if (done > 0) return { id: 'in-progress', label: 'Em andamento' };
  return { id: 'planned', label: 'Planejado' };
};

const authConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });

function Planejamentos() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planToDelete, setPlanToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  useLayout('Planejamentos', 'Todo o seu calendário editorial em um só lugar', user);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userResponse, historyResponse] = await Promise.all([
          axios.get('/api/me', authConfig()),
          axios.get('/api/creator/history', authConfig()),
        ]);
        setUser(userResponse.data.user);
        setHistory(historyResponse.data || []);
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Não foi possível carregar os planejamentos.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const summary = useMemo(() => history.reduce((totals, plan) => {
    const posts = plan.plan_json?.planejamento || [];
    totals.plans += 1;
    totals.posts += posts.length;
    totals.done += posts.filter(post => post.feito).length;
    totals.scheduled += posts.filter(post => !post.feito).length;
    return totals;
  }, { plans: 0, posts: 0, done: 0, scheduled: 0 }), [history]);

  const filteredPlans = useMemo(() => history.filter(plan => {
    const data = plan.plan_json || {};
    const posts = data.planejamento || [];
    const status = getPlanStatus(posts);
    const haystack = `${data.period_label || data.week_label || ''} ${data.objective || ''} ${data.strategy_label || ''}`.toLowerCase();
    return (statusFilter === 'all' || status.id === statusFilter) && haystack.includes(search.toLowerCase().trim());
  }).sort((a, b) => {
    const aDate = a.plan_json?.period_start || a.created_at;
    const bDate = b.plan_json?.period_start || b.created_at;
    return String(bDate).localeCompare(String(aDate));
  }), [history, search, statusFilter]);

  const handleDeletePlan = async () => {
    if (!planToDelete || deletingId) return;
    setDeletingId(planToDelete.id);
    try {
      await axios.delete(`/api/creator/plan/${planToDelete.id}`, authConfig());
      setHistory(current => current.filter(plan => plan.id !== planToDelete.id));
      setPlanToDelete(null);
      toast.success('Planejamento apagado.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Não foi possível apagar o planejamento.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="page-loading"><span className="loading-spinner"/><p>Carregando planejamentos...</p></div>;

  return (
    <div className="planning-page">
      <section className="planning-stats-grid">
        <article><span className="planning-stat-icon blue">▦</span><div><small>Planejamentos</small><strong>{summary.plans}</strong><p>períodos criados</p></div></article>
        <article><span className="planning-stat-icon violet">✦</span><div><small>Conteúdos</small><strong>{summary.posts}</strong><p>publicações geradas</p></div></article>
        <article><span className="planning-stat-icon green">✓</span><div><small>Publicados</small><strong>{summary.done}</strong><p>marcados como feitos</p></div></article>
        <article><span className="planning-stat-icon orange">◷</span><div><small>Agendados</small><strong>{summary.scheduled}</strong><p>próximos conteúdos</p></div></article>
      </section>

      <section className="planning-table-card">
        <header className="planning-table-header">
          <div><h2>Calendários de conteúdo</h2><p>Abra um planejamento para revisar, editar ou regenerar.</p></div>
          <Link className="btn btn-primary" to="/criador-ia">＋ Novo planejamento</Link>
        </header>
        <div className="planning-filters">
          <label className="planning-search"><span>⌕</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar objetivo, período ou estratégia..." /></label>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">Todos os status</option><option value="planned">Planejados</option><option value="in-progress">Em andamento</option><option value="done">Concluídos</option></select>
        </div>

        {!filteredPlans.length ? (
          <div className="empty-state">
            <h3>{history.length ? 'Nenhum resultado encontrado' : 'Seu calendário ainda está vazio'}</h3>
            <p>{history.length ? 'Ajuste a busca ou o filtro.' : 'Crie o primeiro planejamento para começar.'}</p>
            {!history.length && <Link className="btn btn-primary" to="/criador-ia">Criar planejamento</Link>}
          </div>
        ) : (
          <div className="planning-table-wrap">
            <table className="planning-table">
              <thead><tr><th>Período e objetivo</th><th>Estratégia</th><th>Redes</th><th>Progresso</th><th>Status</th><th aria-label="Ações"/></tr></thead>
              <tbody>{filteredPlans.map(plan => {
                const data = plan.plan_json || {};
                const posts = data.planejamento || [];
                const done = posts.filter(post => post.feito).length;
                const progress = posts.length ? Math.round(done / posts.length * 100) : 0;
                const status = getPlanStatus(posts);
                const networks = data.networks || Object.keys(posts[0]?.conteudo_por_rede || {});
                return (
                  <tr key={plan.id} onClick={() => navigate('/criador-ia', { state: { selectedPlan: plan } })}>
                    <td><strong>{data.period_label || data.week_label || 'Período não informado'}</strong><span>{data.objective || 'Planejamento editorial'}</span></td>
                    <td><span className="strategy-table-badge">{data.strategy_label || 'Funil de vendas'}</span></td>
                    <td><div className="network-avatar-stack">{networks.slice(0,4).map(network => <i key={network} title={network}>{network.slice(0,2).toUpperCase()}</i>)}{networks.length > 4 && <b>+{networks.length - 4}</b>}</div></td>
                    <td><div className="table-progress"><span><i style={{ width: `${progress}%` }}/></span><small>{done}/{posts.length}</small></div></td>
                    <td><span className={`plan-status ${status.id}`}>{status.label}</span></td>
                    <td><div className="planning-row-actions"><button type="button" className="delete-plan-button" title="Apagar planejamento" aria-label="Apagar planejamento" onClick={event => { event.stopPropagation(); setPlanToDelete(plan); }}><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg></button><button type="button" className="open-plan-button" aria-label="Abrir planejamento">→</button></div></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </section>

      {planToDelete && <div className="modal-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !deletingId) setPlanToDelete(null); }}><div className="modal-box delete-plan-modal" role="dialog" aria-modal="true" aria-labelledby="delete-plan-title"><span className="delete-plan-icon"><svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg></span><h3 id="delete-plan-title">Apagar este planejamento?</h3><p>O período <strong>{planToDelete.plan_json?.period_label || planToDelete.plan_json?.week_label || 'selecionado'}</strong> e todas as suas publicações serão removidos do calendário usado pela Nova. Esta ação não pode ser desfeita.</p><div><button type="button" className="btn btn-secondary" disabled={Boolean(deletingId)} onClick={() => setPlanToDelete(null)}>Cancelar</button><button type="button" className="btn btn-danger" disabled={Boolean(deletingId)} onClick={handleDeletePlan}>{deletingId ? 'Apagando...' : 'Apagar planejamento'}</button></div></div></div>}
    </div>
  );
}

export default Planejamentos;

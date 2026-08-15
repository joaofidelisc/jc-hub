import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';
import { formatDateBR } from './creatorConfig';
import './Creator.css';

const authConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
const deepCopy = (value) => JSON.parse(JSON.stringify(value));
const toInputDate = (value = '') => {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const [day, month, year] = value.split('/');
  return year && month && day ? `${year}-${month}-${day}` : '';
};
const toBrDate = (value = '') => value ? formatDateBR(value) : '';

function CreatorResults({ results, planId, user, onReset, onNext, onPrev, onRegenerate, regenerating, onPlanChange }) {
  const [plan, setPlan] = useState(results?.planejamento || []);
  const [activeNetwork, setActiveNetwork] = useState('');
  const [expandedDay, setExpandedDay] = useState(null);
  const [generatingImages, setGeneratingImages] = useState({});
  const [generatedImages, setGeneratedImages] = useState({});
  const [regeneratingPosts, setRegeneratingPosts] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editNetwork, setEditNetwork] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmRegeneration, setConfirmRegeneration] = useState(false);

  const networks = useMemo(() => {
    const configured = results?.networks?.map(value => value.toLowerCase().replace(/\s+/g, '_')) || [];
    const fromContent = Object.keys(plan[0]?.conteudo_por_rede || {});
    return [...new Set([...configured, ...fromContent])];
  }, [results?.networks, plan]);

  useEffect(() => {
    setPlan(results?.planejamento || []);
    setExpandedDay(null);
  }, [results]);

  useEffect(() => {
    if (!activeNetwork || !networks.includes(activeNetwork)) setActiveNetwork(networks[0] || 'instagram');
  }, [activeNetwork, networks]);

  const commitPlan = (planJson) => {
    setPlan(planJson.planejamento || []);
    onPlanChange?.(planJson);
  };

  const handleCopy = async (item, content) => {
    const text = [content.titulo || item.tema_central, content.roteiro_ou_legenda, content.legenda_instagram, content.cta].filter(Boolean).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Conteúdo copiado.');
    } catch {
      toast.error('Não foi possível copiar automaticamente.');
    }
  };

  const toggleDone = async (event, index) => {
    event.stopPropagation();
    if (!planId) return toast.warning('Este planejamento ainda não foi salvo.');
    const previous = plan;
    setPlan(current => current.map((post, itemIndex) => itemIndex === index ? { ...post, feito: !post.feito } : post));
    try {
      const { data } = await axios.post(`/api/creator/plan/${planId}/toggle/${index}`, {}, authConfig());
      commitPlan(data.plan_json);
    } catch (error) {
      setPlan(previous);
      toast.error(error.response?.data?.detail || 'Não foi possível atualizar o status.');
    }
  };

  const applyLogoOverlay = (base64Background, logoSource) => new Promise(resolve => {
    if (!logoSource || !base64Background?.startsWith('data:')) return resolve(base64Background);
    const background = new Image();
    background.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = background.width;
      canvas.height = background.height;
      const context = canvas.getContext('2d');
      context.drawImage(background, 0, 0);
      const logo = new Image();
      logo.onload = () => {
        const scale = Math.min(canvas.width * .2 / logo.width, canvas.height * .12 / logo.height);
        const width = logo.width * scale;
        const height = logo.height * scale;
        const margin = canvas.width * .035;
        context.drawImage(logo, canvas.width - width - margin, canvas.height - height - margin, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      logo.onerror = () => resolve(base64Background);
      logo.src = logoSource;
    };
    background.onerror = () => resolve(base64Background);
    background.src = base64Background;
  });

  const handleGenerateImage = async (event, index) => {
    event.stopPropagation();
    if (!planId) return toast.warning('Este planejamento ainda não foi salvo.');
    const imageKey = `${index}-${activeNetwork}`;
    setGeneratingImages(current => ({ ...current, [imageKey]: true }));
    try {
      const { data } = await axios.post(`/api/creator/plan/${planId}/generate-image/${index}`, {}, authConfig());
      const image = await applyLogoOverlay(data.image_url, user?.creator_settings?.logo?.[0]);
      setGeneratedImages(current => ({ ...current, [imageKey]: image }));
      setExpandedDay(index);
      toast.success('Imagem gerada.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Não foi possível gerar a imagem.');
    } finally {
      setGeneratingImages(current => ({ ...current, [imageKey]: false }));
    }
  };

  const handleRegeneratePost = async (event, index) => {
    event.stopPropagation();
    if (!planId) return;
    setRegeneratingPosts(current => ({ ...current, [index]: true }));
    try {
      const { data } = await axios.post(`/api/creator/plan/${planId}/post/${index}/regenerate`, {}, authConfig());
      commitPlan(data.plan_json);
      setExpandedDay(index);
      toast.success('Publicação regenerada sem repetir o restante do calendário.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Não foi possível regenerar esta publicação.');
    } finally {
      setRegeneratingPosts(current => ({ ...current, [index]: false }));
    }
  };

  const openEditor = (event, index) => {
    event.stopPropagation();
    const nextDraft = deepCopy(plan[index]);
    setDraft(nextDraft);
    setEditingIndex(index);
    setEditNetwork(activeNetwork || Object.keys(nextDraft.conteudo_por_rede || {})[0]);
  };

  const updateDraft = (field, value) => setDraft(current => ({ ...current, [field]: value }));
  const updateNetworkDraft = (field, value) => setDraft(current => ({
    ...current,
    conteudo_por_rede: {
      ...current.conteudo_por_rede,
      [editNetwork]: { ...(current.conteudo_por_rede?.[editNetwork] || {}), [field]: value },
    },
  }));

  const saveDraft = async (event) => {
    event.preventDefault();
    if (!draft.tema_central?.trim()) return toast.warning('Informe o tema central.');
    setSavingEdit(true);
    try {
      const payload = { ...draft, data_sugerida: toBrDate(draft.data_sugerida) };
      const { data } = await axios.put(`/api/creator/plan/${planId}/post/${editingIndex}`, { post: payload }, authConfig());
      commitPlan(data.plan_json);
      setEditingIndex(null);
      setDraft(null);
      toast.success('Publicação atualizada e validada no calendário.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Não foi possível salvar a publicação.');
    } finally { setSavingEdit(false); }
  };

  if (!plan.length) return <div className="empty-state card"><h3>Nenhuma publicação neste planejamento</h3><p>Crie um novo plano para começar.</p><button className="btn btn-primary" onClick={onReset}>Criar planejamento</button></div>;

  const doneCount = plan.filter(item => item.feito).length;
  const progress = Math.round((doneCount / plan.length) * 100);
  const strategyLabel = results?.strategy_label || (results?.strategy === 'funnel' ? 'Funil de vendas' : 'Estratégia editorial');

  return (
    <div className="results-page">
      <section className="results-header-card">
        <div className="results-heading-row">
          <div><span className="results-eyebrow">{results?.period_label || results?.week_label || 'Planejamento editorial'}</span><h2>{results?.objective || 'Calendário de conteúdo'}</h2><div className="results-meta"><span className="badge badge-primary">{strategyLabel}</span><span>{plan.length} publicações</span><span>{networks.length} redes</span></div></div>
          <div className="results-actions">
            {(onPrev || onNext) && <div className="history-navigation"><button onClick={onPrev} disabled={!onPrev} title="Planejamento anterior">←</button><button onClick={onNext} disabled={!onNext} title="Próximo planejamento">→</button></div>}
            <button className="btn btn-secondary" onClick={() => setConfirmRegeneration(true)} disabled={regenerating}>↻ Regenerar plano</button>
            <button className="btn btn-primary" onClick={onReset}>＋ Novo plano</button>
          </div>
        </div>
        <div className="results-progress"><div><span>Progresso de publicação</span><strong>{doneCount} de {plan.length} concluídas</strong></div><div className="results-progress-track"><i style={{ width: `${progress}%` }}/></div></div>
        <div className="network-tabs" role="tablist">{networks.map(network => <button key={network} type="button" role="tab" aria-selected={activeNetwork === network} className={activeNetwork === network ? 'active' : ''} onClick={() => setActiveNetwork(network)}>{network.charAt(0).toUpperCase() + network.slice(1)}</button>)}</div>
      </section>

      <div className="publication-list">
        {plan.map((item, index) => {
          const content = item.conteudo_por_rede?.[activeNetwork];
          if (!content) return null;
          const expanded = expandedDay === index;
          const imageKey = `${index}-${activeNetwork}`;
          return (
            <article className={`publication-card ${item.feito ? 'published' : ''}`} key={`${item.data_sugerida}-${index}`}>
              <div className="publication-summary" role="button" tabIndex="0" onClick={() => setExpandedDay(expanded ? null : index)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) setExpandedDay(expanded ? null : index); }} aria-expanded={expanded}>
                <span className="publication-date-box"><strong>{item.data_sugerida?.slice(0,2) || '--'}</strong><small>{item.dia?.split('-')[0]?.slice(0,3) || 'Dia'}</small></span>
                <span className="publication-title"><small>{item.etapa_estrategia || item.etapa_funil || strategyLabel}</small><strong>{content.titulo || item.tema_central}</strong><em>Tema central: {item.tema_central}</em></span>
                <span className="publication-summary-actions">
                  <button type="button" className={`publish-status ${item.feito ? "done" : ""}`} onClick={event => toggleDone(event, index)}>{item.feito ? "✓ Publicado" : "Marcar publicado"}</button>
                  <span className="expand-chevron">{expanded ? '−' : '+'}</span>
                </span>
              </div>

              {expanded && <div className="publication-details">
                <div className="publication-toolbar">
                  <span>{content.formato || 'Post'}</span><span>◷ {item.horario_sugerido || 'Horário a definir'}</span>
                  <div><button onClick={event => handleCopy(item, content)}>Copiar</button><button onClick={event => openEditor(event, index)}>Editar</button><button onClick={event => handleRegeneratePost(event, index)} disabled={regeneratingPosts[index]}>{regeneratingPosts[index] ? 'Regenerando...' : 'Regenerar post'}</button><button onClick={event => handleGenerateImage(event, index)} disabled={generatingImages[imageKey]}>{generatingImages[imageKey] ? 'Gerando...' : 'Gerar imagem'}</button></div>
                </div>
                <div className="content-detail-grid">
                  <section className="content-panel main-copy"><h4>Conteúdo para {activeNetwork}</h4><div className="markdown-content"><ReactMarkdown>{content.roteiro_ou_legenda || 'Conteúdo não informado.'}</ReactMarkdown></div>{content.legenda_instagram && <><h4 className="secondary-copy-title">Legenda</h4><div className="markdown-content"><ReactMarkdown>{content.legenda_instagram}</ReactMarkdown></div></>}</section>
                  <div className="content-side-column"><section className="content-panel"><h4>Direção visual</h4><div className="markdown-content"><ReactMarkdown>{content.descricao_visual || 'Sem direção visual adicional.'}</ReactMarkdown></div></section><section className="content-panel cta-panel"><h4>Chamada para ação</h4><div className="markdown-content"><ReactMarkdown>{content.cta || 'Sem CTA adicional.'}</ReactMarkdown></div></section></div>
                </div>
                {generatedImages[imageKey] && <div className="generated-image"><img src={generatedImages[imageKey]} alt={`Imagem para ${content.titulo || item.tema_central}`}/><a className="btn btn-secondary btn-sm" href={generatedImages[imageKey]} target="_blank" rel="noreferrer">Abrir imagem</a></div>}
              </div>}
            </article>
          );
        })}
      </div>

      {editingIndex !== null && draft && <div className="modal-overlay"><form className="modal-box post-editor-modal" onSubmit={saveDraft}><header className="modal-header"><div><h3>Editar publicação</h3><p>Alterações são verificadas contra todos os outros planejamentos.</p></div><button type="button" className="modal-close" onClick={() => setEditingIndex(null)}>×</button></header><div className="post-editor-body"><div className="form-row"><div className="form-group"><label className="form-label">Data</label><input type="date" className="form-input" value={toInputDate(draft.data_sugerida)} min={results?.period_start} max={results?.period_end} onChange={event => updateDraft('data_sugerida', event.target.value)} /></div><div className="form-group"><label className="form-label">Horário</label><input className="form-input" value={draft.horario_sugerido || ''} onChange={event => updateDraft('horario_sugerido', event.target.value)} /></div></div><div className="form-group"><label className="form-label">Tema central</label><input className="form-input" value={draft.tema_central || ''} onChange={event => updateDraft('tema_central', event.target.value)} /></div><div className="form-group"><label className="form-label">Papel na estratégia</label><input className="form-input" value={draft.etapa_estrategia || draft.etapa_funil || ''} onChange={event => updateDraft('etapa_estrategia', event.target.value)} /></div><div className="editor-network-tabs">{Object.keys(draft.conteudo_por_rede || {}).map(network => <button type="button" key={network} className={editNetwork === network ? 'active' : ''} onClick={() => setEditNetwork(network)}>{network}</button>)}</div><div className="form-group"><label className="form-label">Título para {editNetwork}</label><input className="form-input" value={draft.conteudo_por_rede?.[editNetwork]?.titulo || ''} onChange={event => updateNetworkDraft('titulo', event.target.value)} /></div><div className="form-row"><div className="form-group"><label className="form-label">Formato</label><input className="form-input" value={draft.conteudo_por_rede?.[editNetwork]?.formato || ''} onChange={event => updateNetworkDraft('formato', event.target.value)} /></div><div className="form-group"><label className="form-label">CTA</label><input className="form-input" value={draft.conteudo_por_rede?.[editNetwork]?.cta || ''} onChange={event => updateNetworkDraft('cta', event.target.value)} /></div></div><div className="form-group"><label className="form-label">Conteúdo</label><textarea className="form-textarea editor-main-text" value={draft.conteudo_por_rede?.[editNetwork]?.roteiro_ou_legenda || ''} onChange={event => updateNetworkDraft('roteiro_ou_legenda', event.target.value)} /></div><div className="form-group"><label className="form-label">Direção visual</label><textarea className="form-textarea" value={draft.conteudo_por_rede?.[editNetwork]?.descricao_visual || ''} onChange={event => updateNetworkDraft('descricao_visual', event.target.value)} /></div></div><div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setEditingIndex(null)}>Cancelar</button><button className="btn btn-primary" disabled={savingEdit}>{savingEdit ? 'Validando...' : 'Salvar publicação'}</button></div></form></div>}

      {confirmRegeneration && <div className="modal-overlay"><div className="modal-box overwrite-modal"><span className="overwrite-icon">↻</span><h3>Regenerar este planejamento?</h3><p>A Nova manterá as publicações marcadas como feitas e recriará as demais considerando todo o calendário publicado e agendado.</p><div><button className="btn btn-secondary" onClick={() => setConfirmRegeneration(false)}>Cancelar</button><button className="btn btn-primary" onClick={() => { setConfirmRegeneration(false); onRegenerate(); }}>Regenerar planejamento</button></div></div></div>}
    </div>
  );
}

export default CreatorResults;

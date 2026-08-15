import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  AVAILABLE_DAYS,
  AVAILABLE_NETWORKS,
  CONTENT_STRATEGIES,
  formatDateBR,
  getMaxEndDate,
  getTodayISO,
  maskDateBR,
  parseDateBR,
  toLocalISODate,
} from './creatorConfig';
import './Creator.css';

const addDays = (isoDate, amount) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return toLocalISODate(date);
};

function BrazilianDateInput({ label, name, value, onChange, min, max, helper }) {
  const [displayValue, setDisplayValue] = useState(formatDateBR(value));

  useEffect(() => {
    setDisplayValue(formatDateBR(value));
  }, [value]);

  const emitISO = (isoValue) => onChange({ target: { name, value: isoValue } });

  const handleTextChange = (event) => {
    const masked = maskDateBR(event.target.value);
    setDisplayValue(masked);
    if (!masked) {
      emitISO('');
      return;
    }
    if (masked.length !== 10) return;
    const isoValue = parseDateBR(masked);
    if (isoValue && (!min || isoValue >= min) && (!max || isoValue <= max)) emitISO(isoValue);
  };

  const resetInvalidValue = () => {
    const isoValue = parseDateBR(displayValue);
    const outsideRange = isoValue && ((min && isoValue < min) || (max && isoValue > max));
    if (!isoValue || outsideRange) setDisplayValue(formatDateBR(value));
  };

  return (
    <div className="form-group date-field">
      <div className="date-label-row">
        <label className="form-label" htmlFor={`${name}-display`}>{label}</label>
        {helper && <span>{helper}</span>}
      </div>
      <div className="date-input-shell">
        <input
          id={`${name}-display`}
          type="text"
          className="form-input"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/aaaa"
          maxLength={10}
          value={displayValue}
          onChange={handleTextChange}
          onBlur={resetInvalidValue}
        />
        <label className="date-picker-trigger" title={`Selecionar ${label.toLowerCase()}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
          <input
            type="date"
            name={name}
            value={value}
            min={min}
            max={max}
            onChange={event => emitISO(event.target.value)}
            aria-label={`Selecionar ${label.toLowerCase()}`}
          />
        </label>
      </div>
    </div>
  );
}

function StrategyModal({ strategy, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  if (!strategy) return null;

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-box strategy-explainer-modal" role="dialog" aria-modal="true" aria-labelledby="strategy-modal-title" style={{ '--strategy-accent': strategy.accent }}>
        <header className="strategy-modal-header">
          <span className="strategy-modal-mark"><i /></span>
          <div><small>Estratégia editorial</small><h3 id="strategy-modal-title">{strategy.label}</h3><p>{strategy.short}</p></div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
        </header>
        <div className="strategy-modal-body">
          <section><h4>O que significa</h4><p>{strategy.definition}</p></section>
          <section><h4>O caminho que a Nova seguirá</h4><ol className="strategy-path">{strategy.path.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{step.title}</strong><p>{step.text}</p></div></li>)}</ol></section>
          <div className="strategy-modal-insights">
            <article><span>✦</span><div><strong>Como a IA decide</strong><p>{strategy.aiBehavior}</p></div></article>
            <article><span>◎</span><div><strong>Funciona melhor para</strong><p>{strategy.idealFor}</p></div></article>
          </div>
        </div>
        <footer><button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button></footer>
      </section>
    </div>
  );
}

function GenerationExperience({ onCancel, cancelling }) {
  return (
    <div className="generation-overlay" role="dialog" aria-modal="true" aria-labelledby="generation-title">
      <div className="generation-modal">
        <div className="nova-generation-scene" aria-hidden="true">
          <span className="nova-orbit orbit-one"><i /></span>
          <span className="nova-orbit orbit-two"><i /></span>
          <span className="nova-generation-mark">N</span>
          <span className="generation-card card-one"><i /><b /><b /></span>
          <span className="generation-card card-two"><i /><b /><b /></span>
        </div>
        <span className="generation-eyebrow"><i /> Nova está trabalhando</span>
        <h2 id="generation-title">Montando seu planejamento</h2>
        <p>A Nova está cruzando estratégia, preferências e todo o seu histórico editorial antes de escrever cada sugestão.</p>
        <div className="generation-steps">
          <span style={{ '--step-delay': '0s' }}><i /> Analisando calendários publicados e futuros</span>
          <span style={{ '--step-delay': '.7s' }}><i /> Distribuindo o caminho da estratégia</span>
          <span style={{ '--step-delay': '1.4s' }}><i /> Adaptando títulos e textos para cada rede</span>
        </div>
        <button type="button" className="btn btn-secondary generation-cancel" onClick={onCancel} disabled={cancelling}>
          {cancelling ? 'Cancelando com segurança...' : 'Cancelar criação'}
        </button>
        <small>Ao cancelar, o planejamento não será salvo.</small>
      </div>
    </div>
  );
}

function CreatorForm({ onSubmit, onCancel, loading, cancelling = false, user }) {
  const today = useMemo(getTodayISO, []);
  const [checkingPlan, setCheckingPlan] = useState(false);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [strategyModal, setStrategyModal] = useState(null);
  const [existingLabel, setExistingLabel] = useState('');
  const [contextStats, setContextStats] = useState({ plans: 0, posts: 0, loaded: false });
  const [formData, setFormData] = useState({
    startDate: today,
    endDate: addDays(today, 27),
    objective: '',
    strategy: 'funnel',
    strategyDetails: '',
    networks: [],
    days: [],
  });

  const settings = user?.creator_settings || {};
  const hasSettings = Boolean(settings.niche?.trim() && settings.persona?.trim() && settings.products?.trim() && settings.networks?.length && settings.days?.length);
  const maxEndDate = getMaxEndDate(formData.startDate);

  useEffect(() => {
    if (!user) return;
    setFormData(current => ({
      ...current,
      strategy: settings.defaultStrategy || current.strategy,
      networks: settings.networks || [],
      days: settings.days || [],
    }));
  }, [user]);

  useEffect(() => {
    const loadContextStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const { data } = await axios.get('/api/creator/history', { headers: { Authorization: `Bearer ${token}` } });
        const plans = data || [];
        setContextStats({
          plans: plans.length,
          posts: plans.reduce((total, plan) => total + (plan.plan_json?.planejamento?.length || 0), 0),
          loaded: true,
        });
      } catch {
        setContextStats(current => ({ ...current, loaded: true }));
      }
    };
    loadContextStats();
  }, []);

  const handleChange = ({ target: { name, value } }) => {
    setFormData(current => {
      if (name !== 'startDate') return { ...current, [name]: value };
      if (!value) return { ...current, startDate: '', endDate: '' };
      const nextMax = getMaxEndDate(value);
      const currentDurationInvalid = !current.endDate || current.endDate < value || current.endDate > nextMax;
      return { ...current, startDate: value, endDate: currentDurationInvalid ? addDays(value, 27) : current.endDate };
    });
  };

  const toggleSelection = (field, value) => setFormData(current => {
    const values = current[field] || [];
    return { ...current, [field]: values.includes(value) ? values.filter(item => item !== value) : [...values, value] };
  });

  const getPublicationCount = () => {
    if (!formData.startDate || !formData.endDate || !formData.days.length) return 0;
    const indexes = new Set(formData.days.map(day => AVAILABLE_DAYS.indexOf(day)));
    const [sy, sm, sd] = formData.startDate.split('-').map(Number);
    const [ey, em, ed] = formData.endDate.split('-').map(Number);
    const cursor = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    let count = 0;
    while (cursor <= end) {
      const mondayIndex = (cursor.getDay() + 6) % 7;
      if (indexes.has(mondayIndex)) count += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  };

  const validate = () => {
    if (!formData.startDate || !formData.endDate) return 'Escolha as datas de início e término.';
    if (formData.endDate < formData.startDate) return 'A data final deve ser posterior à inicial.';
    if (formData.endDate > maxEndDate) return 'O período máximo permitido é de dois meses.';
    if (!formData.objective.trim()) return 'Explique o objetivo deste planejamento.';
    if (!formData.strategy) return 'Escolha uma estratégia.';
    if (!formData.networks.length) return 'Selecione pelo menos uma rede social.';
    if (!formData.days.length) return 'Selecione pelo menos um dia de publicação.';
    if (!getPublicationCount()) return 'O período escolhido não contém nenhum dos dias selecionados.';
    return '';
  };

  const submitPlan = () => {
    setShowOverwriteModal(false);
    onSubmit({ ...settings, ...formData });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationMessage = validate();
    if (validationMessage) return toast.warning(validationMessage);

    setCheckingPlan(true);
    try {
      const token = localStorage.getItem('accessToken');
      const { data } = await axios.get('/api/creator/check-plan', {
        params: { start_date: formData.startDate, end_date: formData.endDate },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.exists) {
        setExistingLabel(data.label || 'este período');
        setShowOverwriteModal(true);
      } else {
        submitPlan();
      }
    } catch (error) {
      console.error(error);
      submitPlan();
    } finally {
      setCheckingPlan(false);
    }
  };

  if (!user) return <div className="page-loading"><span className="loading-spinner"/><p>Carregando suas preferências...</p></div>;

  if (!hasSettings) {
    return (
      <div className="creator-setup-empty card">
        <span className="setup-empty-icon">⌂</span>
        <span className="badge badge-warning">Configuração necessária</span>
        <h2>Conte primeiro sobre o seu negócio</h2>
        <p>Preencha nicho, público, ofertas e canais uma única vez. Essas informações serão a base de todos os planejamentos.</p>
        <Link to="/meu-negocio" className="btn btn-primary">Configurar Meu Negócio</Link>
      </div>
    );
  }

  const selectedStrategy = CONTENT_STRATEGIES.find(item => item.id === formData.strategy);
  const publicationCount = getPublicationCount();
  const continuityText = contextStats.loaded && contextStats.plans
    ? `${contextStats.plans} planejamento${contextStats.plans === 1 ? '' : 's'} e ${contextStats.posts} conteúdo${contextStats.posts === 1 ? '' : 's'} serão considerados antes desta geração.`
    : 'Todo conteúdo publicado e futuro será considerado antes desta geração.';

  return (
    <form className="planner-form" onSubmit={handleSubmit} aria-busy={loading}>
      <div className="planner-main-column">
        <section className="planner-section-card">
          <header><span>01</span><div><h2>Período do planejamento</h2><p>Escolha qualquer intervalo de até dois meses.</p></div></header>
          <div className="planner-section-body">
            <div className="date-range-grid">
              <BrazilianDateInput label="Começa em" name="startDate" value={formData.startDate} onChange={handleChange} />
              <span className="date-range-arrow">→</span>
              <BrazilianDateInput label="Termina em" name="endDate" value={formData.endDate} min={formData.startDate} max={maxEndDate} onChange={handleChange} helper={`Limite: ${formatDateBR(maxEndDate)}`} />
            </div>
            <label className="form-label">Dias com publicação</label>
            <div className="planner-day-grid">{AVAILABLE_DAYS.map(day => <button key={day} type="button" className={formData.days.includes(day) ? 'selected' : ''} onClick={() => toggleSelection('days', day)}>{day.slice(0, 3)}</button>)}</div>
          </div>
        </section>

        <section className="planner-section-card">
          <header><span>02</span><div><h2>Estratégia</h2><p>Escolha o caminho editorial; use “Entender” para ver como a Nova irá raciocinar.</p></div></header>
          <div className="planner-section-body">
            <div className="strategy-card-grid">{CONTENT_STRATEGIES.map(strategy => <article role="radio" aria-checked={formData.strategy === strategy.id} tabIndex="0" key={strategy.id} className={`strategy-card ${formData.strategy === strategy.id ? 'selected' : ''}`} onClick={() => setFormData(current => ({ ...current, strategy: strategy.id }))} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setFormData(current => ({ ...current, strategy: strategy.id })); }} style={{ '--strategy-accent': strategy.accent }}><i/><span className="strategy-card-copy"><strong>{strategy.label}</strong><small>{strategy.description}</small><button type="button" onClick={event => { event.stopPropagation(); setStrategyModal(strategy); }}>Entender estratégia <b>→</b></button></span><b className="strategy-check">{formData.strategy === strategy.id ? '✓' : ''}</b></article>)}</div>
            <div className="form-group"><label className="form-label">Orientação adicional <span className="optional-label">opcional</span></label><input className="form-input" name="strategyDetails" value={formData.strategyDetails} onChange={handleChange} placeholder="Ex.: lançamento em 20/09, priorizar geração de leads, campanha de inverno..." /></div>
          </div>
        </section>

        <section className="planner-section-card">
          <header><span>03</span><div><h2>Objetivo e canais</h2><p>O mesmo tema será adaptado ao comportamento de cada público.</p></div></header>
          <div className="planner-section-body">
            <div className="form-group"><label className="form-label">O que você quer alcançar? <b className="required">*</b></label><textarea className="form-textarea planner-objective" name="objective" value={formData.objective} onChange={handleChange} placeholder="Ex.: gerar 30 pedidos de orçamento para o novo serviço, reforçando autoridade sem usar descontos." /></div>
            <label className="form-label">Redes deste planejamento</label>
            <div className="planner-network-grid">{AVAILABLE_NETWORKS.map(network => <button key={network} type="button" className={formData.networks.includes(network) ? 'selected' : ''} onClick={() => toggleSelection('networks', network)}><span>{network.slice(0,2).toUpperCase()}</span>{network}</button>)}</div>
            <p className="network-adaptation-note"><strong>Títulos relacionados, textos diferentes.</strong> A Nova preserva o tema central, mas muda gancho, profundidade, linguagem e CTA para cada rede.</p>
          </div>
        </section>
      </div>

      <aside className="planner-summary-card">
        <span className="summary-eyebrow">Resumo do plano</span>
        <h3>{settings.niche}</h3>
        <Link to="/meu-negocio">Editar preferências</Link>
        <dl>
          <div><dt>Estratégia</dt><dd><i style={{ background: selectedStrategy?.accent }}/>{selectedStrategy?.label}</dd></div>
          <div><dt>Publicações</dt><dd>{publicationCount}</dd></div>
          <div><dt>Redes</dt><dd>{formData.networks.length}</dd></div>
          <div><dt>Continuidade</dt><dd><span className="continuity-dot"/> Histórico ativo</dd></div>
        </dl>
        <div className="summary-info-box"><strong>Todo o calendário entra no contexto</strong><p>{continuityText}</p></div>
        <button className="btn btn-primary planner-submit" disabled={loading || checkingPlan}>{checkingPlan ? 'Verificando período...' : 'Gerar planejamento'}</button>
        <small className="summary-footnote">A geração pode levar alguns minutos, dependendo do período e do número de redes.</small>
      </aside>

      {strategyModal && <StrategyModal strategy={strategyModal} onClose={() => setStrategyModal(null)} />}
      {loading && <GenerationExperience onCancel={onCancel} cancelling={cancelling} />}
      {showOverwriteModal && <div className="modal-overlay"><div className="modal-box overwrite-modal"><span className="overwrite-icon">↻</span><h3>Já existe um plano neste período</h3><p>O planejamento de <strong>{existingLabel}</strong> será regenerado. Publicações marcadas como feitas serão preservadas; as demais serão substituídas considerando todos os outros planos.</p><div><button type="button" className="btn btn-secondary" onClick={() => setShowOverwriteModal(false)}>Cancelar</button><button type="button" className="btn btn-primary" onClick={submitPlan}>Regenerar período</button></div></div></div>}
    </form>
  );
}

export default CreatorForm;

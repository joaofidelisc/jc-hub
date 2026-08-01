import React, { useState, useEffect } from 'react';
import './Creator.css';
import { toast } from 'react-toastify';
import axios from 'axios';

function CreatorResults({ results, planId, onReset, onNext, onPrev }) {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedDay, setExpandedDay] = useState(null);
  const [plan, setPlan] = useState([]);

  useEffect(() => {
    setPlan(results?.planejamento || []);
  }, [results]);

  if (plan.length === 0) {
    return (
      <div className="creator-container">
        <div className="creator-card text-center">
          <h3>Nenhum conteúdo gerado.</h3>
          <button className="btn btn-primary mt-4" onClick={onReset}>Tentar Novamente</button>
        </div>
      </div>
    );
  }

  // Get all unique networks present in the generated content
  const firstItemNetworks = Object.keys(plan[0]?.conteudo_por_rede || {});
  const networks = firstItemNetworks.length > 0 ? firstItemNetworks : ['instagram'];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Conteúdo copiado!');
  };

  const getFunnelInfo = (etapa) => {
    const e = etapa.toLowerCase();
    if (e.includes('topo')) {
      return { label: 'Topo (Atrair)', class: 'funnel-topo', bars: 1 };
    }
    if (e.includes('meio')) {
      return { label: 'Meio (Engajar)', class: 'funnel-meio', bars: 2 };
    }
    if (e.includes('fundo')) {
      return { label: 'Fundo (Vender)', class: 'funnel-fundo', bars: 3 };
    }
    return { label: 'Topo (Atrair)', class: 'funnel-topo', bars: 1 };
  };

  const toggleDone = async (e, index) => {
    e.stopPropagation();
    if (!planId) {
      toast.warning("Este plano não foi salvo corretamente.");
      return;
    }
    
    // Atualização Otimista
    const newPlan = [...plan];
    newPlan[index].feito = !newPlan[index].feito;
    setPlan(newPlan);
    
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`/api/creator/plan/${planId}/toggle/${index}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      // Reverter em caso de erro
      const revertPlan = [...plan];
      revertPlan[index].feito = !revertPlan[index].feito;
      setPlan(revertPlan);
      toast.error("Erro ao atualizar status.");
    }
  };

  const doneCount = plan.filter(i => i.feito).length;
  const progressPercent = plan.length > 0 ? (doneCount / plan.length) * 100 : 0;

  return (
    <div className="creator-container">
      <div className="creator-card" style={{ position: 'relative' }}>
        <div className="creator-sticky-header">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>O que a Nova preparou para você ✨</h2>
          
          <div className="creator-action-bar">
            {(onPrev || onNext) && (
              <div className="segmented-control">
                <button 
                  className="nav-btn" 
                  onClick={onPrev} 
                  disabled={!onPrev}
                  title="Planejamento Anterior"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div className="divider"></div>
                <button 
                  className="nav-btn" 
                  onClick={onNext} 
                  disabled={!onNext}
                  title="Próximo Planejamento"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            )}
            
            <button className="btn-primary-action" onClick={onReset}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Novo Plano
            </button>
          </div>
        </div>

        <div className="creator-progress-container mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="progress-label">Progresso da Semana</span>
            <span className="progress-count">{doneCount} de {plan.length} concluídos</span>
          </div>
          <div className="creator-progress-bar-bg">
            <div className="creator-progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <div className="results-tabs">
          {networks.map((network, index) => (
            <button
              key={network}
              className={`tab-btn ${index === activeTab ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {network.charAt(0).toUpperCase() + network.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="results-timeline">
          {plan.map((item, index) => {
            const isExpanded = expandedDay === index;
            const networkContent = item.conteudo_por_rede?.[networks[activeTab]];
            
            if (!networkContent) return null;

            const funnel = getFunnelInfo(item.etapa_funil);

            return (
              <div key={index} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className={`accordion-item ${item.feito ? 'done' : ''}`}>
                <div 
                  className="accordion-header"
                  onClick={() => setExpandedDay(isExpanded ? null : index)}
                >
                  <div className="accordion-title">
                    <span className="accordion-day">
                      {item.dia} 
                      {item.data_sugerida && ` • ${item.data_sugerida}`}
                    </span>
                    <span 
                      className="accordion-theme" 
                      style={{ 
                        textDecoration: item.feito ? 'line-through' : 'none', 
                        opacity: item.feito ? 0.6 : 1,
                        transition: 'all 0.3s'
                      }}
                    >
                      {item.tema_central}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <button 
                      className={`btn btn-sm ${item.feito ? 'btn-success' : 'btn-outline-secondary'}`} 
                      onClick={(e) => toggleDone(e, index)}
                      style={{ borderRadius: '20px', fontSize: '0.75rem', padding: '4px 12px', fontWeight: 600 }}
                    >
                      {item.feito ? '✓ Feito' : 'Marcar Feito'}
                    </button>
                    <div className="funnel-badge-container">
                      <div className="funnel-bars">
                        <div className={`funnel-bar ${funnel.bars >= 1 ? funnel.class : ''}`}></div>
                        <div className={`funnel-bar ${funnel.bars >= 2 ? funnel.class : ''}`}></div>
                        <div className={`funnel-bar ${funnel.bars >= 3 ? funnel.class : ''}`}></div>
                      </div>
                      <span className={`funnel-badge-text ${funnel.class}`}>
                        {funnel.label}
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button 
                        className="creator-action-btn"
                        style={{ padding: '6px' }}
                        title="Copiar Conteúdo"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(`Tema: ${item.tema_central}\n\n${networkContent.roteiro_ou_legenda}\n\n${networkContent.cta || ''}`);
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>

                      <button 
                        className="creator-action-btn"
                        style={{ color: 'var(--primary)', padding: '6px' }}
                        title="Gerar Imagem"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info('Geração de imagem será implementada em breve!');
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                      </button>
                    </div>

                    <span className="text-muted" style={{ marginLeft: '4px' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="accordion-body">
                    <div className="creator-chips-container">
                      {item.horario_sugerido && (
                        <div className="pill-chip">
                          <span className="chip-icon">⏰</span>
                          {item.horario_sugerido}
                        </div>
                      )}
                      
                      {item.noticia_tendencia_usada && (
                        <div className="pill-chip trend">
                          <span className="chip-icon">🔥</span>
                          {item.noticia_tendencia_usada}
                        </div>
                      )}
                      
                      <div className="pill-chip format">
                        <span className="chip-icon">✨</span>
                        {networkContent.formato}
                      </div>
                    </div>
                    
                    <div className="script-block mb-4">
                      <h5>Roteiro / Legenda</h5>
                      <p>{networkContent.roteiro_ou_legenda}</p>
                    </div>
                    
                    {networkContent.cta && (
                      <div className="cta-block">
                        <h5>🎯 Call to Action (CTA)</h5>
                        <p>{networkContent.cta}</p>
                      </div>
                    )}

                  </div>
                )}
              </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CreatorResults;

import React, { useState, useEffect } from 'react';
import './Creator.css';
import { toast } from 'react-toastify';
import axios from 'axios';

function CreatorResults({ results, planId, onReset }) {
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

  const getFunnelClass = (etapa) => {
    const e = etapa.toLowerCase();
    if (e.includes('topo')) return 'funnel-topo';
    if (e.includes('meio')) return 'funnel-meio';
    if (e.includes('fundo')) return 'funnel-fundo';
    return 'funnel-topo';
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

  return (
    <div className="creator-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>O que a Nova preparou para você ✨</h2>
        <button className="btn btn-secondary" onClick={onReset}>Novo Plano</button>
      </div>

      <div className="creator-card">
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

        <div className="results-content">
          {plan.map((item, index) => {
            const isExpanded = expandedDay === index;
            const networkContent = item.conteudo_por_rede?.[networks[activeTab]];
            
            if (!networkContent) return null;

            return (
              <div key={index} className="accordion-item">
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
                    <span className={`funnel-badge ${getFunnelClass(item.etapa_funil)}`}>
                      {item.etapa_funil}
                    </span>
                    <span className="text-muted">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="accordion-body">
                    {item.horario_sugerido && (
                      <div className="content-block" style={{ backgroundColor: 'rgba(20, 184, 166, 0.05)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--primary)', marginBottom: '24px' }}>
                        <h5>⏰ Horário Estratégico Sugerido</h5>
                        <p style={{ margin: 0, fontWeight: 500 }}>{item.horario_sugerido}</p>
                      </div>
                    )}

                    {item.noticia_tendencia_usada && (
                      <div className="trend-block mb-4">
                        <h5>🔥 TENDÊNCIA UTILIZADA</h5>
                        <p className="mb-0">{item.noticia_tendencia_usada}</p>
                      </div>
                    )}
                    
                    <div className="content-block">
                      <h5>Formato</h5>
                      <p>{networkContent.formato}</p>
                    </div>
                    
                    <div className="content-block">
                      <h5>Roteiro / Legenda</h5>
                      <p>{networkContent.roteiro_ou_legenda}</p>
                    </div>
                    
                    {networkContent.cta && (
                      <div className="content-block">
                        <h5>Call to Action (CTA)</h5>
                        <p>{networkContent.cta}</p>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-top" style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        className="copy-btn"
                        onClick={() => handleCopy(`Tema: ${item.tema_central}\n\n${networkContent.roteiro_ou_legenda}\n\n${networkContent.cta || ''}`)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copiar Conteúdo
                      </button>

                      <button 
                        className="copy-btn"
                        style={{ color: 'var(--primary)', borderColor: 'var(--primary)', backgroundColor: 'rgba(20, 184, 166, 0.05)' }}
                        onClick={() => toast.info('Geração de imagem será implementada em breve!')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        Gerar Imagem
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CreatorResults;

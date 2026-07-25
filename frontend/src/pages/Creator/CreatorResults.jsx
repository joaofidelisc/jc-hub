import React, { useState } from 'react';
import './Creator.css';
import { toast } from 'react-toastify';

function CreatorResults({ results, onReset }) {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedDay, setExpandedDay] = useState(null);

  const plan = results?.planejamento || [];
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
                    <span className="accordion-day">{item.dia}</span>
                    <span className="accordion-theme">{item.tema_central}</span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
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
                    {item.noticia_tendencia_usada && (
                      <div className="content-block mb-4 p-3 bg-light rounded">
                        <h5>🔥 Tendência Utilizada</h5>
                        <p className="mb-0 text-muted">{item.noticia_tendencia_usada}</p>
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

                    <div className="mt-4 pt-3 border-top">
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

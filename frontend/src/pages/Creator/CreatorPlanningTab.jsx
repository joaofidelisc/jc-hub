import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Creator.css';

function CreatorPlanningTab({ onSelect }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const { data } = await axios.get('/api/creator/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(data);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao buscar histórico de planejamentos.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getWeekLabel = (item) => {
    if (item.plan_json?.week_label) {
      return `Semana ${item.plan_json.week_label}`;
    }
    // Fallback para criados antes dessa funcionalidade
    const date = new Date(item.created_at);
    return `Gerado em ${date.toLocaleDateString('pt-BR')}`;
  };

  const getProgress = (planJson) => {
    const posts = planJson?.planejamento || [];
    if (posts.length === 0) return { done: 0, total: 0 };
    const done = posts.filter(p => p.feito).length;
    return { done, total: posts.length };
  };

  // Agrupar por semana
  const grouped = history.reduce((acc, item) => {
    const label = getWeekLabel(item);
    if (!acc[label]) acc[label] = [];
    acc[label].push(item);
    return acc;
  }, {});

  return (
    <div className="creator-planning-container" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      
      {loading ? (
        <div className="text-center py-5">
          <p style={{ color: 'var(--text-secondary)' }}>Carregando seus planejamentos...</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-5 creator-card">
          <h4 style={{ color: 'var(--text-primary)' }}>Nenhum planejamento encontrado.</h4>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>Use a aba Gerador para criar o seu primeiro roteiro semanal!</p>
        </div>
      ) : (
        <div className="planning-groups" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(grouped).map(([weekLabel, items]) => (
            <div key={weekLabel} className="week-group">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {weekLabel}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {items.map(item => {
                  const { done, total } = getProgress(item.plan_json);
                  const isAllDone = total > 0 && done === total;
                  const progressPct = total > 0 ? (done / total) * 100 : 0;
                  
                  return (
                    <div 
                      key={item.id} 
                      className="creator-card planning-card"
                      onClick={() => onSelect(item)}
                      style={{
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: `${progressPct}%`, backgroundColor: isAllDone ? '#22c55e' : 'var(--primary)', transition: 'width 0.3s' }}></div>
                      
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Plano de Conteúdo</h4>
                        {isAllDone && (
                          <span className="badge" style={{ backgroundColor: '#22c55e', color: '#fff', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px' }}>CONCLUÍDO</span>
                        )}
                      </div>
                      
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                        Contém {total} postagen{total > 1 ? 's' : ''}.
                      </p>
                      
                      <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: isAllDone ? '#22c55e' : 'var(--text-secondary)', fontWeight: 500 }}>
                          {done} de {total} feitos
                        </span>
                        
                        <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Visualizar
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CreatorPlanningTab;

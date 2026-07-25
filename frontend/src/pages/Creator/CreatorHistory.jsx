import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Creator.css';

function CreatorHistory({ onSelect, onBack }) {
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

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="creator-card" style={{ width: '100%', maxWidth: '600px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Seu Histórico</h3>
        <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>Voltar</button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <p className="text-muted">Carregando histórico...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted">Nenhum planejamento gerado ainda.</p>
        </div>
      ) : (
        <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
          {history.map((item) => {
            // Conta quantos dias tem no plano
            const daysCount = item.plan_json?.planejamento?.length || 0;
            return (
              <div 
                key={item.id} 
                className="history-card"
                onClick={() => onSelect(item)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'var(--bg-subtle)';
                }}
              >
                <div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                    Planejamento de {daysCount} dias
                  </h5>
                  <small style={{ color: 'var(--text-muted)' }}>
                    Gerado em {formatDate(item.created_at)}
                  </small>
                </div>
                <div style={{ color: 'var(--primary)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CreatorHistory;

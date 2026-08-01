import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import './Creator.css';

function getWeeksForMonth(year, month) {
  const weeks = [];
  let d = new Date(year, month, 1);
  let day = d.getDay();
  let diff = d.getDate() - day + (day === 0 ? -6 : 1);
  let currentMonday = new Date(d.setDate(diff));

  for (let i = 0; i < 4; i++) {
    let weekStart = new Date(currentMonday);
    let weekEnd = new Date(currentMonday);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const pad = (n) => n.toString().padStart(2, '0');
    const label = `de ${pad(weekStart.getDate())}/${pad(weekStart.getMonth()+1)}/${weekStart.getFullYear()} a ${pad(weekEnd.getDate())}/${pad(weekEnd.getMonth()+1)}/${weekEnd.getFullYear()}`;
    
    weeks.push({
      title: `Semana ${i+1}`,
      label,
      start: weekStart,
      end: weekEnd
    });
    currentMonday.setDate(currentMonday.getDate() + 7);
  }
  return weeks;
}

function Planejamentos() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  useLayout('Planejamentos', 'Gerencie seus calendários de conteúdo', user);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const [meRes, histRes] = await Promise.all([
          axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/creator/history', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setUser(meRes.data.user);
        setHistory(histRes.data);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getProgress = (planJson) => {
    const posts = planJson?.planejamento || [];
    if (posts.length === 0) return { done: 0, total: 0 };
    const done = posts.filter(p => p.feito).length;
    return { done, total: posts.length };
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const currentMonthName = `${monthNames[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
  const weeks = getWeeksForMonth(currentDate.getFullYear(), currentDate.getMonth());

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  const handleSelect = (plan) => {
    navigate('/criador-ia', { state: { selectedPlan: plan } });
  };

  return (
    <div className="creator-planning-container" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>Meus Planejamentos</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-card)', padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}>
          <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: '130px', textAlign: 'center' }}>{currentMonthName}</span>
          <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <p style={{ color: 'var(--text-secondary)' }}>Carregando seus planejamentos...</p>
        </div>
      ) : (
        <div className="planning-groups" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {weeks.map((week, idx) => {
            const planForWeek = history.find(h => h.plan_json?.week_label === week.label);
            
            if (planForWeek) {
              const { done, total } = getProgress(planForWeek.plan_json);
              const isAllDone = total > 0 && done === total;
              const progressPct = total > 0 ? (done / total) * 100 : 0;
              
              return (
                <div key={idx} className="creator-card planning-card" onClick={() => handleSelect(planForWeek)} style={{ padding: '24px', cursor: 'pointer', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: `${progressPct}%`, backgroundColor: isAllDone ? 'var(--success)' : 'var(--primary)', transition: 'width 0.3s' }}></div>
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>{week.title}</h3>
                      {isAllDone && <span className="badge badge-success">CONCLUÍDO</span>}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{week.label}</p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 4px 0' }}>{done} de {total} posts feitos</p>
                    <span style={{ color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      Visualizar <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </span>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={idx} className="creator-card planning-card" onClick={() => navigate('/criador-ia')} style={{ padding: '24px', cursor: 'pointer', borderStyle: 'dashed', backgroundColor: 'var(--bg-subtle)', opacity: 0.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{week.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{week.label}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 4px 0', fontWeight: 500 }}>Ainda não gerado</p>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Clique para gerar plano</span>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

export default Planejamentos;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Creator.css';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import CreatorForm from './CreatorForm';
import CreatorResults from './CreatorResults';
import CreatorPlanningTab from './CreatorPlanningTab';
import NovaSideChat from './NovaSideChat';

function CreatorLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeMainTab, setActiveMainTab] = useState('gerador');

  useLayout('Nova', 'Sua Assistente de Criação', user);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { navigate('/login', { replace: true }); return; }

        const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!data?.user) { navigate('/login', { replace: true }); return; }
        setUser(data.user);
      } catch {
        navigate('/login', { replace: true });
      }
    };
    loadData();
  }, [navigate]);

  const handleGenerate = async (formData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post('/api/creator/generate', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Houve um erro ao gerar o planejamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!results ? (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
          
          <div className="main-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: 'var(--bg-subtle)', padding: '6px', borderRadius: '12px' }}>
            <button 
              className={`main-tab-btn ${activeMainTab === 'gerador' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('gerador')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              Gerador
            </button>
            <button 
              className={`main-tab-btn ${activeMainTab === 'planejamentos' ? 'active' : ''}`}
              onClick={() => setActiveMainTab('planejamentos')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Planejamentos
            </button>
          </div>

          {activeMainTab === 'planejamentos' ? (
            <CreatorPlanningTab 
              onSelect={(plan) => {
                setResults(plan);
                setActiveMainTab('gerador');
              }} 
            />
          ) : (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <CreatorForm onSubmit={handleGenerate} loading={loading} />
            </div>
          )}
        </div>
      ) : (
        <div className="creator-split-layout">
          <div className="creator-main-content">
            <CreatorResults 
              results={results.plan_json || results} 
              planId={results.id}
              onReset={() => setResults(null)} 
            />
          </div>
          <div className="creator-sidebar">
            <NovaSideChat contextData={results.plan_json || results} />
          </div>
        </div>
      )}
    </>
  );
}

export default CreatorLayout;

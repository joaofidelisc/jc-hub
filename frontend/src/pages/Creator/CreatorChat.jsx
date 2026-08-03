import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Creator.css';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import CreatorForm from './CreatorForm';
import CreatorResults from './CreatorResults';
import NovaSideChat from './NovaSideChat';

function CreatorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  
  const [history, setHistory] = useState([]);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(-1);

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
    
    // Check if we came from Planejamentos with a selected plan
    if (location.state?.selectedPlan) {
      setResults(location.state.selectedPlan);
      // Clean up state so refresh doesn't trigger it again
      window.history.replaceState({}, document.title);
    }
  }, [navigate, location]);

  useEffect(() => {
    if (results?.id) {
      const fetchHistory = async () => {
        try {
          const token = localStorage.getItem('accessToken');
          const { data } = await axios.get('/api/creator/history', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setHistory(data);
          const index = data.findIndex(p => p.id === results.id);
          setCurrentPlanIndex(index);
        } catch (e) {
          console.error(e);
        }
      };
      fetchHistory();
    }
  }, [results]);

  const handleNextPlan = () => {
    if (currentPlanIndex > 0) {
      setResults(history[currentPlanIndex - 1]);
    }
  };

  const handlePrevPlan = () => {
    if (currentPlanIndex < history.length - 1 && currentPlanIndex !== -1) {
      setResults(history[currentPlanIndex + 1]);
    }
  };

  const handleGenerate = async (formData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post('/api/creator/generate', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(response.data);
      toast.success("Plano gerado com sucesso! Verifique também a aba Planejamentos no menu.");
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
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <CreatorForm onSubmit={handleGenerate} loading={loading} user={user} />
          </div>
        </div>
      ) : (
        <div className="creator-split-layout">
          <div className="creator-main-content">
            <CreatorResults 
              results={results.plan_json || results} 
              planId={results.id}
              user={user}
              onReset={() => setResults(null)} 
              onNext={currentPlanIndex > 0 ? handleNextPlan : null}
              onPrev={currentPlanIndex !== -1 && currentPlanIndex < history.length - 1 ? handlePrevPlan : null}
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

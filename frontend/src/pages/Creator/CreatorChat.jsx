import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import CreatorForm from './CreatorForm';
import CreatorResults from './CreatorResults';
import NovaSideChat from './NovaSideChat';
import './Creator.css';

function CreatorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [results, setResults] = useState(location.state?.selectedPlan || null);
  const [history, setHistory] = useState([]);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(-1);
  const generationIdRef = useRef(null);
  const generationControllerRef = useRef(null);
  useLayout(results ? 'Planejamento' : 'Criar planejamento', results ? 'Revise, edite e acompanhe seu calendário' : 'Defina período, estratégia e objetivo para a Nova', user);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return navigate('/login', { replace: true });
        const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        setUser(data.user);
      } catch {
        navigate('/login', { replace: true });
      }
    };
    loadUser();
    if (location.state?.selectedPlan) navigate(location.pathname, { replace: true, state: null });
  }, [navigate, location.pathname]);

  const loadHistory = useCallback(async (selectedId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const { data } = await axios.get('/api/creator/history', { headers: { Authorization: `Bearer ${token}` } });
      setHistory(data);
      setCurrentPlanIndex(data.findIndex(plan => plan.id === selectedId));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (results?.id) loadHistory(results.id);
  }, [results?.id, loadHistory]);

  const handleGenerate = async (formData) => {
    const generationId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const controller = new AbortController();
    generationIdRef.current = generationId;
    generationControllerRef.current = controller;
    setCancelling(false);
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const { data } = await axios.post(
        '/api/creator/generate',
        { ...formData, generationId },
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        },
      );
      setResults(data);
      toast.success('Planejamento criado e salvo.');
    } catch (error) {
      if (axios.isCancel(error) || error.code === 'ERR_CANCELED') return;
      console.error(error);
      toast.error(error.response?.data?.detail || 'Houve um erro ao gerar o planejamento.');
    } finally {
      if (generationIdRef.current === generationId) {
        generationIdRef.current = null;
        generationControllerRef.current = null;
        setLoading(false);
        setCancelling(false);
      }
    }
  };

  const handleCancelGeneration = async () => {
    const generationId = generationIdRef.current;
    const controller = generationControllerRef.current;
    if (!generationId || cancelling) return;

    setCancelling(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `/api/creator/generation/${encodeURIComponent(generationId)}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.info('Criação cancelada. Nenhum planejamento novo foi salvo.');
    } catch (error) {
      console.error(error);
      toast.warning('A tela foi liberada, mas não foi possível confirmar o cancelamento no servidor.');
    } finally {
      controller?.abort();
      generationIdRef.current = null;
      generationControllerRef.current = null;
      setLoading(false);
      setCancelling(false);
    }
  };

  const handleRegenerate = async () => {
    if (!results?.id) return;
    setRegenerating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const { data } = await axios.post(`/api/creator/plan/${results.id}/regenerate`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setResults(data);
      loadHistory(data.id);
      toast.success('Planejamento regenerado com continuidade editorial.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Não foi possível regenerar este planejamento.');
    } finally { setRegenerating(false); }
  };

  const handlePlanChange = (planJson) => {
    setResults(current => ({ ...current, plan_json: planJson }));
    loadHistory(results?.id);
  };

  const selectHistoryPlan = (index) => {
    const plan = history[index];
    if (plan) {
      setResults(plan);
      setCurrentPlanIndex(index);
    }
  };

  if (!results) return <CreatorForm onSubmit={handleGenerate} onCancel={handleCancelGeneration} loading={loading} cancelling={cancelling} user={user} />;

  return (
    <div className="creator-split-layout">
      <div className="creator-main-content">
        <CreatorResults
          results={results.plan_json || results}
          planId={results.id}
          user={user}
          regenerating={regenerating}
          onRegenerate={handleRegenerate}
          onPlanChange={handlePlanChange}
          onReset={() => setResults(null)}
          onNext={currentPlanIndex > 0 ? () => selectHistoryPlan(currentPlanIndex - 1) : null}
          onPrev={currentPlanIndex >= 0 && currentPlanIndex < history.length - 1 ? () => selectHistoryPlan(currentPlanIndex + 1) : null}
        />
      </div>
      <aside className="creator-sidebar"><NovaSideChat key={results.id} contextData={results.plan_json || results} planId={results.id} onPlanChange={handlePlanChange} /></aside>
    </div>
  );
}

export default CreatorLayout;

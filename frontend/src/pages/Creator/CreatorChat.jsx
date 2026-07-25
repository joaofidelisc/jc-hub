import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Creator.css';
import AppLayout from '../../components/AppLayout/AppLayout';
import CreatorForm from './CreatorForm';
import CreatorResults from './CreatorResults';
import NovaSideChat from './NovaSideChat';

function CreatorLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

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
    <AppLayout title="Nova" subtitle="Sua Assistente de Criação" user={user}>
      {!results ? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CreatorForm onSubmit={handleGenerate} loading={loading} />
        </div>
      ) : (
        <div className="creator-split-layout">
          <div className="creator-main-content">
            <CreatorResults 
              results={results} 
              onReset={() => setResults(null)} 
            />
          </div>
          <div className="creator-sidebar">
            <NovaSideChat contextData={results} />
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default CreatorLayout;

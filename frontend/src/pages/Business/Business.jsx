import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import BusinessProfile from '../Profile/BusinessProfile';
import '../Profile/Profile.css';

function Business() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useLayout('Meu negócio', 'Preferências que orientam todos os planejamentos da Nova', user);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return navigate('/login', { replace: true });
        const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        setUser(data.user);
      } catch (error) {
        toast.error('Não foi possível carregar as preferências do negócio.');
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  if (loading) return <div className="page-loading"><span className="loading-spinner"/><p>Carregando seu negócio...</p></div>;

  return (
    <div className="business-page">
      <div className="business-intro-card">
        <span className="business-intro-icon">✦</span>
        <div>
          <h2>A base estratégica da sua marca</h2>
          <p>A Nova reutiliza estas informações em cada planejamento. Objetivo, período e estratégia continuam sendo escolhidos a cada nova campanha.</p>
        </div>
      </div>
      <BusinessProfile user={user} onUpdate={(settings) => setUser(current => ({ ...current, creator_settings: settings }))} />
    </div>
  );
}

export default Business;

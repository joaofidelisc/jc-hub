import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AppLayout from '../../components/AppLayout/AppLayout';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"/>
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral" user={user}>
      {/* Welcome */}
      <div className="welcome-bar">
        <div>
          <h2 className="welcome-title">Olá, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="welcome-sub">Bem-vindo(a) ao seu painel principal.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;

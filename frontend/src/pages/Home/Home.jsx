import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  // Use layout context without the default title, we will render our own Dashboard title
  useLayout('', '', user);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { navigate('/login', { replace: true }); return; }

        const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!data?.user) { navigate('/login', { replace: true }); return; }
        setUser(data.user);

        const histRes = await axios.get('/api/creator/history', { headers: { Authorization: `Bearer ${token}` } });
        setHistory(histRes.data || []);
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

  const totalPlans = history.length;
  let totalPosts = 0;
  let donePosts = 0;
  
  history.forEach(item => {
    const posts = item.plan_json?.planejamento || [];
    totalPosts += posts.length;
    donePosts += posts.filter(p => p.feito).length;
  });

  const progressPct = totalPosts > 0 ? Math.round((donePosts / totalPosts) * 100) : 0;

  // Mock data for BarChart (Visit And Sales Statistics)
  const barData = [
    { name: 'JAN', chin: 40, usa: 24, uk: 24 },
    { name: 'FEB', chin: 30, usa: 13, uk: 22 },
    { name: 'MAR', chin: 20, usa: 48, uk: 22 },
    { name: 'APR', chin: 27, usa: 39, uk: 20 },
    { name: 'MAY', chin: 18, usa: 48, uk: 21 },
    { name: 'JUN', chin: 23, usa: 38, uk: 25 },
    { name: 'JUL', chin: 34, usa: 43, uk: 21 },
    { name: 'AUG', chin: 44, usa: 35, uk: 19 },
  ];

  // Mock data for PieChart (Traffic Sources)
  const pieData = [
    { name: 'Search Engines', value: 30, color: '#90caf9' }, // Light Blue
    { name: 'Direct Click', value: 30, color: '#07cdae' }, // Green
    { name: 'Bookmarks Click', value: 40, color: '#fe7096' }, // Pink
  ];

  return (
    <div>
      <div className="page-header-title">
        <div className="icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <h3>Dashboard</h3>
      </div>

      {/* Gradient Stats Cards */}
      <div className="purple-stats-grid">
        {/* Weekly Sales equivalent */}
        <div className="purple-card card-danger">
          <div className="purple-card-header">
            <h4 className="purple-card-title">Progresso Semanal</h4>
            <div className="purple-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
            </div>
          </div>
          <div className="purple-card-value">{progressPct}%</div>
          <div className="purple-card-trend">Aumentado em 60%</div>
        </div>

        {/* Weekly Orders equivalent */}
        <div className="purple-card card-info">
          <div className="purple-card-header">
            <h4 className="purple-card-title">Postagens Geradas</h4>
            <div className="purple-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>
            </div>
          </div>
          <div className="purple-card-value">{totalPosts}</div>
          <div className="purple-card-trend">Diminuído em 10%</div>
        </div>

        {/* Visitors Online equivalent */}
        <div className="purple-card card-success">
          <div className="purple-card-header">
            <h4 className="purple-card-title">Planos Ativos</h4>
            <div className="purple-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
          </div>
          <div className="purple-card-value">{totalPlans}</div>
          <div className="purple-card-trend">Aumentado em 5%</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Estatísticas de Visitas e Vendas</h3>
            <div className="chart-legend">
              <div className="chart-legend-item"><span className="chart-legend-dot dot-primary"></span> CHN</div>
              <div className="chart-legend-item"><span className="chart-legend-dot dot-danger"></span> USA</div>
              <div className="chart-legend-item"><span className="chart-legend-dot dot-info"></span> UK</div>
            </div>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={barData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Bar dataKey="chin" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="usa" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="uk" fill="var(--info)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Fontes de Tráfego</h3>
          </div>
          <div style={{ width: '100%', height: '220px', display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pieData.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></span>
                  {item.name}
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

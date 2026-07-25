import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [stats, setStats] = useState(null);
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [emailToRemove, setEmailToRemove] = useState(null);

  useLayout('Painel Admin', 'Gerencie o sistema e usuários', user);

  const fetchStats = async (token) => {
    try {
      const { data } = await axios.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmails = async (token) => {
    try {
      const { data } = await axios.get('/api/admin/allowed-emails', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllowedEmails(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { navigate('/login', { replace: true }); return; }

        const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!data?.user || data.user.role !== 'superadmin') { 
          navigate('/', { replace: true }); 
          return; 
        }
        setUser(data.user);

        await Promise.all([fetchStats(token), fetchEmails(token)]);
      } catch {
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post('/api/admin/allowed-emails', 
        { email: newEmail.trim() },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success('E-mail liberado com sucesso!');
      setNewEmail('');
      await fetchEmails(token);
      await fetchStats(token); // Update pending/total count
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Erro ao adicionar e-mail');
    }
  };

  const handleRemoveEmail = async (id) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`/api/admin/allowed-emails/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('E-mail removido');
      await fetchEmails(token);
      await fetchStats(token);
    } catch (err) {
      toast.error('Erro ao remover e-mail');
    } finally {
      setEmailToRemove(null);
    }
  };

  const confirmRemove = (item) => {
    if (item.email === user.email) {
      toast.error("Você não pode remover o seu próprio usuário!");
      return;
    }
    setEmailToRemove(item);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"/>
        <p>Carregando administração...</p>
      </div>
    );
  }

  return (
    <>
      <div className="admin-dashboard">
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Visão Geral
          </button>
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Liberar Usuários
          </button>
        </div>

        {activeTab === 'overview' && stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <span className="stat-label">Total de Usuários</span>
              <span className="stat-value">{stats.total_users}</span>
            </div>
            <div className="admin-stat-card">
              <span className="stat-label">Novos Usuários (7d)</span>
              <span className="stat-value">{stats.new_users_7d}</span>
            </div>
            <div className="admin-stat-card">
              <span className="stat-label">E-mails Liberados</span>
              <span className="stat-value">{stats.total_allowed_emails}</span>
            </div>
            <div className="admin-stat-card">
              <span className="stat-label">Convites Pendentes</span>
              <span className="stat-value">{stats.pending_allowed_emails}</span>
            </div>
            <div className="admin-stat-card">
              <span className="stat-label">Integrações Ativas</span>
              <span className="stat-value">{stats.active_integrations}</span>
            </div>
            <div className="admin-stat-card">
              <span className="stat-label">Regras de Automação</span>
              <span className="stat-value">{stats.active_automation_rules} / {stats.total_automation_rules}</span>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-users-tab">
            <form className="allow-email-form" onSubmit={handleAddEmail} style={{ display: 'block', marginBottom: '2rem' }}>
              <div className="form-group" style={{ maxWidth: '500px' }}>
                <label className="form-label" htmlFor="newEmail">E-mail do novo usuário</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input
                    id="newEmail"
                    type="email"
                    className="form-input"
                    placeholder="email@exemplo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>Liberar E-mail</button>
                </div>
              </div>
            </form>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>E-mail</th>
                    <th>Status</th>
                    <th>Data de Adição</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {allowedEmails.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                        Nenhum e-mail liberado ainda.
                      </td>
                    </tr>
                  ) : (
                    allowedEmails.map(item => (
                      <tr key={item.id}>
                        <td>{item.email}</td>
                        <td>
                          {item.is_registered ? (
                            <span className="badge registered">Cadastrado</span>
                          ) : (
                            <span className="badge pending">Pendente</span>
                          )}
                        </td>
                        <td>{new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                        <td>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                            onClick={() => confirmRemove(item)}
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {emailToRemove && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-lg)',
            width: '90%', maxWidth: '400px', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Confirmar Remoção</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Tem certeza que deseja remover o acesso de <strong>{emailToRemove.email}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setEmailToRemove(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={() => handleRemoveEmail(emailToRemove.id)}>
                Remover Acesso
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;

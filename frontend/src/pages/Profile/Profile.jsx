import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('account');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });

  useLayout('Perfil', 'Gerencie suas informações de conta', user);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { navigate('/login', { replace: true }); return; }

        const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!data?.user) { navigate('/login', { replace: true }); return; }

        setUser(data.user);
        setFormData({ name: data.user.name || '', email: data.user.email || '', currentPassword: '', newPassword: '', confirmPassword: '' });
      } catch {
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put('/api/profile', { name: formData.name, email: formData.email }, { headers: { Authorization: `Bearer ${token}` } });
      setUser(prev => ({ ...prev, name: formData.name, email: formData.email }));
      toast.success('Perfil atualizado com sucesso!');
      setEditing(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Preencha todos os campos de senha'); return;
    }
    if (formData.newPassword !== formData.confirmPassword) { toast.error('As senhas não coincidem'); return; }
    if (formData.newPassword.length < 6) { toast.error('A nova senha deve ter no mínimo 6 caracteres'); return; }

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put('/api/profile/password', { currentPassword: formData.currentPassword, newPassword: formData.newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Senha alterada com sucesso!');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner"/><p>Carregando perfil...</p></div>;
  }

  return (
    <>
      {/* Profile hero */}
      <div className="profile-hero card">
        <div className="profile-avatar-lg">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="profile-hero-info">
          <h2 className="profile-name">{user?.name}</h2>
          <p className="profile-email">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button className={`profile-tab ${activeSection === 'account' ? 'active' : ''}`} onClick={() => setActiveSection('account')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          Informações da Conta
        </button>
        <button className={`profile-tab ${activeSection === 'security' ? 'active' : ''}`} onClick={() => setActiveSection('security')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          Segurança
        </button>
      </div>

      {/* Account section */}
      {activeSection === 'account' && (
        <div className="card section-card">
          <div className="section-card-header">
            <div>
              <h3>Informações Pessoais</h3>
              <p>Atualize seus dados de cadastro</p>
            </div>
            {!editing && (
              <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Editar
              </button>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} disabled={!editing} required/>
              </div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} disabled={!editing} required/>
              </div>
            </div>

            {editing && (
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setEditing(false);
                  setFormData(prev => ({ ...prev, name: user?.name || '', email: user?.email || '' }));
                }} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Security section */}
      {activeSection === 'security' && (
        <div className="card section-card">
          <div className="section-card-header">
            <div>
              <h3>Alterar Senha</h3>
              <p>Mantenha sua conta segura com uma senha forte</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="profile-form">
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Senha Atual</label>
                <input type={showCurrentPassword ? "text" : "password"} name="currentPassword" className="form-input" value={formData.currentPassword} onChange={handleChange} placeholder="Digite sua senha atual"/>
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: '12px', top: '38px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showCurrentPassword ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            <div className="form-row">
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Nova Senha</label>
                <input type={showNewPassword ? "text" : "password"} name="newPassword" className="form-input" value={formData.newPassword} onChange={handleChange} placeholder="Mínimo 6 caracteres"/>
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '12px', top: '38px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showNewPassword ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Confirmar Nova Senha</label>
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" className="form-input" value={formData.confirmPassword} onChange={handleChange} placeholder="Repita a nova senha"/>
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '38px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showConfirmPassword ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Alterando...' : 'Alterar Senha'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Profile;

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import './Profile.css';

function PasswordField({ label, name, value, visible, onToggle, onChange, autoComplete }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>{label}</label>
      <div className="profile-password-wrap">
        <input id={name} name={name} type={visible ? 'text' : 'password'} className="form-input" value={value} onChange={onChange} autoComplete={autoComplete} />
        <button type="button" onClick={onToggle}>{visible ? 'Ocultar' : 'Mostrar'}</button>
      </div>
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [formData, setFormData] = useState({ name: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  useLayout('Minha conta', 'Dados pessoais, acesso e segurança', user);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return navigate('/login', { replace: true });
        const { data } = await axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } });
        setUser(data.user);
        setFormData(current => ({ ...current, name: data.user.name || '', email: data.user.email || '' }));
      } catch {
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  const handleChange = ({ target: { name, value } }) => setFormData(current => ({ ...current, [name]: value }));

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (!formData.name.trim()) return toast.warning('Informe seu nome.');
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put('/api/profile', { name: formData.name.trim(), email: formData.email.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setUser(current => ({ ...current, name: formData.name.trim(), email: formData.email.trim() }));
      setEditing(false);
      toast.success('Dados da conta atualizados.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Não foi possível atualizar a conta.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) return toast.warning('Preencha os três campos de senha.');
    if (formData.newPassword.length < 6) return toast.warning('A nova senha deve ter pelo menos 6 caracteres.');
    if (formData.newPassword !== formData.confirmPassword) return toast.warning('A confirmação não corresponde à nova senha.');
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put('/api/profile/password', { currentPassword: formData.currentPassword, newPassword: formData.newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      setFormData(current => ({ ...current, currentPassword: '', newPassword: '', confirmPassword: '' }));
      toast.success('Senha atualizada.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Não foi possível atualizar a senha.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    setFormData(current => ({ ...current, name: user?.name || '', email: user?.email || '' }));
  };

  if (loading) return <div className="page-loading"><span className="loading-spinner"/><p>Carregando sua conta...</p></div>;

  return (
    <div className="account-page">
      <div className="account-layout">
        <aside className="account-summary-card">
          <div className="account-summary-cover" />
          <div className="account-summary-content">
            <span className="profile-avatar-lg">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            <h2>{user?.name || 'Usuário'}</h2>
            <p>{user?.email}</p>
            <span className="account-role-badge">{user?.role === 'superadmin' ? 'Super Admin' : 'Conta ativa'}</span>

            <div className="account-summary-divider" />
            <span className="account-summary-label">Atalhos da conta</span>
            <Link to="/meu-negocio" className="account-business-link">
              <span className="account-link-icon">⌂</span>
              <span><strong>Meu negócio</strong><small>Marca, público e preferências</small></span>
              <b>→</b>
            </Link>
          </div>
        </aside>

        <div className="account-settings-stack">
          <section className="settings-card account-settings-card">
            <header className="settings-card-header">
              <span>01</span>
              <div><h3>Informações pessoais</h3><p>Dados usados para identificar e acessar sua conta.</p></div>
              {!editing && <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditing(true)}>Editar dados</button>}
            </header>
            <form className="settings-card-body account-form" onSubmit={handleSaveProfile}>
              <div className="account-fields-grid">
                <div className="form-group"><label className="form-label" htmlFor="profileName">Nome completo</label><input id="profileName" className="form-input" name="name" value={formData.name} onChange={handleChange} disabled={!editing} /></div>
                <div className="form-group"><label className="form-label" htmlFor="profileEmail">E-mail</label><input id="profileEmail" className="form-input" name="email" type="email" value={formData.email} onChange={handleChange} disabled={!editing} /></div>
              </div>
              {editing && <div className="form-actions account-form-actions"><button type="button" className="btn btn-secondary" onClick={cancelEditing}>Cancelar</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button></div>}
            </form>
          </section>

          <section className="settings-card account-settings-card">
            <header className="settings-card-header">
              <span>02</span>
              <div><h3>Senha e segurança</h3><p>Use uma senha exclusiva com pelo menos seis caracteres.</p></div>
              <span className="security-state"><i /> Protegida</span>
            </header>
            <form className="settings-card-body account-form" onSubmit={handleChangePassword}>
              <div className="security-fields-grid">
                <PasswordField label="Senha atual" name="currentPassword" value={formData.currentPassword} visible={visible.current} onToggle={() => setVisible(current => ({ ...current, current: !current.current }))} onChange={handleChange} autoComplete="current-password" />
                <PasswordField label="Nova senha" name="newPassword" value={formData.newPassword} visible={visible.next} onToggle={() => setVisible(current => ({ ...current, next: !current.next }))} onChange={handleChange} autoComplete="new-password" />
                <PasswordField label="Confirmar nova senha" name="confirmPassword" value={formData.confirmPassword} visible={visible.confirm} onToggle={() => setVisible(current => ({ ...current, confirm: !current.confirm }))} onChange={handleChange} autoComplete="new-password" />
              </div>
              <div className="form-actions account-form-actions"><button className="btn btn-primary" disabled={saving}>{saving ? 'Atualizando...' : 'Atualizar senha'}</button></div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Profile;

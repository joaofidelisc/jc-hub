import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AVAILABLE_DAYS, AVAILABLE_NETWORKS, CONTENT_STRATEGIES } from '../Creator/creatorConfig';
import './Profile.css';

const INITIAL_SETTINGS = {
  niche: '', businessInfo: '', products: '', persona: '', businessHours: '',
  tone: 'Profissional e próximo', defaultStrategy: 'funnel', networks: [], days: [],
  brandKeywords: '', avoidTopics: '', logo: [], prints: [],
};

function BusinessProfile({ user, onUpdate }) {
  const [formData, setFormData] = useState(INITIAL_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({ ...INITIAL_SETTINGS, ...(user?.creator_settings || {}) });
  }, [user]);

  const handleChange = ({ target: { name, value } }) => setFormData(current => ({ ...current, [name]: value }));
  const handleCheckbox = (field, value) => setFormData(current => {
    const values = current[field] || [];
    return { ...current, [field]: values.includes(value) ? values.filter(item => item !== value) : [...values, value] };
  });

  const handleImageUpload = (event, field) => {
    const maxItems = field === 'logo' ? 1 : 6;
    const availableSlots = Math.max(0, maxItems - (formData[field]?.length || 0));
    const files = Array.from(event.target.files).slice(0, availableSlots);
    if (!availableSlots) return toast.warning(field === 'logo' ? 'Remova o logo atual antes de enviar outro.' : 'Você pode salvar até 6 referências.');

    files.forEach(file => {
      if (!file.type.startsWith('image/')) return toast.warning(`${file.name} não é uma imagem válida.`);
      if (file.size > 5 * 1024 * 1024) return toast.warning(`${file.name} excede o limite de 5 MB.`);
      const reader = new FileReader();
      reader.onload = () => setFormData(current => ({ ...current, [field]: [...(current[field] || []), reader.result] }));
      reader.readAsDataURL(file);
    });
    event.target.value = '';
  };

  const removeImage = (index, field) => setFormData(current => ({ ...current, [field]: current[field].filter((_, itemIndex) => itemIndex !== index) }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.niche.trim() || !formData.persona.trim() || !formData.products.trim()) return toast.warning('Preencha nicho, público e produtos ou serviços.');
    if (!formData.networks.length || !formData.days.length) return toast.warning('Selecione pelo menos uma rede e um dia de publicação.');

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put('/api/profile/creator_settings', { settings: formData }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Preferências do negócio salvas.');
      onUpdate?.(formData);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar as preferências do negócio.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="business-form">
      <section className="settings-card">
        <header className="settings-card-header"><span>01</span><div><h3>Essência do negócio</h3><p>O que você vende e por que sua marca é diferente.</p></div></header>
        <div className="settings-card-body">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Nicho / área de atuação <b className="required">*</b></label><input className="form-input" name="niche" value={formData.niche} onChange={handleChange} placeholder="Ex.: consultoria financeira para pequenas empresas" /></div>
            <div className="form-group"><label className="form-label">Horário de atendimento</label><input className="form-input" name="businessHours" value={formData.businessHours} onChange={handleChange} placeholder="Ex.: segunda a sexta, das 9h às 18h" /></div>
          </div>
          <div className="form-group"><label className="form-label">Produtos e serviços <b className="required">*</b></label><textarea className="form-textarea" name="products" value={formData.products} onChange={handleChange} placeholder="Liste as principais ofertas, faixas de preço ou prioridades comerciais." /></div>
          <div className="form-group"><label className="form-label">Sobre o negócio</label><textarea className="form-textarea" name="businessInfo" value={formData.businessInfo} onChange={handleChange} placeholder="História, diferenciais, modelo de atendimento, localização e outras informações importantes." /></div>
        </div>
      </section>

      <section className="settings-card">
        <header className="settings-card-header"><span>02</span><div><h3>Público e linguagem</h3><p>Contexto para a IA escrever como sua marca e para as pessoas certas.</p></div></header>
        <div className="settings-card-body">
          <div className="form-group"><label className="form-label">Público-alvo <b className="required">*</b></label><textarea className="form-textarea" name="persona" value={formData.persona} onChange={handleChange} placeholder="Quem são, quais problemas enfrentam, o que desejam e como tomam decisões." /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Tom de voz</label><select className="form-select" name="tone" value={formData.tone} onChange={handleChange}><option>Profissional e próximo</option><option>Didático e acessível</option><option>Inspirador e emocional</option><option>Direto e provocativo</option><option>Descontraído e bem-humorado</option><option>Técnico e especialista</option></select></div>
            <div className="form-group"><label className="form-label">Palavras e expressões da marca</label><input className="form-input" name="brandKeywords" value={formData.brandKeywords} onChange={handleChange} placeholder="Ex.: simples, sem enrolação, feito para você" /></div>
          </div>
          <div className="form-group"><label className="form-label">Assuntos ou abordagens a evitar</label><input className="form-input" name="avoidTopics" value={formData.avoidTopics} onChange={handleChange} placeholder="Ex.: promessas de resultado, jargões, comparação com concorrentes" /></div>
        </div>
      </section>

      <section className="settings-card">
        <header className="settings-card-header"><span>03</span><div><h3>Canais e cadência</h3><p>Preferências iniciais — você poderá ajustá-las em cada planejamento.</p></div></header>
        <div className="settings-card-body">
          <label className="form-label">Redes sociais <b className="required">*</b></label>
          <div className="selection-grid network-selection">{AVAILABLE_NETWORKS.map(network => <button key={network} type="button" className={`selection-chip ${formData.networks.includes(network) ? 'selected' : ''}`} onClick={() => handleCheckbox('networks', network)}><span>{network.slice(0, 2).toUpperCase()}</span>{network}</button>)}</div>
          <label className="form-label settings-sub-label">Dias preferidos <b className="required">*</b></label>
          <div className="selection-grid day-selection">{AVAILABLE_DAYS.map(day => <button key={day} type="button" className={`selection-chip ${formData.days.includes(day) ? 'selected' : ''}`} onClick={() => handleCheckbox('days', day)}>{day}</button>)}</div>
          <label className="form-label settings-sub-label">Estratégia padrão</label>
          <div className="strategy-mini-grid">{CONTENT_STRATEGIES.map(strategy => <button key={strategy.id} type="button" className={`strategy-mini-card ${formData.defaultStrategy === strategy.id ? 'selected' : ''}`} onClick={() => setFormData(current => ({ ...current, defaultStrategy: strategy.id }))} style={{ '--strategy-accent': strategy.accent }}><i/><span><strong>{strategy.label}</strong><small>{strategy.short}</small></span></button>)}</div>
        </div>
      </section>

      <section className="settings-card">
        <header className="settings-card-header"><span>04</span><div><h3>Referências visuais</h3><p>Logo e exemplos ajudam a Nova a manter coerência de marca nas sugestões de imagem.</p></div></header>
        <div className="settings-card-body upload-grid">
          <div className="upload-column"><label className="form-label">Logo da marca</label><label className="upload-zone"><input type="file" accept="image/*" onChange={event => handleImageUpload(event, 'logo')} /><span className="upload-zone-icon">＋</span><strong>Enviar logo</strong><small>PNG, JPG ou WEBP · até 5 MB</small></label><div className="image-preview-grid">{formData.logo.map((image, index) => <div className="image-preview" key={`${image.slice(-20)}-${index}`}><img src={image} alt="Logo da marca"/><button type="button" onClick={() => removeImage(index, 'logo')} aria-label="Remover logo">×</button></div>)}</div></div>
          <div className="upload-column"><label className="form-label">Posts de referência</label><label className="upload-zone"><input type="file" accept="image/*" multiple onChange={event => handleImageUpload(event, 'prints')} /><span className="upload-zone-icon">＋</span><strong>Adicionar referências</strong><small>Até 6 imagens de posts anteriores</small></label><div className="image-preview-grid">{formData.prints.map((image, index) => <div className="image-preview" key={`${image.slice(-20)}-${index}`}><img src={image} alt={`Referência visual ${index + 1}`}/><button type="button" onClick={() => removeImage(index, 'prints')} aria-label="Remover referência">×</button></div>)}</div></div>
        </div>
      </section>

      <div className="business-save-bar"><div><strong>Preferências permanentes</strong><span>Objetivo, período e estratégia poderão mudar em cada plano.</span></div><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? <><span className="loading-spinner-sm"/> Salvando...</> : 'Salvar meu negócio'}</button></div>
    </form>
  );
}

export default BusinessProfile;

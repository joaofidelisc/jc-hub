import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Creator.css'; 

function CreatorForm({ onSubmit, loading, user }) {
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  
  const [formData, setFormData] = useState({
    niche: '',
    businessInfo: '',
    logo: [],
    prints: [],
    persona: '',
    businessHours: '',
    tone: 'Profissional e Amigável',
    networks: [],
    days: [],
    week: 'Semana Atual'
  });

  const availableNetworks = ['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'TikTok'];
  const availableDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  useEffect(() => {
    // Tenta descobrir se já existe um plano para a semana atual
    const checkCurrentWeek = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const { data } = await axios.get('/api/creator/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, week: 'Próxima Semana' }));
        }
      } catch (err) {
        // Ignora erros silenciados
      }
    };
    checkCurrentWeek();

    // Load user settings if they exist
    if (user?.creator_settings) {
      setFormData(prev => ({ ...prev, ...user.creator_settings, week: prev.week }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (type, value) => {
    setFormData(prev => {
      const current = prev[type];
      const updated = current.includes(value) 
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const handleImageUpload = (e, field) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [field]: [...(prev[field] || []), reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index, field) => {
    setFormData(prev => {
      const newImages = [...prev[field]];
      newImages.splice(index, 1);
      return { ...prev, [field]: newImages };
    });
  };

  const saveSettingsToDB = async (dataToSave) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put('/api/profile/creator_settings', { settings: dataToSave }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Failed to save creator settings", error);
    }
  };

  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(false);

  const proceedWithSubmit = () => {
    setShowOverwriteModal(false);
    saveSettingsToDB({
      niche: formData.niche,
      businessInfo: formData.businessInfo,
      persona: formData.persona,
      businessHours: formData.businessHours,
      tone: formData.tone,
      networks: formData.networks,
      days: formData.days,
      logo: formData.logo,
      prints: formData.prints
    });
    onSubmit(formData);
  };

  const handleNext = async () => {
    if (step === 1 && !formData.niche.trim()) return toast.warning("Preencha o nicho");
    if (step === 3 && !formData.persona.trim()) return toast.warning("Preencha o público-alvo");
    if (step === 4 && !formData.businessHours.trim()) return toast.warning("Preencha o horário de atendimento");
    if (step === 5 && formData.networks.length === 0) return toast.warning("Selecione pelo menos uma rede social");
    
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      if (formData.days.length === 0) return toast.warning("Selecione pelo menos um dia");
      
      setCheckingPlan(true);
      try {
        const token = localStorage.getItem('accessToken');
        const { data } = await axios.get(`/api/creator/check-plan?week=${encodeURIComponent(formData.week)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (data.exists) {
          setShowOverwriteModal(true);
        } else {
          proceedWithSubmit();
        }
      } catch (err) {
        console.error(err);
        proceedWithSubmit(); // Proceed anyway on error
      } finally {
        setCheckingPlan(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Progress percentage
  const progress = (step / totalSteps) * 100;

  return (
    <div className="creator-form-container">
      <div className="creator-form-card" style={{ width: '100%', maxWidth: '600px' }}>
        
        {loading ? (
          <div className="nova-loading-state">
            <div className="nova-loader">
              <div className="nova-ring"></div>
              <div className="nova-ring"></div>
              <div className="nova-avatar-circle">N</div>
            </div>
            <h3>Consultando Nova...</h3>
            <p>Analisando o seu perfil, compreendendo seu público e estruturando o melhor planejamento. Isso pode levar alguns segundos.</p>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div style={{ width: '100%', backgroundColor: 'var(--bg-page)', height: '6px', borderRadius: '4px', marginBottom: '32px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, backgroundColor: 'var(--primary)', height: '100%', transition: 'width 0.3s ease' }}></div>
            </div>

        <div className="form-header" style={{ marginBottom: '32px' }}>
          {step === 1 && (
            <>
              <h2>Qual é o seu nicho?</h2>
              <p>Me conte qual é a área de atuação da sua marca ou negócio.</p>
            </>
          )}
          {step === 2 && (
            <>
              <h2>Sobre o seu negócio</h2>
              <p>Fale mais sobre seus produtos, serviços, diferenciais ou histórico.</p>
            </>
          )}
          {step === 3 && (
            <>
              <h2>Quem é o seu público?</h2>
              <p>Descreva a persona ou o público-alvo principal que você deseja alcançar.</p>
            </>
          )}
          {step === 4 && (
            <>
              <h2>Horários e Tom de Voz</h2>
              <p>Detalhes operacionais e a "personalidade" da sua marca nas redes.</p>
            </>
          )}
          {step === 5 && (
            <>
              <h2>Onde você vai postar?</h2>
              <p>Selecione as redes sociais foco deste planejamento.</p>
            </>
          )}
          {step === 6 && (
            <>
              <h2>Dias de Publicação</h2>
              <p>Quais dias da semana você costuma ou quer postar?</p>
            </>
          )}
        </div>

        <div className="creator-form">
          {step === 1 && (
            <div className="form-group">
              <input 
                type="text" 
                name="niche" 
                placeholder="Ex: Clínica Odontológica, Loja de Roupas..." 
                value={formData.niche} 
                onChange={handleChange} 
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div className="form-group">
              <textarea
                name="businessInfo"
                placeholder="Ex: Oferecemos serviços de clareamento a laser, temos 10 anos de mercado, nosso diferencial é o atendimento humanizado..."
                value={formData.businessInfo}
                onChange={handleChange}
                autoFocus
                style={{ height: '120px', resize: 'vertical' }}
              />
              <div style={{ marginTop: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Logotipo (Opcional)
                </label>
                
                <div className="upload-dropzone">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={(e) => handleImageUpload(e, 'logo')} 
                    id="logo-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="logo-upload" className="dropzone-label">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <div className="dropzone-text">Clique para adicionar o logotipo</div>
                    <div className="dropzone-subtext">A IA analisará as cores e estilo da sua marca</div>
                  </label>
                </div>

                {formData.logo && formData.logo.length > 0 && (
                  <div className="prints-preview-container">
                    {formData.logo.map((print, idx) => (
                      <div key={idx} className="print-preview-item">
                        <img src={print} alt="preview" />
                        <button 
                          onClick={() => removeImage(idx, 'logo')}
                          className="print-remove-btn"
                          title="Remover"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '24px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  Posts Anteriores (Opcional)
                </label>
                
                <div className="upload-dropzone">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={(e) => handleImageUpload(e, 'prints')} 
                    id="prints-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="prints-upload" className="dropzone-label">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <div className="dropzone-text">Clique para adicionar prints do Instagram</div>
                    <div className="dropzone-subtext">A IA usará como referência de estilo visual para os próximos posts</div>
                  </label>
                </div>

                {formData.prints && formData.prints.length > 0 && (
                  <div className="prints-preview-container">
                    {formData.prints.map((print, idx) => (
                      <div key={idx} className="print-preview-item">
                        <img src={print} alt="preview" />
                        <button 
                          onClick={() => removeImage(idx, 'prints')}
                          className="print-remove-btn"
                          title="Remover"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-group">
              <input 
                type="text" 
                name="persona" 
                placeholder="Ex: Trabalhadores CLT de 25 a 45 anos, Empreendedores locais..." 
                value={formData.persona} 
                onChange={handleChange} 
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                autoFocus
              />
            </div>
          )}

          {step === 4 && (
            <>
              <div className="form-group">
                <label>Horário de Atendimento</label>
                <input 
                  type="text" 
                  name="businessHours" 
                  placeholder="Ex: Seg a Sex das 08h às 18h" 
                  value={formData.businessHours} 
                  onChange={handleChange} 
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Tom de Voz</label>
                <select name="tone" value={formData.tone} onChange={handleChange}>
                  <option value="Profissional e Amigável">Profissional e Amigável</option>
                  <option value="Descontraído e Humorístico">Descontraído e Humorístico</option>
                  <option value="Sério e Corporativo">Sério e Corporativo</option>
                  <option value="Inspirador e Motivacional">Inspirador e Motivacional</option>
                </select>
              </div>
            </>
          )}

          {step === 5 && (
            <div className="checkbox-grid">
              {availableNetworks.map(net => (
                <label key={net} className={`checkbox-label ${formData.networks.includes(net) ? 'active' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={formData.networks.includes(net)}
                    onChange={() => handleCheckbox('networks', net)}
                  />
                  <span>{net}</span>
                </label>
              ))}
            </div>
          )}

          {step === 6 && (
            <>
              <div className="form-group mb-4">
                <label>Para qual semana?</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label className={`checkbox-label ${formData.week === 'Semana Atual' ? 'active' : ''}`} style={{ flex: 1, textAlign: 'center' }}>
                    <input 
                      type="radio" 
                      name="week" 
                      value="Semana Atual"
                      checked={formData.week === 'Semana Atual'}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    <span>Semana Atual</span>
                  </label>
                  <label className={`checkbox-label ${formData.week === 'Próxima Semana' ? 'active' : ''}`} style={{ flex: 1, textAlign: 'center' }}>
                    <input 
                      type="radio" 
                      name="week" 
                      value="Próxima Semana"
                      checked={formData.week === 'Próxima Semana'}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    <span>Próxima Semana</span>
                  </label>
                </div>
              </div>

              <div className="checkbox-grid">
                {availableDays.map(day => (
                  <label key={day} className={`checkbox-label ${formData.days.includes(day) ? 'active' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={formData.days.includes(day)}
                      onChange={() => handleCheckbox('days', day)}
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            {step > 1 && (
              <button 
                type="button" 
                onClick={handleBack}
                disabled={loading}
                style={{ 
                  flex: 1, 
                  padding: '14px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-color)', 
                  background: 'transparent', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  color: 'var(--text-primary)' 
                }}
              >
                Voltar
              </button>
            )}
            
            <button 
              type="button" 
              onClick={handleNext}
              disabled={loading}
              className="generate-btn"
              style={{ flex: 2, margin: 0, padding: '14px' }}
            >
              {loading ? (
                "Gerando..."
              ) : step < totalSteps ? (
                "Próximo"
              ) : (
                "Gerar Planejamento"
              )}
            </button>
          </div>
        </div>
        </>
        )}
      </div>

      {showOverwriteModal && (
        <div className="mobile-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="creator-form-card" style={{ maxWidth: '500px', width: '90%', background: 'var(--md-surface)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Atenção: Planejamento já existe!
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Você já gerou um planejamento para a <strong>{formData.week}</strong>. Se você gerar novamente, o conteúdo anterior será <strong>substituído</strong>. 
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '8px' }}>
              Tem certeza que deseja continuar?
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowOverwriteModal(false)}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500 }}
              >
                Cancelar
              </button>
              <button 
                onClick={proceedWithSubmit}
                style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
              >
                Sim, Substituir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatorForm;

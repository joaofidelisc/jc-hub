import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Creator.css'; 

function CreatorForm({ onSubmit, loading }) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  
  const [formData, setFormData] = useState({
    niche: '',
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
        
        // Calcula qual seria a string da semana atual (mesma lógica do backend simplificada)
        // Como o backend salva "de DD/MM/YYYY a DD/MM/YYYY", a forma mais simples 
        // é checar se o plano mais recente tem a data de hoje nele, mas como não temos 
        // a lógica exata de datas no frontend facilmente, podemos assumir que se houver 
        // planos na lista, o último criado provavelmente foi desta semana. 
        // Para ser preciso: se tem qualquer plano, assume Próxima Semana para evitar sobrescrever acidentalmente.
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, week: 'Próxima Semana' }));
        }
      } catch (err) {
        // Ignora erros silenciados
      }
    };
    checkCurrentWeek();
  }, []);

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

  const handleNext = () => {
    if (step === 1 && !formData.niche.trim()) return toast.warning("Preencha o nicho");
    if (step === 2 && !formData.persona.trim()) return toast.warning("Preencha o público-alvo");
    if (step === 3 && !formData.businessHours.trim()) return toast.warning("Preencha o horário de atendimento");
    if (step === 4 && formData.networks.length === 0) return toast.warning("Selecione pelo menos uma rede social");
    
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      if (formData.days.length === 0) return toast.warning("Selecione pelo menos um dia");
      onSubmit(formData);
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
              <h2>Quem é o seu público?</h2>
              <p>Descreva a persona ou o público-alvo principal que você deseja alcançar.</p>
            </>
          )}
          {step === 3 && (
            <>
              <h2>Horários e Tom de Voz</h2>
              <p>Detalhes operacionais e a "personalidade" da sua marca nas redes.</p>
            </>
          )}
          {step === 4 && (
            <>
              <h2>Onde você vai postar?</h2>
              <p>Selecione as redes sociais foco deste planejamento.</p>
            </>
          )}
          {step === 5 && (
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

          {step === 3 && (
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

          {step === 4 && (
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

          {step === 5 && (
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
    </div>
  );
}

export default CreatorForm;

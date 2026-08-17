import React, { useEffect } from 'react';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import './SocialSmart.css';

function WhatsAppSmart() {
  useLayout('WhatsApp Inteligente', 'Assistente virtual para o seu WhatsApp.');

  return (
    <div className="social-smart-page">
      <div className="coming-soon-card">
        <div className="icon whatsapp">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        </div>
        <h2>Em desenvolvimento</h2>
        <p>Em breve, você poderá conectar o seu WhatsApp via QR Code diretamente no JC Hub. Esta funcionalidade atuará como um assistente inteligente, sendo capaz de responder seus clientes, tirar dúvidas e agendar compromissos automaticamente, 24 horas por dia!</p>
      </div>
    </div>
  );
}

export default WhatsAppSmart;

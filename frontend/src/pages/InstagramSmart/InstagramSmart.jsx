import React, { useEffect } from 'react';
import { useLayout } from '../../components/AppLayout/LayoutContext';
import '../WhatsAppSmart/SocialSmart.css';

function InstagramSmart() {
  useLayout('Instagram Inteligente', 'Automação para seu Instagram.');

  return (
    <div className="social-smart-page">
      <div className="coming-soon-card">
        <div className="icon instagram">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
        </div>
        <h2>Em desenvolvimento</h2>
        <p>Em breve, você poderá conectar o seu Instagram para automatizar interações. A Nova será capaz de responder comentários nos seus posts, engajar com seus seguidores e responder automaticamente às mensagens recebidas no Direct (Chats) com inteligência e contexto do seu negócio.</p>
      </div>
    </div>
  );
}

export default InstagramSmart;

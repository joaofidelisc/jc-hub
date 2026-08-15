import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import './Creator.css';

function NovaSideChat({ contextData, planId, onPlanChange }) {
  const [messages, setMessages] = useState([
    {
      sender: 'nova',
      text: 'Seu planejamento está aberto por aqui. Posso tirar dúvidas **e editar o calendário para você** — é só me dizer o que deseja mudar.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (forcedText = null) => {
    const textToSend = (forcedText || inputValue).trim();
    if (!textToSend || isTyping) return;

    if (!forcedText) setInputValue('');
    const newMessages = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const token = localStorage.getItem('accessToken');
      const chatHistory = newMessages.map(message => ({
        role: message.sender === 'nova' ? 'model' : 'user',
        text: message.text,
      }));
      const { data } = await axios.post(
        '/api/creator/chat',
        { messages: chatHistory, contextData, planId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (data.plan_json && onPlanChange) {
        onPlanChange(data.plan_json);
        toast.success('A Nova editou e salvou o planejamento.');
      }
      if (data.response) {
        setMessages(current => [...current, { sender: 'nova', text: data.response, edited: Boolean(data.edited) }]);
      }
    } catch (error) {
      console.error(error);
      const detail = error.response?.data?.detail || 'Não consegui concluir essa alteração. Pode tentar novamente?';
      setMessages(current => [...current, { sender: 'nova', text: detail, error: true }]);
      toast.error(detail);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') handleSend();
  };

  return (
    <div className="nova-side-chat">
      <div className="side-chat-header">
        <span className="nova-avatar-small">N</span>
        <div>
          <h3>Nova</h3>
          <p><i /> Edita e salva este plano</p>
        </div>
      </div>

      <div className="side-chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message-wrapper ${message.sender === 'user' ? 'user' : 'nova'}`}>
            {message.sender === 'nova' && <div className="nova-avatar">N</div>}
            <div className={`chat-bubble ${message.sender === 'user' ? 'user' : 'nova'} ${message.edited ? 'edited' : ''} ${message.error ? 'chat-error' : ''}`}>
              {message.edited && <span className="chat-edit-label">✓ Planejamento atualizado</span>}
              <div className="markdown-content"><ReactMarkdown>{message.text}</ReactMarkdown></div>
            </div>
          </div>
        ))}

        {messages.length === 1 && !isTyping && (
          <div className="nova-quick-chips">
            <p className="chips-title">Experimente pedir:</p>
            <div className="chips-container">
              <button className="quick-chip" onClick={() => handleSend('Troque o próximo post por uma ideia de bastidores, sem repetir os outros temas.')}>Trocar uma ideia</button>
              <button className="quick-chip" onClick={() => handleSend('Deixe os títulos do LinkedIn mais analíticos e profissionais, mantendo a proposta de cada post.')}>Ajustar o LinkedIn</button>
              <button className="quick-chip" onClick={() => handleSend('Revise os CTAs do Instagram para incentivar mais comentários, sem mudar os temas.')}>Melhorar os CTAs</button>
            </div>
          </div>
        )}

        {isTyping && (
          <div className="message-wrapper nova">
            <div className="nova-avatar">N</div>
            <div className="chat-bubble nova typing">
              <div className="dot" /><div className="dot" /><div className="dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="side-chat-input">
        <input
          type="text"
          placeholder="Peça uma edição ou tire uma dúvida..."
          value={inputValue}
          onChange={event => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
        />
        <button type="button" onClick={() => handleSend()} disabled={!inputValue.trim() || isTyping} aria-label="Enviar mensagem">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default NovaSideChat;

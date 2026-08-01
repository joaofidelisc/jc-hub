import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Creator.css';

function NovaSideChat({ contextData }) {
  const [messages, setMessages] = useState([
    { sender: 'nova', text: "Oii! Eu sou a Nova ✨. Acabei de gerar o seu planejamento! Como posso te ajudar a refinar ou tirar dúvidas sobre essas ideias?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (forcedText = null) => {
    const textToSend = forcedText || inputValue;
    if (!textToSend.trim() || isTyping) return;

    if (!forcedText) setInputValue('');
    
    const newMessages = [...messages, { sender: 'user', text: textToSend.trim() }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      const chatHistory = newMessages.map(msg => ({
        role: msg.sender === 'nova' ? 'model' : 'user',
        text: msg.text
      }));

      const response = await axios.post('/api/creator/chat', { 
        messages: chatHistory,
        contextData: contextData // send the generated plan context to the backend
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const replyText = response.data.response;
      
      if (replyText) {
        setMessages(prev => [...prev, { sender: 'nova', text: replyText }]);
      }
      
    } catch (error) {
      console.error(error);
      toast.error("Ops! Tive um problema ao processar. Pode repetir?");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="nova-side-chat">
      <div className="side-chat-header">
        <svg viewBox="0 0 24 24" width="24" height="24" className="nova-avatar-small" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <h3>Falar com a Nova</h3>
      </div>
      
      <div className="side-chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.sender === 'user' ? 'user' : 'nova'}`}>
            {msg.sender === 'nova' && (
              <div className="nova-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
            )}
            <div className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'nova'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {messages.length === 1 && !isTyping && (
          <div className="nova-quick-chips">
            <p className="chips-title">Sugestões rápidas:</p>
            <div className="chips-container">
              <button className="quick-chip" onClick={() => handleSend("Me dê outra ideia para Quinta-feira")}>✨ Outra ideia para Quinta-feira</button>
              <button className="quick-chip" onClick={() => handleSend("Transforme o post de Terça em um roteiro de vídeo")}>🎬 Roteiro de vídeo para Terça</button>
              <button className="quick-chip" onClick={() => handleSend("Foque mais em conteúdos de venda (Fundo de Funil)")}>💰 Focar mais em vendas</button>
            </div>
          </div>
        )}

        {isTyping && (
          <div className="message-wrapper nova">
            <div className="nova-avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div className="chat-bubble nova typing">
              <div className="dot"></div><div className="dot"></div><div className="dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="side-chat-input">
        <input 
          type="text" 
          placeholder="Tire dúvidas sobre o planejamento..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isTyping}
        />
        <button onClick={handleSend} disabled={!inputValue.trim() || isTyping}>
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

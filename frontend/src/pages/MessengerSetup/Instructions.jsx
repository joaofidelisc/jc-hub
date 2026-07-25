import React from 'react';
import { Link } from 'react-router-dom';
import './Instructions.css';

const MessengerInstructions = () => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = `${baseUrl}/api/ig/messenger-webhook`;

  return (
    <div className="ig-inst-page">
      <header className="ig-header">
        <Link to="/" className="brand brand-link">Simplifica.AI</Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Início</Link>
          <Link to="/profile" className="nav-link">Perfil</Link>
        </nav>
      </header>

      <main className="ig-inst-content">
        <section className="ig-inst-card">
          <h1 className="title">Integração com Meta (Messenger)</h1>
          <p className="subtitle">Siga os passos para configurar a automação no Messenger.</p>

          <ol className="steps">
            <li>
              No Meta for Developers, selecione seu App e adicione o produto "Messenger".
            </li>
            <li>
              Na seção de webhooks do produto Messenger, clique em "Adicionar URL de retorno de chamada".
            </li>
            <li>
              No campo "URL de Retorno de Chamada", insira a seguinte URL:
              <div className="kbd">{webhookUrl}</div>
            </li>
            <li>
              No campo "Verificar Token", insira o mesmo "Verify Token" que você configurou na tela anterior.
            </li>
            <li>
              Após adicionar o URL de retorno de chamada, na mesma página, adicione assinaturas de webhook. Selecione os seguintes campos: 
              <ul>
                <li><code>messages</code></li>
                <li><code>messaging_postbacks</code></li>
              </ul>
            </li>
            <li>
              Gere um Token de Acesso à Página para a sua Página do Facebook e adicione-o na configuração.
            </li>
          </ol>

          <div className="actions">
            <Link to="/messenger/setup" className="btn btn-outline-secondary">Voltar para Configuração</Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MessengerInstructions;

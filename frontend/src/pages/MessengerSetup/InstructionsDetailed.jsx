import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './InstructionsDetailed.css';

const InstructionsDetailed = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) navigate('/login', { replace: true });
  }, [navigate]);

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/ig/messenger-webhook` : '';

  return (
    <div className="instructions-detailed-page">
      <header className="instructions-header">
        <Link to="/" className="brand brand-link">JC Hub</Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Início</Link>
          <Link to="/messenger/setup" className="nav-link">Voltar para configuração</Link>
        </nav>
      </header>

      <main className="instructions-main">
        <div className="instructions-hero">
          <h1 className="hero-title">📘 Guia Completo: Configuração do Messenger</h1>
          <p className="hero-subtitle">
            Siga este passo a passo para conectar sua Página do Facebook ao JC Hub e começar a automatizar respostas no Messenger.
          </p>
        </div>

        <div className="instructions-container">
          {/* Step 1 */}
          <section className="instruction-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h2 className="step-title">Acesse o Meta for Developers</h2>
              <p className="step-description">
                Entre em{' '}
                <a
                  href="https://developers.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  developers.facebook.com
                </a>{' '}
                e clique em <strong>Criar Aplicativo</strong>.
              </p>
              <p className="step-description">
                Selecione o tipo de aplicativo como <strong>Outro</strong> e depois <strong>Empresa</strong>.
              </p>
              <div className="step-image-wrapper">
                <div className="image-placeholder">
                  📷 Imagem: Tela de criação de aplicativo
                </div>
              </div>
            </div>
          </section>

          {/* Step 2 */}
          <section className="instruction-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h2 className="step-title">Adicione o Produto Messenger</h2>
              <p className="step-description">
                No painel do seu aplicativo, role para baixo até encontrar a lista de produtos e clique em <strong>Configurar</strong> no card do <strong>Messenger</strong>.
              </p>
              <div className="step-image-wrapper">
                <div className="image-placeholder">
                  📷 Imagem: Adicionando o produto Messenger
                </div>
              </div>
            </div>
          </section>

          {/* Step 3 */}
          <section className="instruction-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h2 className="step-title">Configure o Webhook</h2>
              <p className="step-description">
                Na seção <strong>Webhooks</strong>, clique em <strong>Adicionar URL de retorno de chamada</strong>.
              </p>
              <div className="code-block-wrapper">
                <code className="code-block">{webhookUrl}</code>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    toast.success('URL copiada!');
                  }}
                  title="Copiar URL"
                >
                  📋
                </button>
              </div>
              <div className="step-description">
                <p><strong>Token de verificação:</strong> Use o <strong>Verify Token</strong> que você irá definir na tela de configuração do JC Hub.</p>
              </div>
            </div>
          </section>

          {/* Step 4 */}
          <section className="instruction-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h2 className="step-title">Assine os Eventos do Webhook</h2>
              <p className="step-description">
                Depois de configurar a URL, clique em <strong>Adicionar assinaturas</strong> para esta página. Selecione os seguintes campos obrigatórios:
              </p>
              <ul className="details-list">
                <li><code>messages</code></li>
                <li><code>messaging_postbacks</code></li>
              </ul>
            </div>
          </section>

          {/* Step 5 */}
          <section className="instruction-step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h2 className="step-title">Gere o Token de Acesso</h2>
              <p className="step-description">
                Na seção <strong>Token de Acesso</strong>, selecione a Página do Facebook que deseja conectar.
              </p>
              <p className="step-description">
                Clique em <strong>Gerar token</strong>. Este será o seu <strong>Access Token</strong>.
              </p>
              <div className="alert alert-warning">
                <strong>⚠️ Importante:</strong> Copie este token e o <strong>ID da Página</strong>. Você precisará deles na próxima tela.
              </div>
            </div>
          </section>

          {/* Step 6 */}
          <section className="instruction-step">
            <div className="step-number">6</div>
            <div className="step-content">
              <h2 className="step-title">Preencha os Dados no JC Hub</h2>
              <p className="step-description">
                Agora volte para a{' '}
                <Link to="/messenger/setup" className="internal-link">
                  tela de configuração do JC Hub
                </Link>{' '}
                e preencha:
              </p>
              <div className="fields-list">
                <div className="field-item">
                  <strong>Page ID:</strong> O ID da sua página do Facebook.
                </div>
                <div className="field-item">
                  <strong>Verify Token:</strong> O token que você criou no passo 3.
                </div>
                <div className="field-item">
                  <strong>Access Token:</strong> O token que você gerou no passo 5.
                </div>
              </div>
            </div>
          </section>

          {/* Step 7 */}
          <section className="instruction-step">
            <div className="step-number">7</div>
            <div className="step-content">
              <h2 className="step-title">Ative a Aplicação no Meta</h2>
              <p className="step-description">
                Por último, no Meta for Developers, coloque seu aplicativo no modo <strong>Ao Vivo</strong> (Live).
              </p>
              <div className="alert alert-success">
                <strong>✅ Pronto!</strong> Sua integração com o Messenger está configurada.
              </div>
            </div>
          </section>

          <div className="instructions-cta">
            <Link to="/messenger/setup" className="btn btn-primary btn-lg">
              Ir para Configuração
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstructionsDetailed;

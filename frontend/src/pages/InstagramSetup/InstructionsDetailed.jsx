import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './InstructionsDetailed.css';

const InstructionsDetailed = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) navigate('/login', { replace: true });
  }, [navigate]);

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/instagram-comment-chat` : '';

  return (
    <div className="instructions-detailed-page">
      <header className="instructions-header">
        <Link to="/" className="brand brand-link">JC Hub</Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Início</Link>
          <Link to="/instagram/setup" className="nav-link">Voltar para configuração</Link>
        </nav>
      </header>

      <main className="instructions-main">
        <div className="instructions-hero">
          <h1 className="hero-title">📘 Guia Completo: Configuração do Instagram</h1>
          <p className="hero-subtitle">
            Siga este passo a passo para conectar sua conta do Instagram ao JC Hub e começar a automatizar respostas.
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
                Selecione o tipo de aplicativo como <strong>Empresa</strong>.
              </p>
              <div className="step-image-wrapper">
                <img
                  src="/instructions/1_instrucoes_criar_app.png"
                  alt="Criar aplicativo no Meta for Developers"
                  className="step-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="image-placeholder" style={{ display: 'none' }}>
                  📷 Imagem: Tela de criação de aplicativo
                </div>
              </div>
            </div>
          </section>

          {/* Step 2 */}
          <section className="instruction-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h2 className="step-title">Configure os Detalhes do Aplicativo</h2>
              <div className="step-description">
                <ul className="details-list">
                  <li><strong>Nome do APP:</strong> Digite um nome para identificar seu aplicativo</li>
                  <li><strong>Email de contato:</strong> Seu e-mail de contato</li>
                  <li><strong>Portfólio empresarial:</strong> Não precisa marcar nada</li>
                </ul>
                <p>Clique em <strong>Criar aplicativo</strong> e insira sua senha do Facebook quando solicitado.</p>
              </div>
              <div className="step-image-wrapper">
                <img
                  src="/instructions/2_instrucoes_detalhes.png"
                  alt="Configurar detalhes do aplicativo"
                  className="step-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="image-placeholder" style={{ display: 'none' }}>
                  📷 Imagem: Detalhes do aplicativo
                </div>
              </div>
            </div>
          </section>

          {/* Step 3 */}
          <section className="instruction-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h2 className="step-title">Configure o Instagram no Seu APP</h2>
              <p className="step-description">
                Na tela de produtos, localize <strong>Instagram</strong> e clique em <strong>Configurar</strong>.
              </p>
              <div className="step-image-wrapper">
                <img
                  src="/instructions/3_instrucoes_configurar_insta.png"
                  alt="Configurar Instagram"
                  className="step-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="image-placeholder" style={{ display: 'none' }}>
                  📷 Imagem: Configurar Instagram
                </div>
              </div>
            </div>
          </section>

          {/* Step 4 */}
          <section className="instruction-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h2 className="step-title">Adicione uma Conta e Gere o Token de Acesso</h2>
              <p className="step-description">
                Clique em <strong>Adicionar uma conta</strong> do Instagram e siga o fluxo de autorização.
              </p>
              <p className="step-description">
                Após conectar, <strong>gere um token de acesso</strong>. Este será o seu <strong>PAGE_ACCESS_TOKEN</strong>.
              </p>
              <div className="alert alert-warning">
                <strong>⚠️ Importante:</strong> Salve esse token em local seguro! Você precisará dele para configurar o JC Hub.
              </div>
              <div className="step-image-wrapper">
                <img
                  src="/instructions/4_adicionar_conta_insta.png"
                  alt="Adicionar conta Instagram"
                  className="step-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="image-placeholder" style={{ display: 'none' }}>
                  📷 Imagem: Adicionar conta e gerar token
                </div>
              </div>
            </div>
          </section>

          {/* Step 5 */}
          <section className="instruction-step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h2 className="step-title">Configure o Webhook</h2>
              <p className="step-description">
                Na seção <strong>Webhooks</strong> do Instagram no Meta for Developers, configure a URL de callback:
              </p>
              <div className="code-block-wrapper">
                <code className="code-block">{webhookUrl}</code>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    alert('URL copiada!');
                  }}
                  title="Copiar URL"
                >
                  📋
                </button>
              </div>
              <div className="step-description">
                <p><strong>VERIFY_TOKEN:</strong> Escolha uma string aleatória e única (ex: <code>meu_token_123</code>).</p>
                <p>Inscreva-se nos campos <strong>comments</strong> e <strong>messages</strong>.</p>
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
                <Link to="/instagram/setup" className="internal-link">
                  tela de configuração do JC Hub
                </Link>{' '}
                e preencha:
              </p>
              <div className="fields-list">
                <div className="field-item">
                  <strong>VERIFY_TOKEN:</strong> O token que você escolheu no passo 5
                </div>
                <div className="field-item">
                  <strong>PAGE_ACCESS_TOKEN:</strong> O token gerado no passo 4
                </div>
                <div className="field-item">
                  <strong>Modo de operação:</strong> Escolha entre comentários, DM ou ambos
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
              <p className="step-description">
                Isso permitirá que o webhook receba eventos reais do Instagram.
              </p>
              <div className="alert alert-success">
                <strong>✅ Pronto!</strong> Sua integração está configurada. Agora você pode criar regras de automação.
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="instructions-cta">
            <Link to="/instagram/setup" className="btn btn-primary btn-lg">
              Ir para Configuração
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstructionsDetailed;

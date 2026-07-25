import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-5">
    <h2 className="h4 mb-3">{title}</h2>
    {children}
  </section>
);

const Tag = ({ children }) => (
  <span className="badge text-bg-light border me-2 mb-2">{children}</span>
);

const PrivacyPolicy = () => {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="container mt-5 mb-5">
      <div className="row g-4">
        <div className="col-12 col-lg-9">
          <div className="card shadow-sm h-100">
            <div className="card-body p-4 p-md-5">
              <header className="mb-4">
                <h1 className="display-6 mb-2">Política de Privacidade</h1>
                <p className="text-muted mb-3">Última atualização: {lastUpdated}</p>
                <div className="d-flex flex-wrap align-items-center">
                  <Tag>Sem cookies</Tag>
                  <Tag>Não coletamos dados pessoais</Tag>
                  <Tag>Sem rastreamento</Tag>
                </div>
              </header>

              <Section id="visao-geral" title="Visão geral">
                <p>
                  No Simplifica.AI, sua privacidade é uma prioridade. Projetamos o serviço para operar com o
                  mínimo possível de dados. Não coletamos, não armazenamos e não compartilhamos informações
                  pessoais de usuários. Também não utilizamos cookies de rastreamento ou tecnologias similares.
                </p>
              </Section>

              <Section id="dados-pessoais" title="Dados pessoais que NÃO coletamos">
                <p>
                  Não coletamos nenhuma informação capaz de identificar você, como nome, e-mail, telefone,
                  identificadores de dispositivo, localização, perfis sociais ou qualquer outro dado pessoal.
                </p>
                <ul>
                  <li>Não criamos perfis ou realizamos análises comportamentais.</li>
                  <li>Não comercializamos, alugamos ou compartilhamos informações de usuários.</li>
                  <li>Não realizamos enriquecimento de dados com terceiros.</li>
                </ul>
              </Section>

              <Section id="cookies" title="Uso de cookies">
                <p>
                  Não utilizamos cookies de rastreamento, cookies de publicidade, pixels ou beacons. Caso, no
                  futuro, algum cookie estritamente necessário seja adicionado para funcionalidades básicas da
                  aplicação, você será informado com transparência antes do uso.
                </p>
              </Section>

              <Section id="conteudo-recebido" title="Conteúdo recebido e processamento">
                <p>
                  Não tratamos as informações recebidas para fins de identificação, marketing, perfilamento ou
                  armazenamento duradouro. Qualquer processamento eventual é estritamente automatizado,
                  efêmero e limitado ao funcionamento imediato da ferramenta, sem retenção para além do
                  indispensável ao fluxo técnico.
                </p>
                <p className="mb-0">
                  Em termos simples: não guardamos o conteúdo que trafega pelo serviço, não criamos históricos
                  de interações para análise e não reutilizamos dados para nenhum outro propósito.
                </p>
              </Section>

              <Section id="seguranca" title="Segurança e boas práticas">
                <p>
                  Adotamos boas práticas de segurança na infraestrutura e no código. Ainda assim, nenhum
                  sistema é 100% imune a falhas. Mantemos o princípio de minimização de dados para reduzir
                  riscos: como não coletamos dados pessoais, não há repositórios sensíveis a proteger nesse
                  aspecto.
                </p>
              </Section>

              <Section id="direitos" title="Seus direitos">
                <p>
                  Como não coletamos dados pessoais, não há informações suas para acessar, corrigir ou apagar.
                  Se surgir qualquer dúvida sobre privacidade, entre em contato pelos canais de suporte do
                  produto e teremos prazer em ajudar.
                </p>
              </Section>

              <Section id="terceiros" title="Serviços de terceiros">
                <p>
                  Podemos integrar serviços externos operacionais (por exemplo, provedores de hospedagem ou
                  balanceadores de tráfego). Essas integrações não são usadas para coletar dados pessoais seus
                  por nossa iniciativa. Recomendamos consultar as políticas desses terceiros quando aplicável.
                </p>
              </Section>

              <Section id="alteracoes" title="Alterações desta política">
                <p>
                  Podemos atualizar esta política para refletir melhorias do produto ou mudanças regulatórias.
                  Quando isso ocorrer, atualizaremos a data no topo desta página. Se alterações relevantes
                  forem necessárias, informaremos com antecedência razoável.
                </p>
              </Section>

              <div className="d-flex gap-2">
                <Link to="/" className="btn btn-primary">Voltar para a Home</Link>
                <a href="#visao-geral" className="btn btn-outline-secondary">Voltar ao topo</a>
              </div>
            </div>
          </div>
        </div>

        <aside className="col-12 col-lg-3">
          <div className="card position-sticky top-0 shadow-sm" style={{ top: '6rem' }}>
            <div className="card-body p-3 p-md-4">
              <h2 className="h6 text-uppercase text-muted mb-3">Nesta página</h2>
              <nav className="nav flex-column small">
                <a className="nav-link px-0" href="#visao-geral">Visão geral</a>
                <a className="nav-link px-0" href="#dados-pessoais">Dados pessoais</a>
                <a className="nav-link px-0" href="#cookies">Cookies</a>
                <a className="nav-link px-0" href="#conteudo-recebido">Conteúdo recebido</a>
                <a className="nav-link px-0" href="#seguranca">Segurança</a>
                <a className="nav-link px-0" href="#direitos">Seus direitos</a>
                <a className="nav-link px-0" href="#terceiros">Serviços de terceiros</a>
                <a className="nav-link px-0" href="#alteracoes">Alterações</a>
              </nav>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
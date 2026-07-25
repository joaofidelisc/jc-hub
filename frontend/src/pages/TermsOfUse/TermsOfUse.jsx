import React from 'react';
import { Link } from 'react-router-dom';

const Section = ({ id, title, children }) => (
  <section id={id} className="mb-5">
    <h2 className="h4 mb-3">{title}</h2>
    {children}
  </section>
);

const TermsOfUse = () => {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="container mt-5 mb-5">
      <div className="row g-4">
        <div className="col-12 col-lg-9">
          <div className="card shadow-sm h-100">
            <div className="card-body p-4 p-md-5">
              <header className="mb-4">
                <h1 className="display-6 mb-2">Termos de Uso</h1>
                <p className="text-muted mb-0">Última atualização: {lastUpdated}</p>
              </header>

              <Section id="aceitacao" title="Aceitação dos termos">
                <p>
                  Ao utilizar o JC Hub, você declara ter lido, compreendido e concordado com estes Termos
                  de Uso e com a nossa <Link to="/privacy">Política de Privacidade</Link>.
                </p>
              </Section>

              <Section id="servico" title="Descrição do serviço">
                <p>
                  O JC Hub é um serviço que auxilia na automação de interações em canais sociais.
                  O uso deve sempre respeitar as regras das plataformas integradas e a legislação aplicável.
                </p>
              </Section>

              <Section id="uso-aceitavel" title="Uso aceitável">
                <ul>
                  <li>Não utilizar para SPAM, assédio, discurso de ódio, conteúdo ilegal ou enganoso.</li>
                  <li>Observar e cumprir as políticas do Instagram/Meta e demais plataformas.</li>
                  <li>Não tentar contornar limitações técnicas, segurança ou rate limits.</li>
                  <li>Assumir responsabilidade pelo conteúdo enviado por sua conta.</li>
                </ul>
              </Section>

              <Section id="privacidade" title="Privacidade e dados">
                <p>
                  Valorizamos sua privacidade. Conforme a nossa Política de Privacidade, não coletamos dados
                  pessoais, não utilizamos cookies e não tratamos as informações recebidas para fins de
                  identificação, marketing ou perfilamento.
                </p>
              </Section>

              <Section id="ia" title="Conteúdo gerado por IA">
                <p>
                  Mensagens ou sugestões automatizadas podem ser geradas por modelos de IA. Esses conteúdos
                  são fornecidos "no estado em que se encontram" e podem conter imprecisões. Você é responsável
                  por revisar e utilizar tais sugestões com discernimento.
                </p>
              </Section>

              <Section id="disclaimer" title="Isenções e limitações">
                <ul>
                  <li>Serviço oferecido "como está", sem garantias de resultados.</li>
                  <li>Não nos responsabilizamos por ações de terceiros, incluindo plataformas integradas.</li>
                  <li>Podem ocorrer interrupções para manutenção, atualização ou por motivos de força maior.</li>
                </ul>
              </Section>

              <Section id="suspensao" title="Suspensão e encerramento">
                <p>
                  Poderemos suspender ou encerrar o acesso em caso de violação destes termos, uso abusivo ou
                  indícios de atividades ilícitas.
                </p>
              </Section>

              <Section id="alteracoes" title="Alterações destes termos">
                <p>
                  Podemos atualizar estes Termos de tempos em tempos. A versão vigente é a mais recente
                  publicada nesta página. Alterações materiais serão comunicadas com antecedência razoável.
                </p>
              </Section>

              <div className="d-flex gap-2">
                <Link to="/" className="btn btn-primary">Voltar para a Home</Link>
                <a href="#aceitacao" className="btn btn-outline-secondary">Voltar ao topo</a>
              </div>
            </div>
          </div>
        </div>

        <aside className="col-12 col-lg-3">
          <div className="card position-sticky top-0 shadow-sm" style={{ top: '6rem' }}>
            <div className="card-body p-3 p-md-4">
              <h2 className="h6 text-uppercase text-muted mb-3">Nesta página</h2>
              <nav className="nav flex-column small">
                <a className="nav-link px-0" href="#aceitacao">Aceitação dos termos</a>
                <a className="nav-link px-0" href="#servico">Descrição do serviço</a>
                <a className="nav-link px-0" href="#uso-aceitavel">Uso aceitável</a>
                <a className="nav-link px-0" href="#privacidade">Privacidade e dados</a>
                <a className="nav-link px-0" href="#ia">Conteúdo de IA</a>
                <a className="nav-link px-0" href="#disclaimer">Isenções</a>
                <a className="nav-link px-0" href="#suspensao">Suspensão</a>
                <a className="nav-link px-0" href="#alteracoes">Alterações</a>
              </nav>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TermsOfUse;
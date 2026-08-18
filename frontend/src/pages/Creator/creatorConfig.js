export const CONTENT_STRATEGIES = [
  {
    id: 'funnel',
    label: 'Funil de vendas',
    short: 'Atrair, nutrir e converter',
    description: 'Distribui conteúdos entre descoberta, consideração e oferta para conduzir o público até a compra.',
    definition: 'Organiza o conteúdo conforme o nível de consciência e proximidade de compra do público. A comunicação começa ampla, aprofunda o problema e só então apresenta a solução.',
    path: [
      { title: 'Atração', text: 'Ganchos, dúvidas e problemas que fazem novas pessoas reconhecerem uma necessidade.' },
      { title: 'Consideração', text: 'Métodos, comparações, bastidores e provas que ajudam o público a avaliar caminhos.' },
      { title: 'Conversão', text: 'Oferta, tratamento de objeções e chamadas para uma próxima ação clara.' },
    ],
    aiBehavior: 'A Nova equilibra as etapas no período, avança a conversa de uma publicação para a seguinte e evita transformar todos os posts em oferta.',
    idealFor: 'Geração de leads, pedidos de orçamento e vendas com uma jornada de decisão identificável.',
    accent: '#2583ff',
  },
  {
    id: 'authority',
    label: 'Autoridade',
    short: 'Ensinar e gerar confiança',
    description: 'Prioriza análises, métodos, bastidores e provas que posicionam a marca como referência no nicho.',
    definition: 'Constrói percepção de competência por meio de conhecimento aplicado, posicionamento e evidências — sem depender de autopromoção constante.',
    path: [
      { title: 'Diagnóstico', text: 'A IA identifica dúvidas, erros comuns e decisões relevantes para o seu público.' },
      { title: 'Método', text: 'Transforma conhecimento em análises, frameworks, opiniões e demonstrações práticas.' },
      { title: 'Confiança', text: 'Distribui provas, bastidores e resultados que sustentam o posicionamento apresentado.' },
    ],
    aiBehavior: 'A Nova privilegia profundidade, clareza e evidência; nas redes profissionais, aumenta o nível analítico e contextual.',
    idealFor: 'Serviços especializados, negócios B2B, profissionais liberais e marcas que precisam reduzir objeções de confiança.',
    accent: '#7b61e8',
  },
  {
    id: 'content_pillars',
    label: 'Pilares de conteúdo',
    short: 'Consistência editorial',
    description: 'Alterna pilares educativos, institucionais, relacionais e comerciais em uma cadência equilibrada.',
    definition: 'Cria territórios editoriais fixos para que a marca seja reconhecida por assuntos estratégicos sem ficar repetitiva ou dependente de campanhas.',
    path: [
      { title: 'Definição', text: 'A IA relaciona objetivo, oferta e público para definir os papéis editoriais do período.' },
      { title: 'Distribuição', text: 'Alterna educação, relacionamento, marca e conteúdo comercial ao longo do calendário.' },
      { title: 'Variação', text: 'Explora ângulos e formatos diferentes dentro de cada pilar para manter consistência sem repetição.' },
    ],
    aiBehavior: 'A Nova controla o equilíbrio entre pilares e compara cada nova pauta com o histórico antes de sugeri-la.',
    idealFor: 'Operações contínuas, marcas com vários temas relevantes e equipes que desejam previsibilidade editorial.',
    accent: '#13ad77',
  },
  {
    id: 'storytelling',
    label: 'Storytelling',
    short: 'Narrativas que conectam',
    description: 'Cria uma sequência de histórias, tensões e aprendizados para aumentar identificação e lembrança.',
    definition: 'Usa estrutura narrativa para transformar experiências, problemas e mudanças em histórias com contexto, tensão e aprendizado.',
    path: [
      { title: 'Contexto', text: 'Apresenta uma situação reconhecível, personagem ou cenário próximo da audiência.' },
      { title: 'Tensão e virada', text: 'Mostra o conflito, as escolhas e o ponto que muda a compreensão da história.' },
      { title: 'Aprendizado', text: 'Conecta a conclusão ao posicionamento da marca e convida o público a agir ou conversar.' },
    ],
    aiBehavior: 'A Nova cria continuidade narrativa entre posts, mas adapta duração, gancho e ritmo ao comportamento de cada rede.',
    idealFor: 'Humanização de marca, apresentação de casos, bastidores, causas e construção de identificação emocional.',
    accent: '#f5a623',
  },
  {
    id: 'launch',
    label: 'Lançamento',
    short: 'Aquecer, abrir e fechar',
    description: 'Organiza antecipação, educação, prova, abertura de oferta e urgência para campanhas com data.',
    definition: 'Concentra a comunicação em torno de uma oferta e de uma janela de decisão, preparando a audiência antes da abertura.',
    path: [
      { title: 'Aquecimento', text: 'Cria antecipação, consciência do problema e interesse na transformação prometida.' },
      { title: 'Abertura', text: 'Apresenta oferta, diferenciais, provas e respostas às principais objeções.' },
      { title: 'Fechamento', text: 'Reforça decisão, prazo e urgência ética sem repetir a mesma chamada todos os dias.' },
    ],
    aiBehavior: 'A Nova usa a data e a orientação adicional para distribuir as fases e intensificar a comunicação de forma progressiva.',
    idealFor: 'Cursos, eventos, novos produtos, campanhas sazonais e ofertas com início ou encerramento definidos.',
    accent: '#ec5a68',
  },
  {
    id: 'community',
    label: 'Comunidade',
    short: 'Relacionamento e conversa',
    description: 'Estimula participação, conteúdo colaborativo, perguntas e pertencimento para fortalecer a audiência.',
    definition: 'Prioriza vínculos recorrentes, escuta e participação para transformar seguidores em uma audiência que conversa e contribui.',
    path: [
      { title: 'Escuta', text: 'Parte de dúvidas, experiências e temas que convidam o público a se reconhecer.' },
      { title: 'Participação', text: 'Alterna perguntas, enquetes, desafios, respostas e conteúdo criado com a comunidade.' },
      { title: 'Pertencimento', text: 'Reforça valores, rituais, linguagem e conquistas compartilhadas pela audiência.' },
    ],
    aiBehavior: 'A Nova escolhe formatos de baixa fricção, CTAs conversacionais e oportunidades de reutilizar respostas como novos conteúdos.',
    idealFor: 'Marcas que dependem de recorrência, indicação, engajamento, membros, clientes fiéis ou construção coletiva.',
    accent: '#16a8c7',
  },
];

export const AVAILABLE_NETWORKS = ['Instagram', 'LinkedIn', 'Facebook', 'TikTok', 'Twitter'];
export const AVAILABLE_DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const toLocalISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayISO = () => toLocalISODate(new Date());

export const getMaxEndDate = (startDate) => {
  if (!startDate) return '';
  const [year, month, day] = startDate.split('-').map(Number);
  const result = new Date(year, month - 1, day);
  result.setMonth(result.getMonth() + 1);
  result.setDate(result.getDate() - 1);
  return toLocalISODate(result);
};

export const formatDateBR = (value) => {
  if (!value) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

export const parseDateBR = (value) => {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';
  const [, day, month, year] = match;
  const candidate = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    candidate.getFullYear() !== Number(year)
    || candidate.getMonth() !== Number(month) - 1
    || candidate.getDate() !== Number(day)
  ) return '';
  return `${year}-${month}-${day}`;
};

export const maskDateBR = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

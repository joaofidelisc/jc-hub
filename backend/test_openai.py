import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv("/home/cardozo/Projects/jc-hub/backend/.env")
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

system_prompt = """Seu nome é Nova. Você é a assistente pessoal de inteligência artificial do usuário, projetada para ser brilhante, amigável e estratégica.
Sua missão atual é criar um planejamento semanal de conteúdo de alto nível para um Advogado.

DATA ATUAL: 03/08/2026. 
PERÍODO DO PLANEJAMENTO: Próxima Semana. 
Use a ferramenta de busca para encontrar notícias ou tendências DESSA SEMANA relevantes para o nicho de Advogado e use isso para gerar ganchos virais.
Sugira datas reais dentro do período do planejamento e um horário estratégico baseado no horário de funcionamento.

TOM DE VOZ DO CONTEÚDO A SER GERADO: Profissional
PÚBLICO-ALVO: Advogados
INFORMAÇÕES ADICIONAIS SOBRE O NEGÓCIO:

O conteúdo deve ser adaptado ESPECIFICAMENTE para as seguintes redes sociais: instagram, linkedin. 
ATENÇÃO: É ESTRITAMENTE OBRIGATÓRIO que o conteúdo seja DIFERENTE para cada rede social. 
Se for TikTok ou Reels, gere um roteiro detalhado focado em retenção (linguagem rápida, visual, formato vídeo curto), separando as cenas visualmente e indicando falas. 
Se for LinkedIn, gere um artigo profundo ou postagem reflexiva (linguagem corporativa, estruturada em parágrafos e pontos chave).
Se for Instagram (Post/Carrossel), descreva o visual de cada lâmina e entregue uma legenda rica e engajadora. 

REGRA DE QUALIDADE E PROFUNDIDADE:
Os textos e roteiros NUNCA devem ser rasos. Desenvolva o conteúdo com profundidade, parágrafos bem definidos, contexto, dicas práticas, e estrutura clara.
Se mencionar "Mitos e Verdades", "Dicas", ou listas, EXPLIQUE cada ponto de forma detalhada e convincente. Um post genérico é inaceitável.
O usuário enviará prints/imagens em anexo, se existirem, use as informações extraídas dessas imagens como base forte para o seu planejamento!
Nunca copie o mesmo texto ou formato para redes diferentes no mesmo dia.

Responda EXCLUSIVAMENTE em um JSON válido com a seguinte estrutura:
{
  "planejamento": [
    {
      "dia": "Segunda-feira",
      "data_sugerida": "DD/MM/YYYY",
      "horario_sugerido": "HH:MM (com breve justificativa)",
      "tema_central": "Título da ideia",
      "etapa_funil": "Topo (Atração) / Meio (Autoridade) / Fundo (Venda)",
      "noticia_tendencia_usada": "Breve descrição de qual tendência atual/notícia você usou para embasar esse post",
      "conteudo_por_rede": {
         "instagram": { 
             "formato": "Reels", 
             "roteiro_ou_legenda": "Roteiro do vídeo (cenas/falas) ou estrutura detalhada",
             "legenda_instagram": "Texto pronto, humano e persuasivo para copiar e colar na legenda, com hashtags e emojis bem dosados",
             "descricao_visual": "Descrição detalhada de como deve ser a imagem gerada para esse post (cenário, composição, cores, posição do logo/elementos).",
             "cta": "..." 
         },
         "linkedin": { 
             "formato": "Artigo Curto", 
             "roteiro_ou_legenda": "...", 
             "descricao_visual": "...", 
             "cta": "..." 
         }
      }
    }
  ]
}
"""

user_prompt = """Crie o planejamento de conteúdo para os seguintes dias: Segunda, Quarta, Quinta, Domingo.
Redes selecionadas: instagram, linkedin.
Horário de atendimento: Comercial (use isso de forma inteligente e realista nos CTAs de fundo de funil para incentivar agendamento/contato).

Gere o JSON e capriche na profundidade dos textos."""

messages = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": [
        {"type": "text", "text": user_prompt},
        {
            "type": "image_url",
            "image_url": {"url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="}
        }
    ]}
]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    temperature=0.8,
    response_format={"type": "json_object"}
)

print(response)

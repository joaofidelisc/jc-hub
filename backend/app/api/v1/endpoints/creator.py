import json
import uuid
import re
import requests
from typing import List, Optional
from openai import OpenAI
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.content_history import ContentHistory
from app.models.creator_plan import CreatorPlan

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    contextData: Optional[dict] = None

class CreatorRequest(BaseModel):
    niche: str
    persona: str
    businessHours: str
    networks: List[str]
    tone: str
    days: List[str]
    week: str = "Semana Atual"
    businessInfo: Optional[str] = None
    prints: Optional[List[str]] = None
    logo: Optional[List[str]] = None

def extract_json(raw_text: str) -> dict:
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        pass
        
    match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", raw_text)
    if match:
        try:
            return json.loads(match.group(1))
        except:
            pass
            
    start = raw_text.find('{')
    end = raw_text.rfind('}')
    if start != -1 and end > start:
        try:
            return json.loads(raw_text[start:end+1])
        except:
            pass
            
    raise ValueError("Failed to extract JSON from Gemini response")

@router.post("/generate")
def generate_content(
    req: CreatorRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OpenAI API Key não configurada.")
        
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
    # Get last 30 themes
    history = db.query(ContentHistory).filter(
        ContentHistory.user_id == current_user.id
    ).order_by(ContentHistory.created_at.desc()).limit(30).all()
    
    recent_themes = [h.theme for h in history]
    
    unique_id = str(uuid.uuid4())[:8]
    anti_repetition_block = ""
    if recent_themes:
        themes_list = "\n- ".join(recent_themes)
        anti_repetition_block = f"""

━━━ REGRA CRÍTICA DE ORIGINALIDADE (ID: {unique_id}) ━━━
Os seguintes temas JÁ FORAM GERADOS anteriormente e estão PROIBIDOS.
Não repita nem reformule nenhum deles. Não use o mesmo ângulo, situação ou abordagem.

TEMAS PROIBIDOS:
- {themes_list}

Estratégia obrigatória: explore ângulos INÉDITOS como casos práticos, mitos e verdades, perguntas frequentes não óbvias, dicas, e novidades."""
    else:
        anti_repetition_block = f"""

━━━ REGRA DE ORIGINALIDADE (ID: {unique_id}) ━━━
Gere conteúdo 100% original e criativo. Explore ângulos variados, casos reais, mitos e verdades, e situações cotidianas."""

    # Get last 2 plans for strategic continuation
    recent_plans = db.query(CreatorPlan).filter(
        CreatorPlan.user_id == current_user.id
    ).order_by(CreatorPlan.created_at.desc()).limit(2).all()
    
    past_strategy_block = ""
    if recent_plans:
        strategy_texts = []
        for p in reversed(recent_plans):
            plan_json = p.plan_json
            week_lbl = plan_json.get("week_label", "")
            posts = plan_json.get("planejamento", [])
            summaries = [f"  - [{post.get('dia')}] {post.get('etapa_funil', '')} - {post.get('tema_central')}" for post in posts]
            strategy_texts.append(f"Semana ({week_lbl}):\n" + "\n".join(summaries))
        
        past_str = "\n\n".join(strategy_texts)
        past_strategy_block = f"""
━━━ CONTINUIDADE ESTRATÉGICA ━━━
O usuário já gerou os seguintes planejamentos recentemente:
{past_str}

Sua tarefa é dar CONTINUIDADE a essa estratégia. 
NÃO repita os mesmos temas. Crie uma evolução lógica. Construa uma narrativa conectada com o que já foi postado!"""

    today = datetime.now()
    if req.week == "Próxima Semana":
        reference_date = today + timedelta(days=7)
    else:
        reference_date = today
        
    start_of_week = reference_date - timedelta(days=reference_date.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    week_str = f"de {start_of_week.strftime('%d/%m/%Y')} a {end_of_week.strftime('%d/%m/%Y')}"
    business_info_block = (
        f"INFORMAÇÕES ADICIONAIS SOBRE O NEGÓCIO:\n{req.businessInfo}\n"
        if req.businessInfo
        else ""
    )

    system_prompt = f"""Seu nome é Nova. Você é a assistente pessoal de inteligência artificial do usuário, projetada para ser brilhante, amigável e estratégica.
Sua missão atual é criar um planejamento semanal de conteúdo de alto nível para um {req.niche}.

DATA ATUAL: {today.strftime('%d/%m/%Y')}. 
PERÍODO DO PLANEJAMENTO: {req.week} ({week_str}). 
Use a ferramenta de busca para encontrar notícias ou tendências DESSA SEMANA relevantes para o nicho de {req.niche} e use isso para gerar ganchos virais.
Sugira datas reais dentro do período do planejamento e um horário estratégico baseado no horário de funcionamento.

TOM DE VOZ DO CONTEÚDO A SER GERADO: {req.tone}
PÚBLICO-ALVO: {req.persona}
{business_info_block}
{anti_repetition_block}
{past_strategy_block}

O conteúdo deve ser adaptado ESPECIFICAMENTE para as seguintes redes sociais: {', '.join(req.networks)}. 
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
{{
  "planejamento": [
    {{
      "dia": "Segunda-feira",
      "data_sugerida": "DD/MM/YYYY",
      "horario_sugerido": "HH:MM (com breve justificativa)",
      "tema_central": "Título da ideia",
      "etapa_funil": "Topo (Atração) / Meio (Autoridade) / Fundo (Venda)",
      "noticia_tendencia_usada": "Breve descrição de qual tendência atual/notícia você usou para embasar esse post",
      "conteudo_por_rede": {{
         "instagram": {{ 
             "formato": "Reels", 
             "roteiro_ou_legenda": "Roteiro do vídeo (cenas/falas) ou estrutura detalhada",
             "legenda_instagram": "Texto pronto, humano e persuasivo para copiar e colar na legenda, com hashtags e emojis bem dosados",
             "descricao_visual": "Descrição detalhada de como deve ser a imagem gerada para esse post (cenário, composição, cores, posição do logo/elementos).",
             "cta": "..." 
         }},
         "linkedin": {{ 
             "formato": "Artigo Curto", 
             "roteiro_ou_legenda": "...", 
             "descricao_visual": "...", 
             "cta": "..." 
         }}
      }}
    }}
  ]
}}
"""

    user_prompt = f"""Crie o planejamento de conteúdo para os seguintes dias: {', '.join(req.days)}.
Redes selecionadas: {', '.join(req.networks)}.
Horário de atendimento: {req.businessHours} (use isso de forma inteligente e realista nos CTAs de fundo de funil para incentivar agendamento/contato).

Gere o JSON e capriche na profundidade dos textos."""

    messages = [
        {"role": "system", "content": system_prompt}
    ]

    user_message_content = [{"type": "text", "text": user_prompt}]
    
    if req.logo:
        user_message_content.append({"type": "text", "text": "Aqui está o logotipo do negócio:"})
        for b64_img in req.logo:
            img_url = b64_img if b64_img.startswith("data:image") else f"data:image/jpeg;base64,{b64_img}"
            user_message_content.append({
                "type": "image_url",
                "image_url": {"url": img_url}
            })

    if req.prints:
        user_message_content.append({"type": "text", "text": "Aqui estão exemplos de posts anteriores ou referências visuais:"})
        for b64_img in req.prints:
            # We assume it comes as data:image/jpeg;base64,... 
            # or just base64. Let's pass it properly if it has the prefix.
            img_url = b64_img if b64_img.startswith("data:image") else f"data:image/jpeg;base64,{b64_img}"
            user_message_content.append({
                "type": "image_url",
                "image_url": {"url": img_url}
            })

    messages.append({"role": "user", "content": user_message_content})

    print("=== OPENAI PAYLOAD ===")
    print(f"System: {system_prompt[:100]}...\nUser: {user_prompt[:100]}...")
    if req.logo:
        print(f"[{len(req.logo)} logotipos anexados na requisição multimodal]")
    if req.prints:
        print(f"[{len(req.prints)} prints anexados na requisição multimodal]")
    print("======================")

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=1.0 if recent_themes else 0.8,
            response_format={"type": "json_object"}
        )
        
        text = response.choices[0].message.content
        if not text:
            raise ValueError("Resposta vazia da OpenAI")
            
        print("=== OPENAI RESPONSE ===")
        print(text)
        print("=======================")
            
        plan_json = extract_json(text)
        
        # Injeta o rótulo da semana para agrupamento
        plan_json["week_label"] = week_str
        
        # Save generated themes to history
        for p in plan_json.get("planejamento", []):
            tema = p.get("tema_central")
            if tema:
                new_history = ContentHistory(user_id=current_user.id, theme=tema[:500])
                db.add(new_history)
        
        # Check if a plan for this week already exists to overwrite it
        existing_plans = db.query(CreatorPlan).filter(CreatorPlan.user_id == current_user.id).all()
        plan_to_overwrite = None
        for ep in existing_plans:
            if ep.plan_json.get("week_label") == week_str:
                plan_to_overwrite = ep
                break
                
        if plan_to_overwrite:
            plan_to_overwrite.plan_json = plan_json
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(plan_to_overwrite, "plan_json")
            db.commit()
            db.refresh(plan_to_overwrite)
            return {
                "id": plan_to_overwrite.id,
                "created_at": plan_to_overwrite.created_at.isoformat(),
                "plan_json": plan_json
            }
        else:
            new_plan = CreatorPlan(user_id=current_user.id, plan_json=plan_json)
            db.add(new_plan)
            db.commit()
            db.refresh(new_plan)
            return {
                "id": new_plan.id,
                "created_at": new_plan.created_at.isoformat(),
                "plan_json": plan_json
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Exception in generate_content: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno ao gerar conteúdo.")

@router.post("/chat")
async def chat_nova(req: ChatRequest, current_user: User = Depends(get_current_user)):
    try:
        if not settings.OPENAI_API_KEY:
            raise HTTPException(status_code=503, detail="OpenAI API Key não configurada.")
            
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        system_prompt = f"""Você é a Nova, uma consultora especialista em redes sociais e criação de conteúdo.
O usuário acabou de gerar o seguinte planejamento estratégico para a sua marca:
{req.contextData if hasattr(req, 'contextData') else 'Não informado'}

Sua missão é ajudar o usuário a refinar esse planejamento, tirar dúvidas, dar dicas de roteiros para os vídeos, ou sugerir variações.
Seja criativa, analítica e muito amigável (use emojis ✨).
Você NÃO deve fazer perguntas infinitas, apenas responda as dúvidas do usuário de forma executiva e brilhante.
"""

        messages = [{"role": "system", "content": system_prompt}]
        for msg in req.messages:
            role = "user" if msg.role == "user" else "assistant"
            messages.append({"role": role, "content": msg.text})
            
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.5
        )
        
        response_text = response.choices[0].message.content.strip()
        
        return {"response": response_text}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Exception in chat_nova: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro de comunicação com a Nova.")

@router.get("/check-plan")
def check_creator_plan(week: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.now()
    if week == "Próxima Semana":
        reference_date = today + timedelta(days=7)
    else:
        reference_date = today
        
    start_of_week = reference_date - timedelta(days=reference_date.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    week_str = f"de {start_of_week.strftime('%d/%m/%Y')} a {end_of_week.strftime('%d/%m/%Y')}"

    existing_plans = db.query(CreatorPlan).filter(CreatorPlan.user_id == current_user.id).all()
    for ep in existing_plans:
        if ep.plan_json.get("week_label") == week_str:
            return {"exists": True, "label": week_str}
    
    return {"exists": False, "label": week_str}

@router.get("/history")
def get_creator_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        plans = db.query(CreatorPlan).filter(CreatorPlan.user_id == current_user.id).order_by(CreatorPlan.created_at.desc()).all()
        return [{"id": p.id, "created_at": p.created_at.isoformat(), "plan_json": p.plan_json} for p in plans]
    except Exception as e:
        print(f"Exception in get_creator_history: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao buscar histórico.")
@router.post("/plan/{plan_id}/toggle/{post_index}")
def toggle_post_status(plan_id: int, post_index: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        plan = db.query(CreatorPlan).filter(CreatorPlan.id == plan_id, CreatorPlan.user_id == current_user.id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Plano não encontrado.")
            
        plan_json = plan.plan_json
        if "planejamento" in plan_json and post_index < len(plan_json["planejamento"]):
            current_status = plan_json["planejamento"][post_index].get("feito", False)
            plan_json["planejamento"][post_index]["feito"] = not current_status
            
            # Use flag_modified so SQLAlchemy knows the JSON mutated
            from sqlalchemy.orm.attributes import flag_modified
            plan.plan_json = plan_json
            flag_modified(plan, "plan_json")
            db.commit()
            
            return {"status": "success", "feito": not current_status, "plan_json": plan_json}
        else:
            raise HTTPException(status_code=400, detail="Índice de postagem inválido.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Exception in toggle_post_status: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro ao atualizar status.")

@router.post("/plan/{plan_id}/generate-image/{post_index}")
def generate_post_image(plan_id: int, post_index: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        plan = db.query(CreatorPlan).filter(CreatorPlan.id == plan_id, CreatorPlan.user_id == current_user.id).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Plano não encontrado.")
            
        plan_json = plan.plan_json
        if "planejamento" not in plan_json or post_index >= len(plan_json["planejamento"]):
            raise HTTPException(status_code=400, detail="Índice de postagem inválido.")
            
        post = plan_json["planejamento"][post_index]
        tema = post.get("tema_central", "")
        conteudo_por_rede = post.get("conteudo_por_rede", {})
        
        descricao_visual = ""
        roteiro = ""
        if conteudo_por_rede:
            first_network = list(conteudo_por_rede.keys())[0]
            descricao_visual = conteudo_por_rede[first_network].get("descricao_visual", "")
            roteiro = conteudo_por_rede[first_network].get("roteiro_ou_legenda", "")

        context_visual = descricao_visual if descricao_visual else roteiro[:400]
        prompt = f"Uma imagem criativa, profissional e atraente para um post de rede social. O tema central do post é: '{tema}'. Contexto visual obrigatório: {context_visual}. Atenção: Não escreva textos legíveis ou palavras específicas na imagem, mantenha o foco puramente visual e estético."
        
        if not settings.OPENAI_API_KEY:
            raise HTTPException(status_code=503, detail="OpenAI API Key não configurada.")
            
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            response_format="b64_json",
            n=1
        )
        
        image_data = response.data[0]
        b64_image = getattr(image_data, "b64_json", None)
        if not b64_image:
            raise ValueError("Resposta da OpenAI não retornou imagem base64.")
            
        image_url = f"data:image/png;base64,{b64_image}"
        return {"image_url": image_url}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Exception in generate_post_image: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno ao gerar a imagem.")

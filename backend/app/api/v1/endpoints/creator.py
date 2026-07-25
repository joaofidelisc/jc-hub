import json
import uuid
import re
import requests
from typing import List, Optional
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
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="Gemini API Key não configurada.")
        
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

    today = datetime.now()
    if req.week == "Próxima Semana":
        reference_date = today + timedelta(days=7)
    else:
        reference_date = today
        
    start_of_week = reference_date - timedelta(days=reference_date.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    week_str = f"de {start_of_week.strftime('%d/%m/%Y')} a {end_of_week.strftime('%d/%m/%Y')}"

    system_prompt = f"""Seu nome é Nova. Você é a assistente pessoal de inteligência artificial do usuário, projetada para ser brilhante, amigável e estratégica.
Sua missão atual é criar um planejamento semanal de conteúdo de alto nível para um {req.niche}.

DATA ATUAL: {today.strftime('%d/%m/%Y')}. 
PERÍODO DO PLANEJAMENTO: {req.week} ({week_str}). 
Use a ferramenta de busca para encontrar notícias ou tendências DESSA SEMANA relevantes para o nicho de {req.niche} e use isso para gerar ganchos virais.
Sugira datas reais dentro do período do planejamento e um horário estratégico baseado no horário de funcionamento.

TOM DE VOZ DO CONTEÚDO A SER GERADO: {req.tone}
PÚBLICO-ALVO: {req.persona}
{anti_repetition_block}

O conteúdo deve ser adaptado ESPECIFICAMENTE para as seguintes redes sociais: {', '.join(req.networks)}. 
ATENÇÃO: É ESTRITAMENTE OBRIGATÓRIO que o conteúdo seja DIFERENTE para cada rede social. 
Se for TikTok ou Reels, gere um script narrado focado em retenção (linguagem rápida, visual, formato vídeo curto). 
Se for LinkedIn, gere um artigo ou postagem reflexiva (linguagem corporativa e estruturada).
Se for Instagram (Post/Carrossel), foque em dicas visuais curtas e impacto direto. 
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
         "instagram": {{ "formato": "Reels", "roteiro_ou_legenda": "...", "cta": "..." }},
         "linkedin": {{ "formato": "Artigo Curto", "roteiro_ou_legenda": "...", "cta": "..." }}
         // (Apenas inclua as chaves para as redes solicitadas)
      }}
    }}
  ]
}}
"""

    user_prompt = f"""Crie o planejamento de conteúdo para os seguintes dias: {', '.join(req.days)}.
Redes selecionadas: {', '.join(req.networks)}.
Horário de atendimento: {req.businessHours} (use isso de forma inteligente e realista nos CTAs de fundo de funil para incentivar agendamento/contato).

Gere o JSON."""

    payload = {
        "systemInstruction": {
            "role": "model",
            "parts": [{"text": system_prompt}]
        },
        "contents": [{
            "role": "user",
            "parts": [{"text": user_prompt}]
        }],
        "generationConfig": {
            "temperature": 1.0 if recent_themes else 0.8,
            "responseMimeType": "application/json"
        }
    }

    print("=== GEMINI PAYLOAD ===")
    print(json.dumps(payload, indent=2))
    print("======================")

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        
        # O timeout voltou para um valor normal (60s) pois a API do Gemini é extremamente rápida
        resp = requests.post(url, json=payload, timeout=60)
        
        if not resp.ok:
            print("Gemini API Error:", resp.text)
            raise HTTPException(status_code=502, detail="Erro ao se comunicar com a inteligência artificial (Gemini).")
            
        data = resp.json()
        
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            text = ""
            
        if not text:
            raise ValueError("Resposta vazia do Gemini")
            
        print("=== GEMINI RESPONSE ===")
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
        system_prompt = f"""Você é a Nova, uma consultora especialista em redes sociais e criação de conteúdo.
O usuário acabou de gerar o seguinte planejamento estratégico para a sua marca:
{req.contextData if hasattr(req, 'contextData') else 'Não informado'}

Sua missão é ajudar o usuário a refinar esse planejamento, tirar dúvidas, dar dicas de roteiros para os vídeos, ou sugerir variações.
Seja criativa, analítica e muito amigável (use emojis ✨).
Você NÃO deve fazer perguntas infinitas, apenas responda as dúvidas do usuário de forma executiva e brilhante.
"""

        contents = []
        for msg in req.messages:
            role = "user" if msg.role == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg.text}]
            })
            
        payload = {
            "systemInstruction": {
                "role": "model",
                "parts": [{"text": system_prompt}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.5
            }
        }
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        resp = requests.post(url, json=payload, timeout=60)
        
        if not resp.ok:
            print("Gemini API Error:", resp.text)
            raise HTTPException(status_code=502, detail="Erro ao se comunicar com a inteligência artificial (Gemini).")
            
        data = resp.json()
        try:
            response_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError):
            response_text = ""
        
        return {"response": response_text}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Exception in chat_nova: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro de comunicação com a Nova.")

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

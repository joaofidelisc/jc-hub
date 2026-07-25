import json
import uuid
import re
import requests
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.content_history import ContentHistory

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

    system_prompt = f"""Seu nome é Nova. Você é a assistente pessoal de inteligência artificial do usuário, projetada para ser brilhante, amigável e estratégica.
Sua missão atual é criar um planejamento semanal de conteúdo de alto nível para um {req.niche}.

DATA ATUAL: {datetime.now().strftime('%d/%m/%Y')}. Use a ferramenta de busca para encontrar notícias ou tendências DESSA SEMANA relevantes para o nicho de {req.niche} e use isso para gerar ganchos virais.

TOM DE VOZ DO CONTEÚDO A SER GERADO: {req.tone}
PÚBLICO-ALVO: {req.persona}
{anti_repetition_block}

O conteúdo deve ser adaptado ESPECIFICAMENTE para as seguintes redes sociais: {', '.join(req.networks)}.

Responda EXCLUSIVAMENTE em um JSON válido com a seguinte estrutura:
{{
  "planejamento": [
    {{
      "dia": "Segunda-feira",
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

    # Format prompt using Qwen ChatML syntax
    prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{user_prompt}<|im_end|>\n<|im_start|>assistant\n"

    payload = {
        "model": "qwen2.5:7b",
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 1.0 if recent_themes else 0.8
        }
    }

    try:
        url = "http://201.23.79.153:11434/api/generate"
        resp = requests.post(url, json=payload, timeout=120)
        
        if not resp.ok:
            print("Ollama API Error:", resp.text)
            raise HTTPException(status_code=502, detail="Erro ao se comunicar com a IA local.")
            
        data = resp.json()
        text = data.get("response", "")
        
        if not text:
            raise ValueError("Resposta vazia da IA local")
            
        plan_json = extract_json(text)
        
        # Save generated themes to history
        for p in plan_json.get("planejamento", []):
            tema = p.get("tema_central")
            if tema:
                new_history = ContentHistory(user_id=current_user.id, theme=tema[:500])
                db.add(new_history)
        db.commit()
        
        return plan_json
        
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

        # Build history for Qwen using ChatML prompt
        prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n"
        # Do not include hardcoded Nova greeting for the sidecar history if we want a fresh start,
        # but the sidecar frontend includes its own greeting in `req.messages`, so we just loop them.
        
        for msg in req.messages:
            if msg.role == "user":
                prompt += f"<|im_start|>user\n{msg.text}<|im_end|>\n"
            else:
                prompt += f"<|im_start|>assistant\n{msg.text}<|im_end|>\n"
        
        # Add final prompt trigger for the model to reply
        prompt += "<|im_start|>assistant\n"
            
        payload = {
            "model": "qwen2.5:7b",
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.5,
                "stop": ["<|im_end|>"]
            }
        }
        
        url = "http://201.23.79.153:11434/api/generate"
        resp = requests.post(url, json=payload, timeout=60)
        
        if not resp.ok:
            print("Ollama API Error:", resp.text)
            raise HTTPException(status_code=502, detail="Erro ao se comunicar com a IA local.")
            
        data = resp.json()
        response_text = data.get("response", "").strip()
        
        return {"response": response_text}
        
    except Exception as e:
        print(f"Exception in chat_nova: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro de comunicação com a Nova.")

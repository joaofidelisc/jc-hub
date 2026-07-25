import logging
import requests
from app.core.config import settings

GEMINI_MODEL = "gemini-2.0-flash"

def generate_ai_reply(user_message: str, matched_keywords: list, post_caption: str = None, business_context: str = None) -> str:
    """
    Gera resposta com Gemini considerando mensagem, palavras-chave e (opcional) legenda do post.
    """
    logging.info(f"Gemini usando modelo={GEMINI_MODEL}")
    if not settings.OPENAI_API_KEY: # Or settings.GEMINI_API_KEY if we used that. The user said gemini but we use OPENAI_API_KEY in jcbusiness config? Wait, jcbusiness config has OPENAI_API_KEY. I should use that or GEMINI_API_KEY. Let's add GEMINI_API_KEY to config here.
        pass

    import os
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        logging.warning("GEMINI_API_KEY ausente. IA não será usada.")
        return None
        
    try:
        prompt = (
            "Você é um assistente de atendimento breve e amigável.\n"
            f"Mensagem recebida: '{user_message}'.\n"
            f"Palavras-chave: {', '.join(matched_keywords) if matched_keywords else 'nenhuma'}.\n"
        )
        if post_caption:
            prompt += f"Legenda do post: '{post_caption}'.\n"
        if business_context:
            prompt += f"Contexto do negócio:\n{business_context}\n"
        prompt += "Responda em português, útil e curta (máx 250 caracteres), sem repetir integralmente a mensagem do usuário."
        payload = {"contents": [{"parts": [{"text": prompt}]}]}

        def _call(model_name):
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            headers = {
                "Content-Type": "application/json",
                "X-goog-api-key": gemini_key,
            }
            resp = requests.post(url, json=payload, headers=headers, timeout=15)
            return resp

        r = _call(GEMINI_MODEL)

        if r.status_code != 200:
            logging.error(f"Gemini erro {r.status_code}: {r.text}")
            return None

        data = r.json()
        txt = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text")
        
        if not txt:
            logging.info("Gemini retornou resposta vazia.")
            return None
        return txt.strip()
    except Exception as e:
        logging.error(f"Falha Gemini: {e}")
        return None

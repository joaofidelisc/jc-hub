import logging
from openai import OpenAI
from app.core.config import settings

def generate_ai_reply(user_message: str, matched_keywords: list, post_caption: str = None, business_context: str = None) -> str:
    """
    Gera resposta com OpenAI considerando mensagem, palavras-chave e (opcional) legenda do post.
    """
    logging.info("Usando OpenAI para gerar resposta do AI (modelo gpt-4o-mini)")
    if not settings.OPENAI_API_KEY:
        logging.warning("OPENAI_API_KEY ausente. IA não será usada.")
        return None
        
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
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
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.7,
            max_tokens=150
        )
        
        txt = response.choices[0].message.content
        if not txt:
            logging.info("OpenAI retornou resposta vazia.")
            return None
        return txt.strip()
    except Exception as e:
        logging.error(f"Falha OpenAI: {e}")
        return None

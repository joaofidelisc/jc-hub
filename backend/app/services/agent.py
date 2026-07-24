import httpx
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class AgentClient:
    def __init__(self):
        self.base_url = settings.AGENT_API_URL
        self.token = settings.AGENT_API_TOKEN
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    async def get_response(self, user_id: str, message: str) -> str:
        """
        Envia a mensagem recebida para o agente (OpenClaw) e retorna a resposta.
        Assume uma API compatível com OpenAI ou endpoints padrão de chat.
        """
        # Tentativa inicial utilizando um endpoint genérico de completition de chat
        url = f"{self.base_url}/api/chat/completions"
        payload = {
            "model": "openclaw-agent", # Pode precisar de ajuste dependendo do agente configurado
            "messages": [
                {"role": "user", "content": message}
            ],
            "user": user_id
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=self.headers, timeout=30.0)
                if response.status_code == 200:
                    data = response.json()
                    if "choices" in data and len(data["choices"]) > 0:
                        return data["choices"][0]["message"]["content"]
                    elif "response" in data:
                        return data["response"]
                    return "Não entendi a resposta do agente."
                else:
                    logger.error(f"Erro na API do Agente: {response.status_code} - {response.text}")
                    return "Desculpe, meu sistema de inteligência está temporariamente indisponível."
        except Exception as e:
            logger.error(f"Erro de conexão com o agente na VM: {e}")
            return "Estou enfrentando problemas técnicos no momento. Tente novamente mais tarde."

agent_client = AgentClient()

from fastapi import APIRouter, Request, BackgroundTasks
from app.services.evolution import evolution_client
from app.services.agent import agent_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])

async def process_whatsapp_message(payload: dict):
    try:
        # Extrai os dados básicos de um payload típico da Evolution API (messages.upsert)
        if "data" in payload and "message" in payload["data"]:
            message_data = payload["data"]
            remote_jid = message_data.get("key", {}).get("remoteJid", "")
            
            # Ignora mensagens de status e mensagens enviadas pelo próprio bot
            if remote_jid == "status@broadcast" or message_data.get("key", {}).get("fromMe", False):
                return

            # Extrai o texto da mensagem
            msg_content = message_data.get("message", {})
            text = msg_content.get("conversation") or msg_content.get("extendedTextMessage", {}).get("text", "")
            
            if not text:
                return

            logger.info(f"Mensagem recebida de {remote_jid}: {text}")

            # Envia para o agente (OpenClaw) e obtém a resposta
            agent_response = await agent_client.get_response(user_id=remote_jid, message=text)
            
            # Envia a resposta de volta pelo WhatsApp
            await evolution_client.send_text_message(number=remote_jid.replace("@s.whatsapp.net", ""), text=agent_response)
            
    except Exception as e:
        logger.error(f"Erro ao processar mensagem do webhook: {e}")

@router.post("/webhook")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    # Processa de forma assíncrona para não prender o webhook da Evolution
    background_tasks.add_task(process_whatsapp_message, payload)
    return {"status": "received"}

@router.get("/status")
async def get_whatsapp_status():
    status = await evolution_client.get_connection_state()
    return status

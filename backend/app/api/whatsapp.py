from fastapi import APIRouter, Request
from app.services.evolution import evolution_client

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])

@router.post("/webhook")
async def whatsapp_webhook(request: Request):
    payload = await request.json()
    # Logica para processar as mensagens recebidas do WhatsApp
    # e acionar os agentes de IA
    print("Received webhook payload:", payload)
    return {"status": "received"}

@router.get("/status")
async def get_whatsapp_status():
    status = await evolution_client.get_connection_state()
    return status

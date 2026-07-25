from fastapi import APIRouter, Request, Response
from fastapi.responses import PlainTextResponse
import logging
import json
import os
from app.core.redis import redis_client, IG_COMMENTS_QUEUE, IG_DMS_QUEUE, MESSENGER_DMS_QUEUE

router = APIRouter(tags=["Webhooks"])

APP_VERIFY_TOKEN = os.environ.get("APP_VERIFY_TOKEN", "jcbusiness_token")

@router.get("/instagram-webhook")
def verify_instagram_webhook(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    
    if mode and token:
        if mode == "subscribe" and token == APP_VERIFY_TOKEN:
            logging.info("Webhook Instagram verificado!")
            return PlainTextResponse(challenge, status_code=200)
        else:
            return Response(status_code=403)
    return Response(status_code=400)

@router.post("/instagram-webhook")
async def handle_instagram_webhook(request: Request):
    try:
        body = await request.json()
        entry = body.get("entry", [])
        if not entry:
            return Response(status_code=200)
            
        entry0 = entry[0]
        if "changes" in entry0:
            # Comentário
            comment_value = entry0.get("changes", [{}])[0].get("value", {})
            if comment_value.get("from", {}).get("self_ig_scoped_id"):
                return Response(status_code=200) # Ignora comentário próprio
            
            redis_client.rpush(IG_COMMENTS_QUEUE, json.dumps(body))
            
        elif "messaging" in entry0:
            # DM
            messaging_event = entry0.get("messaging", [{}])[0]
            if messaging_event.get("message", {}).get("is_echo"):
                return Response(status_code=200) # Ignora echo do próprio bot
                
            redis_client.rpush(IG_DMS_QUEUE, json.dumps(body))
            
        return Response(content="EVENT_RECEIVED", status_code=200)
    except Exception as e:
        logging.error(f"Erro no webhook IG: {e}")
        return Response(status_code=500)

@router.get("/messenger-webhook")
def verify_messenger_webhook(request: Request):
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")
    
    if mode and token:
        if mode == "subscribe" and token == APP_VERIFY_TOKEN:
            logging.info("Webhook Messenger verificado!")
            return PlainTextResponse(challenge, status_code=200)
        else:
            return Response(status_code=403)
    return Response(status_code=400)

@router.post("/messenger-webhook")
async def handle_messenger_webhook(request: Request):
    try:
        body = await request.json()
        if body.get("object") == "page":
            redis_client.rpush(MESSENGER_DMS_QUEUE, json.dumps(body))
            return Response(content="EVENT_RECEIVED", status_code=200)
        return Response(status_code=404)
    except Exception as e:
        logging.error(f"Erro no webhook Messenger: {e}")
        return Response(status_code=500)

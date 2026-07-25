import json
import logging
import time
import requests
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.redis import redis_client, IG_COMMENTS_QUEUE, IG_DMS_QUEUE, MESSENGER_DMS_QUEUE
from app.models.user_integration import UserIntegration
from app.models.ig_keyword import IgKeyword
from app.models.ig_pending_dm import IgPendingDm
from app.services.gemini import generate_ai_reply

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def send_api_request(url, payload, headers=None):
    try:
        r = requests.post(url, json=payload, headers=headers or {"Content-Type": "application/json"})
        if r.status_code in (200, 201):
            return True
        logging.error(f"Erro ao enviar requisição: {r.status_code} - {r.text}")
        return False
    except Exception as e:
        logging.exception(f"Erro ao conectar à API: {e}")
        return False

def flush_pending_dms(sender_instagram_id, integration_user_id, access_token):
    if not integration_user_id or not access_token:
        return {"processed": 0, "sent": 0}
        
    db: Session = SessionLocal()
    try:
        pending = db.query(IgPendingDm).filter(
            IgPendingDm.integration_user_id == integration_user_id,
            IgPendingDm.recipient_instagram_id == sender_instagram_id,
            IgPendingDm.sent == False
        ).all()
        
        sent_count = 0
        for p in pending:
            dm_url = "https://graph.instagram.com/v24.0/me/messages"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }
            if p.has_buttons and (p.button1_text or p.button2_text):
                buttons = []
                if p.button1_text and p.button1_url:
                    buttons.append({"type": "web_url", "title": p.button1_text[:20], "url": p.button1_url})
                if p.button2_text and p.button2_url:
                    buttons.append({"type": "web_url", "title": p.button2_text[:20], "url": p.button2_url})
                payload = {
                    "recipient": {"id": sender_instagram_id},
                    "message": {
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "template_type": "generic",
                                "elements": [{"title": p.message_text[:80], "buttons": buttons}],
                            },
                        }
                    },
                }
            else:
                payload = {"recipient": {"id": sender_instagram_id}, "message": {"text": p.message_text}}
                
            if send_api_request(dm_url, payload, headers):
                p.sent = True
                sent_count += 1
                db.add(p)
        db.commit()
        return {"processed": len(pending), "sent": sent_count}
    finally:
        db.close()

def process_comment_event(event):
    try:
        entry = (event or {}).get("entry", [])
        if not entry:
            return
        entry = entry[0]
        if "changes" not in entry:
            return
        change = entry["changes"][0]
        if change.get("field") != "comments":
            return
            
        comment_value = change["value"]
        comment_id = comment_value.get("id")
        user_id_from = comment_value.get("from", {}).get("id")
        text = comment_value.get("text") or ""
        post_identifier = (
            (comment_value.get("media") or {}).get("id")
            or comment_value.get("media_id")
            or comment_value.get("post_id")
            or comment_value.get("parent_id")
        )

        target_ig_account_id = entry.get("id")
        
        db: Session = SessionLocal()
        try:
            integration = db.query(UserIntegration).filter(
                UserIntegration.platform == 'instagram',
                UserIntegration.status == 'configured',
                UserIntegration.access_token != None,
                (UserIntegration.ig_account_id == target_ig_account_id) | (UserIntegration.ig_account_id == None)
            ).order_by(
                UserIntegration.ig_account_id.desc(),
                UserIntegration.updated_at.desc()
            ).first()

            if not integration:
                return
                
            integ_access_token = integration.access_token
            integ_user_id = integration.user_id
            
            # Fetch Bot IG Account ID to prevent self-reply
            me_url = f"https://graph.instagram.com/v24.0/me?access_token={integ_access_token}"
            me_data = requests.get(me_url).json()
            instagram_account_id = me_data.get("id")
            
            if instagram_account_id and user_id_from == instagram_account_id:
                return

            if comment_value.get("from", {}).get("self_ig_scoped_id"):
                return
                
            # Get rules
            rules = db.query(IgKeyword).filter(
                IgKeyword.user_id == integ_user_id,
                (IgKeyword.ig_account_id == target_ig_account_id) | (IgKeyword.ig_account_id == None),
                IgKeyword.active == True
            ).all()
            
            matched_rules = []
            text_lower = text.lower()
            
            for r in rules:
                try:
                    kws = json.loads(r.keywords) if r.keywords else [r.keyword]
                except:
                    kws = [r.keyword]
                
                effective = any(kw in text_lower for kw in kws)
                scope_ok = r.post_id is None or r.post_id == post_identifier
                if effective and scope_ok:
                    matched_rules.append((r, kws))
                    
            if not matched_rules:
                return
                
            any_comment = False
            any_dm = False
            
            for rule, kws in matched_rules:
                if rule.action in ("reply", "both") and rule.reply_message:
                    reply_url = f"https://graph.instagram.com/v24.0/{comment_id}/replies"
                    reply_payload = {"message": rule.reply_message, "access_token": integ_access_token}
                    if send_api_request(reply_url, reply_payload):
                        any_comment = True

                if rule.action in ("dm", "both") and rule.dm_message:
                    dm_url = "https://graph.instagram.com/v24.0/me/messages"
                    headers = {"Authorization": f"Bearer {integ_access_token}", "Content-Type": "application/json"}
                    
                    if rule.dm_has_buttons and (rule.dm_button1_text or rule.dm_button2_text):
                        buttons = []
                        if rule.dm_button1_text and rule.dm_button1_url:
                            buttons.append({"type": "web_url", "title": rule.dm_button1_text[:20], "url": rule.dm_button1_url})
                        if rule.dm_button2_text and rule.dm_button2_url:
                            buttons.append({"type": "web_url", "title": rule.dm_button2_text[:20], "url": rule.dm_button2_url})
                        dm_payload = {
                            "recipient": {"id": user_id_from},
                            "message": {
                                "attachment": {
                                    "type": "template",
                                    "payload": {
                                        "template_type": "generic",
                                        "elements": [{"title": rule.dm_message[:80], "buttons": buttons}],
                                    },
                                }
                            },
                        }
                    else:
                        dm_payload = {"recipient": {"id": user_id_from}, "message": {"text": rule.dm_message}}
                        
                    ok_dm = send_api_request(dm_url, dm_payload, headers)
                    if ok_dm:
                        any_dm = True
                    else:
                        # Save pending
                        pending = IgPendingDm(
                            integration_user_id=integ_user_id,
                            recipient_instagram_id=user_id_from,
                            message_text=rule.dm_message,
                            has_buttons=rule.dm_has_buttons,
                            button1_text=rule.dm_button1_text,
                            button1_url=rule.dm_button1_url,
                            button2_text=rule.dm_button2_text,
                            button2_url=rule.dm_button2_url
                        )
                        db.add(pending)
                        db.commit()
            logging.info(f"Processado comentário. Reply={any_comment}, DM={any_dm}")
        finally:
            db.close()
    except Exception as e:
        logging.error(f"Erro ao processar evento de comentário: {e}", exc_info=True)

def process_dm_event(event):
    try:
        entry = (event or {}).get("entry", [])
        if not entry:
            return
        entry = entry[0]
        if "messaging" not in entry:
            return
        messaging_event = entry["messaging"][0]
        if messaging_event.get("message", {}).get("is_echo"):
            return
            
        sender_id = messaging_event.get("sender", {}).get("id")
        txt = messaging_event.get("message", {}).get("text", "")
        target_ig_account_id = entry.get("id")
        
        db: Session = SessionLocal()
        try:
            integration = db.query(UserIntegration).filter(
                UserIntegration.platform == 'instagram',
                UserIntegration.status == 'configured',
                UserIntegration.access_token != None,
                (UserIntegration.ig_account_id == target_ig_account_id) | (UserIntegration.ig_account_id == None)
            ).order_by(
                UserIntegration.ig_account_id.desc(),
                UserIntegration.updated_at.desc()
            ).first()

            if not integration:
                return
                
            flush_pending_dms(sender_id, integration.user_id, integration.access_token)
            
            if integration.allow_ai_direct and txt:
                rules = db.query(IgKeyword).filter(
                    IgKeyword.user_id == integration.user_id,
                    (IgKeyword.ig_account_id == target_ig_account_id) | (IgKeyword.ig_account_id == None),
                    IgKeyword.active == True
                ).all()
                
                matched_now = []
                text_lower = txt.lower()
                for r in rules:
                    try:
                        kws = json.loads(r.keywords) if r.keywords else [r.keyword]
                    except:
                        kws = [r.keyword]
                    for kw in kws:
                        if kw in text_lower:
                            matched_now.append(kw)
                            
                ai_text = generate_ai_reply(
                    user_message=txt,
                    matched_keywords=list(set(matched_now)),
                    business_context=integration.ai_business_context
                )
                
                if ai_text:
                    dm_url = "https://graph.instagram.com/v24.0/me/messages"
                    headers = {"Authorization": f"Bearer {integration.access_token}", "Content-Type": "application/json"}
                    payload = {"recipient": {"id": sender_id}, "message": {"text": ai_text}}
                    send_api_request(dm_url, payload, headers)
                    
        finally:
            db.close()
    except Exception as e:
        logging.error(f"Erro DM: {e}", exc_info=True)

def main():
    logging.info("Worker iniciado, aguardando eventos...")
    while True:
        try:
            comment_result = redis_client.blpop(IG_COMMENTS_QUEUE, timeout=1)
            if comment_result:
                _, raw_comment = comment_result
                process_comment_event(json.loads(raw_comment))
                
            dm_result = redis_client.blpop(IG_DMS_QUEUE, timeout=1)
            if dm_result:
                _, raw_dm = dm_result
                process_dm_event(json.loads(raw_dm))
                
            messenger_result = redis_client.blpop(MESSENGER_DMS_QUEUE, timeout=1)
            if messenger_result:
                _, raw_dm = messenger_result
                logging.info(f"Messenger event ignorado (sem IA nativa): {raw_dm}")
                
        except Exception as e:
            logging.error(f"Erro no worker loop: {e}")
        time.sleep(1)

if __name__ == "__main__":
    main()

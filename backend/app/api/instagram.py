from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import json
from app.core.database import get_db
from app.models.user_integration import UserIntegration
from app.models.ig_keyword import IgKeyword
import requests

router = APIRouter(tags=["Instagram"])

class SetupInput(BaseModel):
    user_id: int
    verify_token: str
    access_token: str
    modes: str = "both"

class AIToggleInput(BaseModel):
    user_id: int
    allow_ai_direct: bool
    ai_business_context: Optional[str] = ""

class KeywordInput(BaseModel):
    user_id: int
    rule_id: Optional[int] = None
    overwrite_conflicts: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    keyword: Optional[str] = None
    action: str
    reply_message: Optional[str] = None
    dm_message: Optional[str] = None
    active: bool = True
    dm_has_buttons: bool = False
    dm_button1_text: Optional[str] = None
    dm_button1_url: Optional[str] = None
    dm_button2_text: Optional[str] = None
    dm_button2_url: Optional[str] = None
    post_id: Optional[str] = None

@router.post("/setup")
def instagram_setup(data: SetupInput, db: Session = Depends(get_db)):
    integration = db.query(UserIntegration).filter(
        UserIntegration.user_id == data.user_id,
        UserIntegration.platform == 'instagram'
    ).first()
    
    if integration:
        integration.verify_token = data.verify_token
        integration.access_token = data.access_token
        integration.modes = data.modes
        integration.status = 'configured'
    else:
        integration = UserIntegration(
            user_id=data.user_id,
            platform='instagram',
            verify_token=data.verify_token,
            access_token=data.access_token,
            modes=data.modes,
            status='configured'
        )
        db.add(integration)
        
    db.commit()
    return {"status": "ok"}

@router.get("/status")
def instagram_status(user_id: int = Query(...), db: Session = Depends(get_db)):
    integration = db.query(UserIntegration).filter(
        UserIntegration.user_id == user_id,
        UserIntegration.platform == 'instagram'
    ).first()
    
    if not integration:
        return {"configured": False}
        
    return {
        "configured": integration.status == "configured",
        "modes": integration.modes,
        "configured_at": integration.configured_at,
        "allow_ai_direct": integration.allow_ai_direct,
        "ai_business_context": integration.ai_business_context or "",
    }

@router.post("/ai")
def instagram_ai_toggle(data: AIToggleInput, db: Session = Depends(get_db)):
    integration = db.query(UserIntegration).filter(
        UserIntegration.user_id == data.user_id,
        UserIntegration.platform == 'instagram'
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integração não encontrada")
        
    integration.allow_ai_direct = data.allow_ai_direct
    integration.ai_business_context = data.ai_business_context
    db.commit()
    
    return {
        "status": "ok",
        "allow_ai_direct": integration.allow_ai_direct,
        "ai_business_context": integration.ai_business_context or ""
    }

@router.get("/keywords")
def list_keywords(user_id: int = Query(...), post_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(IgKeyword).filter(IgKeyword.user_id == user_id)
    if post_id:
        query = query.filter((IgKeyword.post_id == post_id) | (IgKeyword.post_id == None))
    
    rules = query.order_by(IgKeyword.id.desc()).all()
    items = []
    
    for r in rules:
        try:
            kws_arr = json.loads(r.keywords) if r.keywords else []
        except:
            kws_arr = [r.keyword] if r.keyword else []
            
        items.append({
            "id": r.id,
            "keyword": kws_arr[0] if kws_arr else r.keyword,
            "keywords": kws_arr,
            "action": r.action,
            "reply_message": r.reply_message,
            "dm_message": r.dm_message,
            "active": r.active,
            "dm_has_buttons": r.dm_has_buttons,
            "dm_button1_text": r.dm_button1_text,
            "dm_button1_url": r.dm_button1_url,
            "dm_button2_text": r.dm_button2_text,
            "dm_button2_url": r.dm_button2_url,
            "post_id": r.post_id,
        })
    return {"items": items}

@router.post("/keywords")
def upsert_keyword(data: KeywordInput, db: Session = Depends(get_db)):
    if data.action not in ("reply", "dm", "both"):
        raise HTTPException(status_code=400, detail="Action inválida")
        
    kws = []
    if data.keywords:
        kws = list(set([k.strip().lower() for k in data.keywords if k.strip()]))
    elif data.keyword:
        kws = [data.keyword.strip().lower()]
        
    if not kws:
        raise HTTPException(status_code=400, detail="Palavra-chave é obrigatória")
        
    base_keyword = kws[0]
    persist_value = json.dumps(kws, ensure_ascii=False)
    
    # Simple overwrite conflict resolution for brevity: delete exactly identical keywords in same scope.
    if data.overwrite_conflicts:
        scope_filter = IgKeyword.post_id == data.post_id if data.post_id else IgKeyword.post_id == None
        conflicts = db.query(IgKeyword).filter(IgKeyword.user_id == data.user_id, scope_filter).all()
        for c in conflicts:
            try:
                existing_kws = json.loads(c.keywords) if c.keywords else [c.keyword]
            except:
                existing_kws = [c.keyword]
                
            new_kws = [k for k in existing_kws if k not in data.overwrite_conflicts]
            if not new_kws:
                db.delete(c)
            else:
                c.keyword = new_kws[0]
                c.keywords = json.dumps(new_kws, ensure_ascii=False)
                db.add(c)
        db.commit()
    
    if data.rule_id:
        rule = db.query(IgKeyword).filter(IgKeyword.id == data.rule_id, IgKeyword.user_id == data.user_id).first()
        if not rule:
            raise HTTPException(status_code=404, detail="Regra não encontrada")
    else:
        rule = IgKeyword(user_id=data.user_id)
        db.add(rule)
        
    rule.keyword = base_keyword
    rule.keywords = persist_value
    rule.action = data.action
    rule.reply_message = data.reply_message
    rule.dm_message = data.dm_message
    rule.active = data.active
    rule.dm_has_buttons = data.dm_has_buttons
    rule.dm_button1_text = data.dm_button1_text
    rule.dm_button1_url = data.dm_button1_url
    rule.dm_button2_text = data.dm_button2_text
    rule.dm_button2_url = data.dm_button2_url
    rule.post_id = data.post_id
    
    db.commit()
    db.refresh(rule)
    return {"id": rule.id, "status": "ok"}

@router.delete("/keywords/{item_id}")
def delete_keyword(item_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    rule = db.query(IgKeyword).filter(IgKeyword.id == item_id, IgKeyword.user_id == user_id).first()
    if rule:
        db.delete(rule)
        db.commit()
    return {"status": "ok"}

@router.get("/posts")
def instagram_posts(user_id: int = Query(...), db: Session = Depends(get_db)):
    integration = db.query(UserIntegration).filter(
        UserIntegration.user_id == user_id,
        UserIntegration.platform == 'instagram',
        UserIntegration.status == 'configured',
        UserIntegration.access_token != None
    ).first()
    
    if not integration:
        return {"items": [], "message": "Nenhuma integração encontrada"}
        
    fields = "id,caption,media_type,permalink"
    url = f"https://graph.instagram.com/v24.0/me/media"
    params = {"fields": fields, "access_token": integration.access_token, "limit": 100}
    
    all_medias = []
    while url:
        r = requests.get(url, params=params)
        if r.status_code != 200:
            break
        data = r.json()
        all_medias.extend(data.get("data", []))
        url = data.get("paging", {}).get("next")
        params = None
        
    items = [
        {
            "id": m.get("id"),
            "caption": (m.get("caption") or "")[:80],
            "media_type": m.get("media_type"),
            "permalink": m.get("permalink"),
        }
        for m in all_medias
    ]
    return {"items": items}

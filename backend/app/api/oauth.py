import os
import logging
import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user_integration import UserIntegration

router = APIRouter(tags=["OAuth Meta"])

class OAuthCallbackInput(BaseModel):
    code: str
    user_id: int
    redirect_uri: str

@router.get("/config")
def get_oauth_config():
    """Retorna configurações públicas do OAuth para o frontend montar a URL"""
    return {"client_id": os.environ.get("META_CLIENT_ID")}

@router.post("/callback")
def instagram_oauth_callback(data: OAuthCallbackInput, db: Session = Depends(get_db)):
    client_id = os.environ.get("META_CLIENT_ID")
    client_secret = os.environ.get("META_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="Credenciais OAuth do Meta não configuradas no servidor (.env)")

    try:
        # 1. Trocar código por Short-Lived User Token
        t_url = f"https://graph.facebook.com/v24.0/oauth/access_token?client_id={client_id}&redirect_uri={data.redirect_uri}&client_secret={client_secret}&code={data.code}"
        t_res = requests.get(t_url).json()
        if "error" in t_res:
            logging.error(f"Erro ao obter short-lived token: {t_res}")
            raise HTTPException(status_code=400, detail="Falha na troca de código OAuth")
            
        short_lived_token = t_res.get("access_token")
        
        # 2. Trocar Short-Lived por Long-Lived Token
        ll_url = f"https://graph.facebook.com/v24.0/oauth/access_token?grant_type=fb_exchange_token&client_id={client_id}&client_secret={client_secret}&fb_exchange_token={short_lived_token}"
        ll_res = requests.get(ll_url).json()
        long_lived_token = ll_res.get("access_token", short_lived_token)
        
        # 3. Buscar Páginas do Usuário
        pages_url = f"https://graph.facebook.com/v24.0/me/accounts?access_token={long_lived_token}"
        pages_res = requests.get(pages_url).json()
        pages = pages_res.get("data", [])
        
        if not pages:
            raise HTTPException(status_code=400, detail="Nenhuma página do Facebook encontrada para este usuário.")
            
        success_pages = []
        
        # 4. Encontrar conta de Instagram e subscrever
        for page in pages:
            page_id = page.get("id")
            page_access_token = page.get("access_token")
            
            ig_url = f"https://graph.facebook.com/v24.0/{page_id}?fields=instagram_business_account&access_token={page_access_token}"
            ig_res = requests.get(ig_url).json()
            
            ig_account_id = ig_res.get("instagram_business_account", {}).get("id")
            if not ig_account_id:
                continue
                
            sub_url = f"https://graph.facebook.com/v24.0/{page_id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,comments,live_comments&access_token={page_access_token}"
            sub_res = requests.post(sub_url).json()
            if not sub_res.get("success"):
                logging.warning(f"Atenção: Falha ao subscrever app no webhook da página {page_id}. Erro: {sub_res}")
            
            # 5. Salvar na Base de Dados
            integration = db.query(UserIntegration).filter(
                UserIntegration.user_id == data.user_id,
                UserIntegration.platform == 'instagram'
            ).first()
            
            if integration:
                integration.access_token = page_access_token
                integration.page_id = page_id
                integration.fb_page_id = page_id
                integration.ig_account_id = ig_account_id
                integration.modes = 'both'
                integration.status = 'configured'
            else:
                integration = UserIntegration(
                    user_id=data.user_id,
                    platform='instagram',
                    verify_token='OAUTH_AUTO',
                    access_token=page_access_token,
                    page_id=page_id,
                    fb_page_id=page_id,
                    ig_account_id=ig_account_id,
                    modes='both',
                    status='configured'
                )
                db.add(integration)
                
            db.commit()
            success_pages.append(ig_account_id)
            break
            
        if not success_pages:
            raise HTTPException(status_code=400, detail="Nenhuma conta do Instagram Profissional vinculada foi encontrada.")
            
        return {"status": "ok", "message": "Instagram conectado via OAuth com sucesso!"}

    except HTTPException:
        raise
    except Exception as e:
        logging.exception(f"Erro crítico no OAuth Callback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user_integration import UserIntegration

router = APIRouter(tags=["Messenger"])

class MessengerSetupInput(BaseModel):
    user_id: int
    page_id: str
    verify_token: str
    access_token: str

@router.post("/setup")
def messenger_setup(data: MessengerSetupInput, db: Session = Depends(get_db)):
    integration = db.query(UserIntegration).filter(
        UserIntegration.user_id == data.user_id,
        UserIntegration.platform == 'messenger'
    ).first()
    
    if integration:
        integration.page_id = data.page_id
        integration.verify_token = data.verify_token
        integration.access_token = data.access_token
        integration.status = 'configured'
    else:
        integration = UserIntegration(
            user_id=data.user_id,
            platform='messenger',
            page_id=data.page_id,
            verify_token=data.verify_token,
            access_token=data.access_token,
            status='configured'
        )
        db.add(integration)
        
    db.commit()
    return {"status": "ok"}

@router.get("/status")
def messenger_status(user_id: int = Query(...), db: Session = Depends(get_db)):
    integration = db.query(UserIntegration).filter(
        UserIntegration.user_id == user_id,
        UserIntegration.platform == 'messenger'
    ).first()
    
    if not integration:
        return {"configured": False}
        
    return {
        "configured": integration.status == "configured",
        "configured_at": integration.configured_at,
        "page_id": integration.page_id,
    }

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.user import User
from app.models.allowed_email import AllowedEmail
from app.models.user_integration import UserIntegration
from app.models.ig_keyword import IgKeyword
from app.api.auth import get_current_user
from app.schemas.admin import AllowedEmailCreate, AllowedEmailOut, SystemStats

router = APIRouter(tags=["Admin"])

def require_superadmin(current_user: User = Depends(get_current_user)):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não autorizado"
        )
    return current_user

@router.get("/stats", response_model=SystemStats)
def get_system_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin)
):
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    total_users = db.query(User).count()
    new_users_7d = db.query(User).filter(User.created_at >= seven_days_ago).count()
    
    total_allowed_emails = db.query(AllowedEmail).count()
    
    # Pendentes são os allowed_emails que não estão na tabela users
    registered_emails = db.query(User.email).subquery()
    pending_allowed_emails = db.query(AllowedEmail).filter(AllowedEmail.email.notin_(registered_emails)).count()
    
    active_integrations = db.query(UserIntegration).filter(UserIntegration.status == "active").count()
    
    total_automation_rules = db.query(IgKeyword).count()
    active_automation_rules = db.query(IgKeyword).filter(IgKeyword.active == True).count()
    
    return {
        "total_users": total_users,
        "new_users_7d": new_users_7d,
        "total_allowed_emails": total_allowed_emails,
        "pending_allowed_emails": pending_allowed_emails,
        "active_integrations": active_integrations,
        "total_automation_rules": total_automation_rules,
        "active_automation_rules": active_automation_rules
    }

@router.get("/allowed-emails", response_model=List[AllowedEmailOut])
def list_allowed_emails(
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin)
):
    emails = db.query(AllowedEmail).order_by(AllowedEmail.created_at.desc()).all()
    result = []
    
    registered_emails = {u.email for u in db.query(User.email).all()}
    
    for em in emails:
        result.append(
            AllowedEmailOut(
                id=em.id,
                email=em.email,
                added_by=em.added_by,
                created_at=em.created_at,
                is_registered=(em.email in registered_emails)
            )
        )
    return result

@router.post("/allowed-emails", response_model=AllowedEmailOut)
def add_allowed_email(
    email_in: AllowedEmailCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin)
):
    email_clean = email_in.email.lower().strip()
    existing = db.query(AllowedEmail).filter(AllowedEmail.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já está na lista de permissões")
    
    new_allowed = AllowedEmail(
        email=email_clean,
        added_by=admin.id
    )
    db.add(new_allowed)
    db.commit()
    db.refresh(new_allowed)
    
    # Verifica se já está registrado (neste caso, a pessoa acabou de ser adicionada, mas poderia já estar no sistema se burlando)
    is_registered = db.query(User).filter(User.email == email_clean).first() is not None
    
    return AllowedEmailOut(
        id=new_allowed.id,
        email=new_allowed.email,
        added_by=new_allowed.added_by,
        created_at=new_allowed.created_at,
        is_registered=is_registered
    )

@router.delete("/allowed-emails/{email_id}")
def remove_allowed_email(
    email_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin)
):
    allowed = db.query(AllowedEmail).filter(AllowedEmail.id == email_id).first()
    if not allowed:
        raise HTTPException(status_code=404, detail="E-mail não encontrado na lista")
    
    db.delete(allowed)
    db.commit()
    return {"message": "E-mail removido da lista de permissões"}

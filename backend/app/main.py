from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.whatsapp import router as whatsapp_router

app = FastAPI(title="JC Hub API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.core.database import Base, engine
from app.api.agenda import router as agenda_router
from app.models.user import User
from app.models.user_integration import UserIntegration
from app.models.ig_keyword import IgKeyword
from app.models.ig_pending_dm import IgPendingDm
from app.models.allowed_email import AllowedEmail
from app.models.content_history import ContentHistory
from app.models.creator_plan import CreatorPlan

# Cria as tabelas no banco caso não existam
Base.metadata.create_all(bind=engine)

app.include_router(whatsapp_router, prefix="/api/v1")
app.include_router(agenda_router, prefix="/api/v1")

from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import get_password_hash

app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(admin_router, prefix="/api/v1/admin")

@app.on_event("startup")
def init_superadmin():
    db = SessionLocal()
    try:
        superadmin_email = settings.SUPERADMIN_EMAIL.lower().strip()
        
        # Ensure superadmin is in allowed emails
        allowed = db.query(AllowedEmail).filter(AllowedEmail.email == superadmin_email).first()
        if not allowed:
            db.add(AllowedEmail(email=superadmin_email))
            db.commit()

        # Check if user exists to promote
        user = db.query(User).filter(User.email == superadmin_email).first()
        if user:
            if user.role != "superadmin":
                user.role = "superadmin"
                db.commit()
        else:
            # Optionally create the superadmin if they don't exist
            # For now we'll just allow them to register since they are in allowed emails
            pass
    finally:
        db.close()


from app.api.oauth import router as oauth_router
from app.api.instagram import router as instagram_router
from app.api.messenger import router as messenger_router
from app.api.webhooks import router as webhooks_router

app.include_router(oauth_router, prefix="/api/v1/oauth")
app.include_router(instagram_router, prefix="/api/v1/instagram")
app.include_router(messenger_router, prefix="/api/v1/messenger")
app.include_router(webhooks_router, prefix="/api/v1")

from app.api.v1.endpoints.creator import router as creator_router
app.include_router(creator_router, prefix="/api/v1/creator")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "JC Business API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

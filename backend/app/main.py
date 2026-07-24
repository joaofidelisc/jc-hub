from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.whatsapp import router as whatsapp_router

app = FastAPI(title="JC Business API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.core.database import Base, engine
from app.api.agenda import router as agenda_router

# Cria as tabelas no banco caso não existam
Base.metadata.create_all(bind=engine)

app.include_router(whatsapp_router, prefix="/api/v1")
app.include_router(agenda_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "JC Business API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

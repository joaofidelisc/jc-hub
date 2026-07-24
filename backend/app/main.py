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

app.include_router(whatsapp_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "JC Business API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

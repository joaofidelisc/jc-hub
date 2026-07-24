from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, index=True)
    client_phone = Column(String, index=True, nullable=True)
    service = Column(String)
    scheduled_at = Column(DateTime, index=True)
    status = Column(String, default="Pendente") # Pendente, Confirmado, Cancelado
    agent_origin = Column(String, default="Humano") # IA, Humano
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

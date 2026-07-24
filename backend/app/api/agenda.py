from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import logging

from app.core.database import get_db
from app.models.appointment import Appointment
from app.schemas.appointment import AppointmentCreate, AppointmentOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agenda", tags=["Agenda"])

@router.get("/", response_model=List[AppointmentOut])
def get_appointments(db: Session = Depends(get_db)):
    """
    Retorna todos os agendamentos.
    No futuro, podemos adicionar paginação e filtros diretamente na query SQL.
    """
    appointments = db.query(Appointment).order_by(Appointment.scheduled_at.asc()).all()
    return appointments

@router.post("/", response_model=AppointmentOut)
def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    """
    Cria um novo agendamento manualmente (usado pelo Dashboard).
    """
    db_appointment = Appointment(**appointment.model_dump())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@router.post("/ai-book", response_model=AppointmentOut)
def create_appointment_from_ai(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    """
    Endpoint especializado para ser chamado pela IA (OpenClaw / Function Calling).
    Força a origem como 'IA'.
    """
    db_appointment = Appointment(**appointment.model_dump())
    db_appointment.agent_origin = "IA"
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

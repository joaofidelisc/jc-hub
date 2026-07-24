from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class AppointmentBase(BaseModel):
    client_name: str
    client_phone: Optional[str] = None
    service: str
    scheduled_at: datetime
    status: str = "Pendente"
    agent_origin: str = "Humano"

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    service: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None

class AppointmentOut(AppointmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, EmailStr
from datetime import datetime

class AllowedEmailBase(BaseModel):
    email: EmailStr

class AllowedEmailCreate(AllowedEmailBase):
    pass

class AllowedEmailOut(AllowedEmailBase):
    id: int
    added_by: int | None
    created_at: datetime
    is_registered: bool = False

    class Config:
        from_attributes = True

class SystemStats(BaseModel):
    total_users: int
    new_users_7d: int
    total_allowed_emails: int
    pending_allowed_emails: int
    active_integrations: int
    total_automation_rules: int
    active_automation_rules: int

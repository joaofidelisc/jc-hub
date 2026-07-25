from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.core.database import Base

class IgPendingDm(Base):
    __tablename__ = "ig_pending_dm"

    id = Column(Integer, primary_key=True, index=True)
    integration_user_id = Column(Integer, nullable=False)
    recipient_instagram_id = Column(String, nullable=False)
    message_text = Column(Text, nullable=True)
    has_buttons = Column(Boolean, default=False, nullable=False)
    button1_text = Column(String, nullable=True)
    button1_url = Column(String, nullable=True)
    button2_text = Column(String, nullable=True)
    button2_url = Column(String, nullable=True)
    
    sent = Column(Boolean, default=False, nullable=False)
    last_attempt_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

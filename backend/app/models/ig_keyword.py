from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base

class IgKeyword(Base):
    __tablename__ = "ig_keywords"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ig_account_id = Column(String, nullable=True)
    keyword = Column(String, nullable=False) # legacy
    keywords = Column(Text, nullable=True) # JSON stored as string for compatibility, or JSONB if needed
    action = Column(String, nullable=False) # 'reply','dm','both'
    reply_message = Column(Text, nullable=True)
    dm_message = Column(Text, nullable=True)
    dm_has_buttons = Column(Boolean, default=False, nullable=False)
    dm_button1_text = Column(String, nullable=True)
    dm_button1_url = Column(String, nullable=True)
    dm_button2_text = Column(String, nullable=True)
    dm_button2_url = Column(String, nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    post_id = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

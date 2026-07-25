from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class UserIntegration(Base):
    __tablename__ = "user_integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String, nullable=False) # 'instagram', 'messenger'
    page_id = Column(String, nullable=True) # ID da página do Facebook
    fb_page_id = Column(String, nullable=True)
    ig_account_id = Column(String, nullable=True)
    verify_token = Column(String, nullable=False)
    access_token = Column(String, nullable=True)
    modes = Column(String, default="both", nullable=False)
    status = Column(String, default="configured", nullable=False)
    allow_ai_direct = Column(Boolean, default=False, nullable=False)
    ai_business_context = Column(String, nullable=True)
    
    configured_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

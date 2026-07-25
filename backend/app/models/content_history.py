from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class ContentHistory(Base):
    __tablename__ = "content_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    theme = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

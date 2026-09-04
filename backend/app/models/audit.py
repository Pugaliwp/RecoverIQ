from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    opportunity_id = Column(String, ForeignKey("recovery_opportunities.opportunity_id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String)
    reason = Column(String)
    recommendation = Column(String)
    action = Column(String)
    policy_applied = Column(String)
    result = Column(String) # SUCCESS, FAILED, PENDING
    amount_recovered = Column(Float, default=0.0)

    opportunity = relationship("RecoveryOpportunity", back_populates="audit_logs")

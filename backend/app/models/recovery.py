from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class RecoveryOpportunity(Base):
    __tablename__ = "recovery_opportunities"

    id = Column(Integer, primary_key=True, index=True)
    opportunity_id = Column(String, unique=True, index=True)
    transaction_id = Column(String, ForeignKey("transactions.transaction_id"))
    amount_at_risk = Column(Float)
    recovery_probability = Column(Float)
    root_cause = Column(String)
    recommended_action = Column(String)
    status = Column(String) # ELIGIBLE, PENDING, IN_PROGRESS, FAILED, RECOVERED
    expected_recovery = Column(Float, default=0.0)
    amount_recovered = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transaction = relationship("Transaction", back_populates="opportunity")
    actions = relationship("RecoveryAction", back_populates="opportunity")
    audit_logs = relationship("AuditLog", back_populates="opportunity")

class RecoveryAction(Base):
    __tablename__ = "recovery_actions"

    id = Column(Integer, primary_key=True, index=True)
    opportunity_id = Column(String, ForeignKey("recovery_opportunities.opportunity_id"))
    action_type = Column(String)
    action_status = Column(String)
    executed_at = Column(DateTime, default=datetime.utcnow)
    result = Column(String)
    amount_recovered = Column(Float, default=0.0)

    opportunity = relationship("RecoveryOpportunity", back_populates="actions")

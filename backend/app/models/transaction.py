from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True)
    customer_id = Column(String, ForeignKey("customers.customer_id"))
    amount = Column(Float)
    currency = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    payment_status = Column(String) # SUCCESS, FAILED, ABANDONED, SUBSCRIPTION_FAILED, OVERDUE
    failure_reason = Column(String, nullable=True)
    payment_method = Column(String)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="transactions")
    opportunity = relationship("RecoveryOpportunity", back_populates="transaction", uselist=False)

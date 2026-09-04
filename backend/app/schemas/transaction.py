from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TransactionBase(BaseModel):
    transaction_id: str
    customer_id: str
    amount: float
    currency: str
    timestamp: datetime
    payment_status: str
    failure_reason: Optional[str] = None
    payment_method: str
    retry_count: int = 0

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

from pydantic import BaseModel
from datetime import datetime

class AuditLogBase(BaseModel):
    opportunity_id: str
    event_type: str
    reason: str
    recommendation: str
    action: str
    policy_applied: str
    result: str
    amount_recovered: float = 0.0

class AuditLogCreate(AuditLogBase):
    pass

class AuditLogResponse(AuditLogBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RecoveryActionBase(BaseModel):
    action_type: str
    action_status: str
    result: Optional[str] = None
    amount_recovered: float = 0.0

class RecoveryActionResponse(RecoveryActionBase):
    id: int
    opportunity_id: str
    executed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RecoveryOpportunityBase(BaseModel):
    opportunity_id: str
    transaction_id: str
    amount_at_risk: float
    recovery_probability: float
    root_cause: str
    recommended_action: str
    status: str
    expected_recovery: float = 0.0
    amount_recovered: float = 0.0

class RecoveryOpportunityCreate(RecoveryOpportunityBase):
    pass

class RecoveryOpportunityResponse(RecoveryOpportunityBase):
    id: int
    created_at: datetime
    updated_at: datetime
    actions: List[RecoveryActionResponse] = []

    class Config:
        from_attributes = True

class RecoveryActionRequest(BaseModel):
    pass

class OutcomeRequest(BaseModel):
    outcome: str

class BatchSimulationRequest(BaseModel):
    max_opportunities: int = 3
    min_probability: float = 0.50
    dry_run: bool = False
    scenario: str = "mixed" # "all_success", "all_failure", "mixed"

class BatchOpportunityResult(BaseModel):
    rank: int
    opportunity_id: str
    transaction_id: Optional[str] = None
    amount_at_risk: float
    recovery_probability: float
    expected_recovery: float
    risk_band: str
    recommended_action: str
    priority_score: float
    policy_allowed: bool
    policy_reason: str
    action_status: str # "PREVIEW", "BLOCKED", "COMPLETED"
    outcome: Optional[str] = None # "RECOVERED", "NOT_RECOVERED", None
    amount_recovered: float = 0.0
    action_id: Optional[int] = None

class BatchSimulationResponse(BaseModel):
    synthetic: bool = True
    batch_id: str
    requested_limit: int
    min_probability: float
    scenario: str
    dry_run: bool
    processed_count: int
    policy_blocked_count: int
    successful_count: int
    failed_count: int
    amount_at_risk: float
    amount_recovered: float
    recovery_rate: float
    expected_recovery_before_batch: float
    stopping_reason: str
    results: List[BatchOpportunityResult]

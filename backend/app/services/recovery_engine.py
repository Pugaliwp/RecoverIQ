from typing import Dict, Any
from datetime import datetime
import uuid
import random
from sqlalchemy.orm import Session
from ..models.transaction import Transaction
from ..models.recovery import RecoveryOpportunity, RecoveryAction
from ..models.audit import AuditLog

def generate_id(prefix=""):
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"

class RecoveryEngine:
    """
    Rule-based recovery engine for evaluating and executing recovery actions.
    """
    MAX_RETRIES = 2
    MAX_ATTEMPTS_PER_CUSTOMER = 3

    def execute_recovery(self, opportunity_id: str, db: Session) -> Dict[str, Any]:
        """
        Execute the recommended action for an opportunity and log the audit trail.
        """
        opp = db.query(RecoveryOpportunity).filter(RecoveryOpportunity.opportunity_id == opportunity_id).first()
        if not opp:
            raise ValueError("Opportunity not found")

        if opp.status in ["RECOVERED", "FAILED"]:
            raise ValueError(f"Cannot execute. Current status: {opp.status}")

        action = opp.recommended_action
        result = "PENDING"
        amount_recovered = 0.0
        policy_applied = ""

        if action == "RETRY":
            policy_applied = f"Max retries: {self.MAX_RETRIES}"
            if random.random() > 0.5:
                result = "SUCCESS"
                amount_recovered = opp.amount_at_risk
                opp.status = "RECOVERED"
                opp.amount_recovered = amount_recovered
            else:
                result = "FAILED"
                opp.status = "ELIGIBLE"
        elif action == "REMINDER":
            policy_applied = "Cooldown: 15 mins"
            result = "PENDING"
            opp.status = "PENDING"
        else:
            policy_applied = "Default policy"
            result = "FAILED"

        # Create action record
        recovery_action = RecoveryAction(
            opportunity_id=opp.opportunity_id,
            action_type=action,
            action_status=result,
            result=result,
            amount_recovered=amount_recovered
        )
        db.add(recovery_action)

        # Create audit record
        audit = AuditLog(
            opportunity_id=opp.opportunity_id,
            event_type="RECOVERY_EXECUTION",
            reason=opp.root_cause,
            recommendation=opp.recommended_action,
            action=f"Executed {action}",
            policy_applied=policy_applied,
            result=result,
            amount_recovered=amount_recovered
        )
        db.add(audit)
        
        db.commit()
        db.refresh(opp)
        db.refresh(audit)

        return {
            "opportunity": {
                "id": opp.opportunity_id,
                "status": opp.status,
                "amount_recovered": opp.amount_recovered
            },
            "audit": {
                "id": audit.id,
                "action": audit.action,
                "result": audit.result
            }
        }

recovery_engine = RecoveryEngine()

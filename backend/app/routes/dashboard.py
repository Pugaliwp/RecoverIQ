from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.transaction import Transaction
from ..models.recovery import RecoveryOpportunity
from ..models.audit import AuditLog

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_processed = db.query(func.sum(Transaction.amount)).scalar() or 0
    
    revenue_at_risk = db.query(func.sum(RecoveryOpportunity.amount_at_risk)).filter(
        RecoveryOpportunity.status.notin_(["RECOVERED", "FAILED"])
    ).scalar() or 0
    
    revenue_recovered = db.query(func.sum(AuditLog.amount_recovered)).scalar() or 0
    
    failed_payments = db.query(Transaction).filter(
        Transaction.payment_status == "FAILED"
    ).count()
    
    checkout_abandonments = db.query(Transaction).filter(
        Transaction.payment_status == "ABANDONED"
    ).count()
    
    active_recovery_workflows = db.query(RecoveryOpportunity).filter(
        RecoveryOpportunity.status.in_(["ELIGIBLE", "PENDING", "IN_PROGRESS"])
    ).count()
    
    from .analytics import get_portfolio_analytics
    
    try:
        portfolio_data = get_portfolio_analytics(db)
        expected_recovery = portfolio_data.get("expected_recovery", 0.0)
    except Exception:
        expected_recovery = 0.0

    from ..models.recovery import RecoveryAction
    
    # Dynamic Funnel Stage Calculations from Database Records
    total_opportunity_amount = db.query(func.sum(RecoveryOpportunity.amount_at_risk)).scalar() or 0.0
    
    all_opps = db.query(RecoveryOpportunity).all()
    eligible_opps = [o for o in all_opps if o.recommended_action and o.recommended_action != "NO_ACTION"]
    total_eligible_amount = sum(float(o.amount_at_risk or 0.0) for o in eligible_opps)
    
    action_opp_ids = set(a.opportunity_id for a in db.query(RecoveryAction).filter(
        RecoveryAction.action_status.in_(["PENDING_APPROVAL", "APPROVED", "COMPLETED"])
    ).all())
    intervention_opps = [o for o in all_opps if o.opportunity_id in action_opp_ids]
    total_intervention_amount = sum(float(o.amount_at_risk or 0.0) for o in intervention_opps)

    # Active revenue in intervention (for the live metrics card if it's used elsewhere, but to prevent NameError)
    revenue_in_intervention = db.query(func.sum(RecoveryOpportunity.amount_at_risk)).filter(
        RecoveryOpportunity.status.in_(["IN_PROGRESS"])
    ).scalar() or 0.0

    # Safe active recovery rate calculation (None if active expected recovery is 0)
    if expected_recovery > 0:
        recovery_rate = round(float((revenue_recovered / expected_recovery) * 100), 1)
    else:
        recovery_rate = None

    return {
        "total_revenue_processed": float(total_processed),
        "revenue_at_risk": float(revenue_at_risk),
        "recoverable_revenue": float(expected_recovery),
        "revenue_in_intervention": float(total_intervention_amount),
        "revenue_recovered": float(revenue_recovered),
        "recovery_rate": recovery_rate,
        "failed_payments": failed_payments,
        "checkout_abandonments": checkout_abandonments,
        "active_recovery_workflows": active_recovery_workflows,
        "funnel_total_risk": float(total_opportunity_amount),
        "funnel_eligible": float(total_eligible_amount),
        "funnel_intervention": float(total_intervention_amount),
        "funnel_recovered": float(revenue_recovered)
    }

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.transaction import Transaction

router = APIRouter()

@router.get("/recovery")
def get_recovery_analytics(db: Session = Depends(get_db)):
    from ..models.audit import AuditLog
    from ..models.recovery import RecoveryOpportunity
    logs = db.query(AuditLog).all()
    all_opps = db.query(RecoveryOpportunity).all()
    total_risk = sum(o.amount_at_risk for o in all_opps if o.amount_at_risk) or 0.0
    total_recovered = sum(l.amount_recovered for l in logs if l.amount_recovered) or 0.0
    
    trend_data = []
    if logs or all_opps:
        trend_data.append({
            "time": "Synthetic Batch 1",
            "amountAtRisk": total_risk if total_risk > 0 else total_recovered,
            "recovered": total_recovered
        })
    return {
        "trend_data": trend_data
    }

@router.get("/causes")
def get_causes_analytics(db: Session = Depends(get_db)):
    results = db.query(Transaction.failure_reason, func.count(Transaction.id)).filter(
        Transaction.payment_status.in_(["FAILED", "ABANDONED", "SUBSCRIPTION_FAILED"])
    ).group_by(Transaction.failure_reason).all()
    
    causes = []
    for reason, count in results:
        if reason:
            causes.append({"name": reason, "value": count})
            
    return {
        "top_causes": causes
    }

from ..models.recovery import RecoveryOpportunity
from ..services.ai_service import ai_service
import traceback

@router.get("/recovery-opportunities")
def get_portfolio_analytics(db: Session = Depends(get_db)):
    active_opps = db.query(RecoveryOpportunity).filter(
        RecoveryOpportunity.status.notin_(["RECOVERED", "FAILED"])
    ).all()
    
    total_amount_at_risk = 0.0
    expected_recovery = 0.0
    opportunities_data = []
    
    ACTIONABILITY_FACTORS = {
        "RETRY": 1.0,
        "REMINDER": 0.8,
        "PAYMENT_METHOD_UPDATE": 0.9,
        "NO_ACTION": 0.2
    }
    
    for opp in active_opps:
        # Normalize DB percentage to fraction for fallback
        prob = (opp.recovery_probability / 100.0) if opp.recovery_probability else 0.0
        rec_action = opp.recommended_action or "NO_ACTION"
        
        try:
            ai_result = ai_service.analyze_opportunity(opp.opportunity_id, db)
            prob = ai_result.get("recovery_probability", prob)
            rec_action = ai_result.get("recommended_action", rec_action)
        except Exception as e:
            print(f"AI Service error for {opp.opportunity_id}: {e}")
            
        amt = float(opp.amount_at_risk) if opp.amount_at_risk else 0.0
        
        if amt < 0:
            amt = 0.0
        if prob < 0 or prob > 1:
            prob = 0.0
            
        total_amount_at_risk += amt
        exp_rec = amt * prob
        expected_recovery += exp_rec
        
        factor = ACTIONABILITY_FACTORS.get(rec_action, 0.5)
        priority_score = amt * prob * factor
        
        opportunities_data.append({
            "opportunity_id": opp.opportunity_id,
            "transaction_id": opp.transaction.transaction_id if opp.transaction else None,
            "amount_at_risk": round(amt, 2),
            "recovery_probability": prob,
            "expected_recovery": round(exp_rec, 4),
            "recommended_action": rec_action,
            "priority_score": round(priority_score, 4)
        })
        
    opportunities_data.sort(key=lambda x: (x["priority_score"], x["opportunity_id"]), reverse=True)
    rate = (expected_recovery / total_amount_at_risk) if total_amount_at_risk > 0 else None
    
    return {
        "total_amount_at_risk": round(total_amount_at_risk, 2),
        "expected_recovery": round(expected_recovery, 4),
        "expected_recovery_rate": round(rate, 4) if rate is not None else None,
        "opportunity_count": len(active_opps),
        "opportunities": opportunities_data
    }

from ..models.recovery import RecoveryAction

@router.get("/recovery-performance")
def get_recovery_performance(db: Session = Depends(get_db)):
    actions = db.query(RecoveryAction).filter(
        RecoveryAction.result.in_(["RECOVERED", "NOT_RECOVERED"])
    ).all()
    
    total_predictions = len(actions)
    recovered = 0
    not_recovered = 0
    
    buckets = {
        "0-20%": {"prediction_count": 0, "recovered_count": 0, "prob_sum": 0.0},
        "20-40%": {"prediction_count": 0, "recovered_count": 0, "prob_sum": 0.0},
        "40-60%": {"prediction_count": 0, "recovered_count": 0, "prob_sum": 0.0},
        "60-80%": {"prediction_count": 0, "recovered_count": 0, "prob_sum": 0.0},
        "80-100%": {"prediction_count": 0, "recovered_count": 0, "prob_sum": 0.0}
    }
    
    outcomes = []
    brier_sum = 0.0
    correct_count = 0
    prob_sum = 0.0
    
    for action in actions:
        ai_result = ai_service.analyze_opportunity(action.opportunity_id, db)
        prob = ai_result.get("recovery_probability", 0.0)
        prob_sum += prob
        
        actual_binary = 1 if action.result == "RECOVERED" else 0
        predicted_class = "RECOVERED" if prob >= 0.5 else "NOT_RECOVERED"
        
        if predicted_class == action.result:
            correct_count += 1
            
        brier_contribution = (prob - actual_binary) ** 2
        brier_sum += brier_contribution
        
        if action.result == "RECOVERED":
            recovered += 1
        else:
            not_recovered += 1
            
        outcomes.append({
            "action_id": action.id,
            "predicted_probability": prob,
            "predicted_class": predicted_class,
            "actual_outcome": action.result
        })
        
        if prob <= 0.2:
            bucket_key = "0-20%"
        elif prob <= 0.4:
            bucket_key = "20-40%"
        elif prob <= 0.6:
            bucket_key = "40-60%"
        elif prob <= 0.8:
            bucket_key = "60-80%"
        else:
            bucket_key = "80-100%"
            
        buckets[bucket_key]["prediction_count"] += 1
        buckets[bucket_key]["prob_sum"] += prob
        if action.result == "RECOVERED":
            buckets[bucket_key]["recovered_count"] += 1
            
    calibration_buckets = []
    for k, v in buckets.items():
        if v["prediction_count"] > 0:
            obs_rate = v["recovered_count"] / v["prediction_count"]
            avg_prob = v["prob_sum"] / v["prediction_count"]
        else:
            obs_rate = None
            avg_prob = None
            
        calibration_buckets.append({
            "bucket": k,
            "prediction_count": v["prediction_count"],
            "recovered_count": v["recovered_count"],
            "observed_recovery_rate": obs_rate,
            "average_predicted_probability": avg_prob
        })
        
    actual_recovery_rate = recovered / total_predictions if total_predictions > 0 else 0.0
    average_predicted_probability = prob_sum / total_predictions if total_predictions > 0 else 0.0
    prediction_accuracy = correct_count / total_predictions if total_predictions > 0 else 0.0
    brier_score = brier_sum / total_predictions if total_predictions > 0 else 0.0

    return {
        "synthetic": True,
        "prediction_source": "reconstructed_from_current_model",
        "total_predictions": total_predictions,
        "recovered": recovered,
        "not_recovered": not_recovered,
        "actual_recovery_rate": actual_recovery_rate,
        "average_predicted_probability": average_predicted_probability,
        "prediction_accuracy": prediction_accuracy,
        "brier_score": brier_score,
        "outcomes": outcomes,
        "calibration_buckets": calibration_buckets
    }

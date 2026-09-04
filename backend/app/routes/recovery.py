import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.recovery import RecoveryOpportunity, RecoveryAction
from ..models.audit import AuditLog
from ..schemas.recovery import (
    RecoveryActionResponse, 
    BatchSimulationRequest, 
    BatchSimulationResponse, 
    BatchOpportunityResult
)
from ..services.recovery_engine import recovery_engine

router = APIRouter()

@router.get("/actions", response_model=List[RecoveryActionResponse])
def get_recovery_actions(db: Session = Depends(get_db)):
    return db.query(RecoveryAction).order_by(RecoveryAction.id.desc()).all()

@router.post("/batch-simulate", response_model=BatchSimulationResponse)
def simulate_batch_recovery(req: BatchSimulationRequest = BatchSimulationRequest(), db: Session = Depends(get_db)):
    from ..services.ai_service import ai_service
    
    max_opps = max(1, min(10, req.max_opportunities))
    min_prob = max(0.0, min(1.0, req.min_probability))
    scenario = req.scenario if req.scenario in ["all_success", "all_failure", "mixed"] else "mixed"
    
    active_opps = db.query(RecoveryOpportunity).filter(
        RecoveryOpportunity.status.notin_(["RECOVERED", "FAILED"])
    ).all()
    
    if not active_opps:
        return BatchSimulationResponse(
            synthetic=True,
            batch_id=f"BATCH_{uuid.uuid4().hex[:8].upper()}",
            requested_limit=max_opps,
            min_probability=min_prob,
            scenario=scenario,
            dry_run=req.dry_run,
            processed_count=0,
            policy_blocked_count=0,
            successful_count=0,
            failed_count=0,
            amount_at_risk=0.0,
            amount_recovered=0.0,
            recovery_rate=0.0,
            expected_recovery_before_batch=0.0,
            stopping_reason="NO_ELIGIBLE_OPPORTUNITIES",
            results=[]
        )
        
    ACTIONABILITY_FACTORS = {
        "RETRY": 1.0,
        "REMINDER": 0.8,
        "PAYMENT_METHOD_UPDATE": 0.9,
        "NO_ACTION": 0.2
    }
    
    candidates = []
    for opp in active_opps:
        existing_action = db.query(RecoveryAction).filter(
            RecoveryAction.opportunity_id == opp.opportunity_id,
            RecoveryAction.action_status.in_(["PENDING_APPROVAL", "APPROVED", "COMPLETED"])
        ).first()
        
        if existing_action:
            continue
            
        try:
            ai_result = ai_service.analyze_opportunity(opp.opportunity_id, db)
            prob = float(ai_result.get("recovery_probability", 0.0))
            rec_action = ai_result.get("recommended_action", "NO_ACTION")
            risk_band = ai_result.get("risk_band", "LOW")
            reason = ai_result.get("reason", "")
        except Exception:
            prob = 0.0
            rec_action = "NO_ACTION"
            risk_band = "LOW"
            reason = "AI analysis failed"
            
        if prob < min_prob:
            continue
            
        policy_allowed = (rec_action != "NO_ACTION")
        amt = float(opp.amount_at_risk) if opp.amount_at_risk and opp.amount_at_risk > 0 else 0.0
        exp_rec = amt * prob
        factor = ACTIONABILITY_FACTORS.get(rec_action, 0.5)
        priority_score = amt * prob * factor
        
        candidates.append({
            "opp": opp,
            "opportunity_id": opp.opportunity_id,
            "transaction_id": opp.transaction.transaction_id if opp.transaction else None,
            "amount_at_risk": amt,
            "recovery_probability": prob,
            "expected_recovery": exp_rec,
            "risk_band": risk_band,
            "recommended_action": rec_action,
            "priority_score": priority_score,
            "policy_allowed": policy_allowed,
            "policy_reason": reason if policy_allowed else "Blocked by policy (NO_ACTION recommended)"
        })
        
    if not candidates:
        return BatchSimulationResponse(
            synthetic=True,
            batch_id=f"BATCH_{uuid.uuid4().hex[:8].upper()}",
            requested_limit=max_opps,
            min_probability=min_prob,
            scenario=scenario,
            dry_run=req.dry_run,
            processed_count=0,
            policy_blocked_count=0,
            successful_count=0,
            failed_count=0,
            amount_at_risk=0.0,
            amount_recovered=0.0,
            recovery_rate=0.0,
            expected_recovery_before_batch=0.0,
            stopping_reason="MIN_PROBABILITY_THRESHOLD_NOT_MET",
            results=[]
        )
        
    candidates.sort(key=lambda x: (x["priority_score"], x["opportunity_id"]), reverse=True)
    
    selected_candidates = candidates[:max_opps]
    stopping_reason = "MAX_OPPORTUNITIES_REACHED" if len(candidates) >= max_opps else "NO_ELIGIBLE_OPPORTUNITIES"
    
    results = []
    processed_count = 0
    policy_blocked_count = 0
    successful_count = 0
    failed_count = 0
    total_amount_at_risk = 0.0
    total_amount_recovered = 0.0
    total_expected_before_batch = 0.0
    
    for idx, c in enumerate(selected_candidates):
        processed_count += 1
        rank = idx + 1
        amt = c["amount_at_risk"]
        prob = c["recovery_probability"]
        total_amount_at_risk += amt
        total_expected_before_batch += c["expected_recovery"]
        
        if not c["policy_allowed"]:
            policy_blocked_count += 1
            results.append(BatchOpportunityResult(
                rank=rank,
                opportunity_id=c["opportunity_id"],
                transaction_id=c["transaction_id"],
                amount_at_risk=round(amt, 2),
                recovery_probability=round(prob, 4),
                expected_recovery=round(c["expected_recovery"], 2),
                risk_band=c["risk_band"],
                recommended_action=c["recommended_action"],
                priority_score=round(c["priority_score"], 4),
                policy_allowed=False,
                policy_reason=c["policy_reason"],
                action_status="BLOCKED",
                outcome=None,
                amount_recovered=0.0,
                action_id=None
            ))
            continue
            
        if scenario == "all_success":
            target_outcome = "RECOVERED"
        elif scenario == "all_failure":
            target_outcome = "NOT_RECOVERED"
        else: # "mixed": 1 -> RECOVERED, 2 -> NOT_RECOVERED, 3 -> RECOVERED, ...
            target_outcome = "RECOVERED" if (idx % 2 == 0) else "NOT_RECOVERED"
            
        if req.dry_run:
            amt_rec = amt if target_outcome == "RECOVERED" else 0.0
            if target_outcome == "RECOVERED":
                successful_count += 1
            else:
                failed_count += 1
            total_amount_recovered += amt_rec
            
            results.append(BatchOpportunityResult(
                rank=rank,
                opportunity_id=c["opportunity_id"],
                transaction_id=c["transaction_id"],
                amount_at_risk=round(amt, 2),
                recovery_probability=round(prob, 4),
                expected_recovery=round(c["expected_recovery"], 2),
                risk_band=c["risk_band"],
                recommended_action=c["recommended_action"],
                priority_score=round(c["priority_score"], 4),
                policy_allowed=True,
                policy_reason=c["policy_reason"],
                action_status="PREVIEW",
                outcome=target_outcome,
                amount_recovered=round(amt_rec, 2),
                action_id=None
            ))
        else:
            # Preserve state machine: PENDING_APPROVAL -> APPROVED -> COMPLETED
            action = RecoveryAction(
                opportunity_id=c["opportunity_id"],
                action_type=c["recommended_action"],
                action_status="PENDING_APPROVAL"
            )
            db.add(action)
            audit1 = AuditLog(
                opportunity_id=c["opportunity_id"],
                event_type="BATCH_ACTION_CREATED",
                reason="Batch AI Recommendation pending synthetic approval",
                recommendation=c["recommended_action"],
                action="CREATED",
                policy_applied="BatchDecisionEngine",
                result="PENDING"
            )
            db.add(audit1)
            db.commit()
            db.refresh(action)
            
            action.action_status = "APPROVED"
            audit2 = AuditLog(
                opportunity_id=c["opportunity_id"],
                event_type="BATCH_ACTION_APPROVED",
                reason="Batch synthetic human approval granted",
                recommendation=c["recommended_action"],
                action="APPROVED",
                policy_applied="BatchHumanOversight",
                result="SUCCESS"
            )
            db.add(audit2)
            db.commit()
            db.refresh(action)
            
            opp = c["opp"]
            action.result = target_outcome
            action.action_status = "COMPLETED"
            
            if target_outcome == "RECOVERED":
                action.amount_recovered = amt
                opp.status = "RECOVERED"
                opp.amount_recovered = amt
                successful_count += 1
                amt_rec = amt
            else:
                action.amount_recovered = 0.0
                opp.status = "FAILED"
                failed_count += 1
                amt_rec = 0.0
                
            audit3 = AuditLog(
                opportunity_id=c["opportunity_id"],
                event_type="BATCH_SYNTHETIC_OUTCOME",
                reason=f"Batch synthetic {target_outcome} recorded",
                recommendation=action.action_type,
                action=target_outcome,
                policy_applied="BatchSyntheticSimulation",
                result="SUCCESS",
                amount_recovered=amt_rec
            )
            db.add(audit3)
            db.commit()
            db.refresh(action)
            
            total_amount_recovered += amt_rec
            
            results.append(BatchOpportunityResult(
                rank=rank,
                opportunity_id=c["opportunity_id"],
                transaction_id=c["transaction_id"],
                amount_at_risk=round(amt, 2),
                recovery_probability=round(prob, 4),
                expected_recovery=round(c["expected_recovery"], 2),
                risk_band=c["risk_band"],
                recommended_action=c["recommended_action"],
                priority_score=round(c["priority_score"], 4),
                policy_allowed=True,
                policy_reason=c["policy_reason"],
                action_status="COMPLETED",
                outcome=target_outcome,
                amount_recovered=round(amt_rec, 2),
                action_id=action.id
            ))
            
    if policy_blocked_count == processed_count and processed_count > 0:
        stopping_reason = "ALL_POLICIES_BLOCKED"
        
    rate = (total_amount_recovered / total_amount_at_risk) if total_amount_at_risk > 0 else 0.0
    
    return BatchSimulationResponse(
        synthetic=True,
        batch_id=f"BATCH_{uuid.uuid4().hex[:8].upper()}",
        requested_limit=max_opps,
        min_probability=round(min_prob, 2),
        scenario=scenario,
        dry_run=req.dry_run,
        processed_count=processed_count,
        policy_blocked_count=policy_blocked_count,
        successful_count=successful_count,
        failed_count=failed_count,
        amount_at_risk=round(total_amount_at_risk, 2),
        amount_recovered=round(total_amount_recovered, 2),
        recovery_rate=round(rate, 4),
        expected_recovery_before_batch=round(total_expected_before_batch, 2),
        stopping_reason=stopping_reason,
        results=results
    )

@router.post("/analyze/{opportunity_id}")
def analyze_opportunity(opportunity_id: str, db: Session = Depends(get_db)):
    from ..services.ai_service import ai_service
    return ai_service.analyze_opportunity(opportunity_id, db)

@router.post("/execute/{opportunity_id}")
def execute_recovery(opportunity_id: str, db: Session = Depends(get_db)):
    raise HTTPException(status_code=410, detail="Legacy recovery execution is disabled. Use the human approval workflow.")

@router.post("/actions/{opportunity_id}")
def create_recovery_action(opportunity_id: str, db: Session = Depends(get_db)):
    from ..services.ai_service import ai_service
    
    # Prevent duplicate active actions
    active_action = db.query(RecoveryAction).filter(
        RecoveryAction.opportunity_id == opportunity_id,
        RecoveryAction.action_status.in_(["PENDING_APPROVAL", "APPROVED"])
    ).first()
    if active_action:
        raise HTTPException(status_code=409, detail="An active recovery action already exists for this opportunity.")
    
    opp = db.query(RecoveryOpportunity).filter(RecoveryOpportunity.opportunity_id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    ai_result = ai_service.analyze_opportunity(opportunity_id, db)
    rec_action = ai_result.get("recommended_action")
    
    if not rec_action or rec_action == "NO_ACTION":
        raise HTTPException(status_code=400, detail="Action not recommended or blocked by policy")
        
    action = RecoveryAction(
        opportunity_id=opportunity_id,
        action_type=rec_action,
        action_status="PENDING_APPROVAL"
    )
    db.add(action)
    
    audit = AuditLog(
        opportunity_id=opportunity_id,
        event_type="ACTION_CREATED",
        reason="AI Recommended Action pending human approval",
        recommendation=rec_action,
        action="CREATED",
        policy_applied="DecisionEngine",
        result="PENDING"
    )
    db.add(audit)
    
    db.commit()
    db.refresh(action)
    return action

@router.post("/actions/{action_id}/approve")
def approve_recovery_action(action_id: int, db: Session = Depends(get_db)):
    from ..services.ai_service import ai_service
    action = db.query(RecoveryAction).filter(RecoveryAction.id == action_id).first()
    
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    if action.action_status != "PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail=f"Action is in {action.action_status} state, cannot approve.")
        
    # Re-check policy
    ai_result = ai_service.analyze_opportunity(action.opportunity_id, db)
    if ai_result.get("recommended_action") == "NO_ACTION":
        raise HTTPException(status_code=400, detail="Action is no longer compliant with policy.")
        
    action.action_status = "APPROVED"
    
    audit = AuditLog(
        opportunity_id=action.opportunity_id,
        event_type="ACTION_APPROVED",
        reason="Human approved recovery action",
        recommendation=action.action_type,
        action="APPROVED",
        policy_applied="HumanOversight",
        result="SUCCESS"
    )
    db.add(audit)
    
    db.commit()
    db.refresh(action)
    return action

@router.post("/actions/{action_id}/reject")
def reject_recovery_action(action_id: int, db: Session = Depends(get_db)):
    action = db.query(RecoveryAction).filter(RecoveryAction.id == action_id).first()
    
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    if action.action_status != "PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail=f"Action is in {action.action_status} state, cannot reject.")
        
    action.action_status = "REJECTED"
    
    audit = AuditLog(
        opportunity_id=action.opportunity_id,
        event_type="ACTION_REJECTED",
        reason="Human rejected recovery action",
        recommendation=action.action_type,
        action="REJECTED",
        policy_applied="HumanOversight",
        result="SUCCESS"
    )
    db.add(audit)
    
    db.commit()
    db.refresh(action)
    return action

@router.post("/actions/{action_id}/outcome")
def record_recovery_outcome(action_id: int, payload: dict, db: Session = Depends(get_db)):
    from ..services.ai_service import ai_service
    
    outcome = payload.get("outcome")
    if outcome not in ["RECOVERED", "NOT_RECOVERED"]:
        raise HTTPException(status_code=400, detail="Invalid outcome. Must be RECOVERED or NOT_RECOVERED")
        
    action = db.query(RecoveryAction).filter(RecoveryAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    if action.action_status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Outcome already recorded for this action")
        
    if action.action_status != "APPROVED":
        raise HTTPException(status_code=400, detail=f"Action is in {action.action_status} state, cannot record outcome.")
        
    opp = db.query(RecoveryOpportunity).filter(RecoveryOpportunity.opportunity_id == action.opportunity_id).first()
    if not opp or not opp.transaction:
        raise HTTPException(status_code=404, detail="Associated opportunity or transaction not found")
        
    ai_result = ai_service.analyze_opportunity(action.opportunity_id, db)
    predicted_probability = ai_result.get("recovery_probability", 0.0)
    recommended_action = ai_result.get("recommended_action", "NO_ACTION")
    
    predicted_class = "RECOVERED" if predicted_probability >= 0.5 else "NOT_RECOVERED"
    prediction_correct = (predicted_class == outcome)
    
    action.result = outcome
    action.action_status = "COMPLETED"
    if outcome == "RECOVERED":
        action.amount_recovered = float(opp.transaction.amount)
        opp.status = "RECOVERED"
        opp.amount_recovered = float(opp.transaction.amount)
    else:
        action.amount_recovered = 0.0
        opp.status = "FAILED"
        
    audit = AuditLog(
        opportunity_id=action.opportunity_id,
        event_type="SYNTHETIC_OUTCOME_RECORDED",
        reason=f"Synthetic {outcome} outcome recorded",
        recommendation=action.action_type,
        action=outcome,
        policy_applied="SyntheticSimulation",
        result="SUCCESS"
    )
    db.add(audit)
    
    db.commit()
    db.refresh(action)
    
    return {
        "action_id": str(action.id),
        "opportunity_id": action.opportunity_id,
        "transaction_id": opp.transaction.transaction_id,
        "predicted_probability": predicted_probability,
        "predicted_class": predicted_class,
        "recommended_action": recommended_action,
        "outcome": outcome,
        "prediction_correct": prediction_correct,
        "synthetic": True
    }

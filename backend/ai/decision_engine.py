import json
from .policy import check_policy, HIGH_PROBABILITY_THRESHOLD, MEDIUM_PROBABILITY_THRESHOLD
from .explain import explain_decision

def get_risk_band(probability: float) -> str:
    if probability >= HIGH_PROBABILITY_THRESHOLD:
        return "HIGH"
    elif probability >= MEDIUM_PROBABILITY_THRESHOLD:
        return "MEDIUM"
    return "LOW"

def _determine_initial_action(transaction_data: dict, probability: float, risk_band: str) -> str:
    """
    Determines the baseline recommended action based on ML probability and features.
    Does NOT apply policy limits yet.
    """
    failure_reason = transaction_data.get('failure_reason', '')
    retry_count = transaction_data.get('retry_count', 0)
    
    if risk_band == "LOW":
        return "NO_ACTION"
        
    if failure_reason == 'network_failure':
        if risk_band == "HIGH" and retry_count <= 1:
            return "RETRY"
        return "REMINDER"
        
    if failure_reason == 'abandoned_otp':
        if retry_count == 0:
            return "REMINDER"
        return "NO_ACTION"
        
    if failure_reason == 'invalid_card':
        return "PAYMENT_METHOD_UPDATE"
        
    if failure_reason in ['insufficient_funds', 'exceeds_limit']:
        if risk_band == "HIGH" and retry_count == 0:
            # Maybe safe to retry once if high prob, but often safer to just remind
            return "REMINDER"
        return "PAYMENT_METHOD_UPDATE"
        
    # Default behavior for unhandled reasons
    if risk_band == "HIGH":
        return "RETRY"
    elif risk_band == "MEDIUM":
        return "REMINDER"
        
    return "NO_ACTION"

def _get_fallback_action(action: str) -> str:
    """
    If an action is blocked by policy, determine the safest downgrade.
    """
    if action == 'RETRY':
        return "REMINDER"
    if action == 'REMINDER':
        return "PAYMENT_METHOD_UPDATE"
    if action == 'PAYMENT_METHOD_UPDATE':
        return "NO_ACTION"
    return "NO_ACTION"

def get_recovery_decision(transaction_data: dict, probability: float) -> dict:
    """
    Takes transaction details and an ML recovery probability.
    Returns a structured decision object enforcing all business rules.
    """
    risk_band = get_risk_band(probability)
    
    # 1. Determine baseline action
    action = _determine_initial_action(transaction_data, probability, risk_band)
    
    # 2. Check policy guards
    policy_checks = []
    is_allowed, reason = check_policy(action, transaction_data)
    policy_checks.append({"action": action, "allowed": is_allowed, "reason": reason})
    
    # 3. Fallback if blocked
    while not is_allowed and action != "NO_ACTION":
        action = _get_fallback_action(action)
        is_allowed, reason = check_policy(action, transaction_data)
        policy_checks.append({"action": action, "allowed": is_allowed, "reason": reason})
        
    # 4. Generate Explainability
    explanation = explain_decision(transaction_data, probability, action)
    
    return {
        "transaction_id": transaction_data.get('transaction_id', 'unknown'),
        "recovery_probability": round(probability, 4),
        "risk_band": risk_band,
        "recommended_action": action,
        "reason": reason if is_allowed else "Blocked by policy",
        "policy_checks": policy_checks,
        "confidence": "HIGH" if is_allowed else "LOW",
        "model_version": "1.0.0",
        "explanation": explanation
    }

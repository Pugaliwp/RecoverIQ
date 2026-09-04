HIGH_PROBABILITY_THRESHOLD = 0.75
MEDIUM_PROBABILITY_THRESHOLD = 0.45
MAX_RETRIES = 2

def check_policy(action: str, transaction_data: dict) -> tuple[bool, str]:
    """
    Evaluates if the proposed action is permitted under business rules.
    Returns (is_allowed, reason).
    """
    retry_count = transaction_data.get('retry_count', 0)
    failure_reason = transaction_data.get('failure_reason', '')
    
    if action == 'RETRY':
        if retry_count >= MAX_RETRIES:
            return False, f"Policy violation: retry_count ({retry_count}) exceeds MAX_RETRIES ({MAX_RETRIES})."
            
        if failure_reason == 'invalid_card':
            return False, "Policy violation: Cannot retry an invalid card."
            
        if failure_reason in ['insufficient_funds', 'exceeds_limit'] and retry_count >= 1:
            return False, "Policy violation: Cannot aggressively retry insufficient funds or limit exceeded."

    return True, "Action permitted by policy."

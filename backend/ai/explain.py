def explain_decision(transaction_data: dict, probability: float, recommended_action: str) -> dict:
    """
    Generates an explanation showing the main factors influencing the recommendation.
    """
    positive_factors = []
    negative_factors = []
    
    # Assess probability
    if probability >= 0.75:
        positive_factors.append(f"High recovery probability ({probability:.2f})")
    elif probability < 0.45:
        negative_factors.append(f"Low recovery probability ({probability:.2f})")
        
    # Assess failure reason
    failure_reason = transaction_data.get('failure_reason', '')
    if failure_reason == 'network_failure':
        positive_factors.append("Temporary network failure is usually recoverable")
    elif failure_reason == 'abandoned_otp':
        negative_factors.append("Customer abandoned OTP (requires manual intervention/reminder)")
    elif failure_reason == 'invalid_card':
        negative_factors.append("Card is invalid, requires customer update")
    elif failure_reason == 'insufficient_funds':
        negative_factors.append("Customer has insufficient funds")
        
    # Assess retries
    retry_count = transaction_data.get('retry_count', 0)
    if retry_count == 0:
        positive_factors.append("First payment attempt, no prior retries")
    elif retry_count >= 2:
        negative_factors.append("Maximum retries already reached")
        
    # Assess customer history (simulated basic checks for interpretability)
    cust_success = transaction_data.get('customer_success_rate', 0.5)
    if cust_success > 0.8:
        positive_factors.append("High customer historical success rate")
    elif cust_success < 0.3:
        negative_factors.append("Poor customer historical success rate")

    return {
        "positive_factors": positive_factors,
        "negative_factors": negative_factors
    }

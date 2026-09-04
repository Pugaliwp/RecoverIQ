import pandas as pd
import numpy as np
import os

def generate_dataset():
    N = 20000
    np.random.seed(42)
    
    # 1. Identifier
    transaction_id = [f"txn_synth_{i:06d}" for i in range(N)]
    
    # 2. Amount (log-normal, bounded)
    amount = np.random.lognormal(mean=6.5, sigma=1.0, size=N)
    amount = np.clip(amount, 10.0, 100000.0)
    amount = np.round(amount, 2)
    
    # 3. Payment Method & Failure Reason
    methods = ['Card', 'UPI', 'Netbanking', 'Wallet']
    method_probs = [0.4, 0.3, 0.2, 0.1]
    payment_method = np.random.choice(methods, size=N, p=method_probs)
    
    failure_reason = []
    for pm in payment_method:
        if pm == 'Card':
            reason = np.random.choice(
                ['invalid_card', 'insufficient_funds', 'temporary_network_failure', 'exceeds_limit', 'abandoned_otp'],
                p=[0.25, 0.30, 0.20, 0.10, 0.15]
            )
        elif pm == 'UPI':
            reason = np.random.choice(
                ['temporary_network_failure', 'insufficient_funds', 'exceeds_limit', 'abandoned_otp'],
                p=[0.55, 0.30, 0.10, 0.05]
            )
        elif pm == 'Netbanking':
            reason = np.random.choice(
                ['temporary_network_failure', 'insufficient_funds', 'exceeds_limit', 'abandoned_otp'],
                p=[0.40, 0.35, 0.10, 0.15]
            )
        else: # Wallet
            reason = np.random.choice(
                ['insufficient_funds', 'temporary_network_failure'],
                p=[0.70, 0.30]
            )
        failure_reason.append(reason)
    
    # 4. Customer Success Rate
    customer_success_rate = np.random.beta(a=5, b=2, size=N)
    
    # 5. Previous Transaction Count
    previous_transaction_count = np.random.poisson(lam=5, size=N) + np.random.negative_binomial(n=1, p=0.1, size=N)
    
    # 6. Previous Failed Count
    # Mathematically consistent with previous_transaction_count and customer_success_rate
    previous_failed_count = np.random.binomial(n=previous_transaction_count, p=(1 - customer_success_rate))
    
    # 7. Retry Count
    retry_count = np.random.poisson(lam=0.6, size=N)
    retry_count = np.clip(retry_count, 0, 5)
    
    # 8. Hour of Day (Mixture model for business hours)
    # Peak around 10am and 6pm
    hours = np.concatenate([
        np.random.normal(10, 2, int(N*0.4)),
        np.random.normal(18, 2, int(N*0.4)),
        np.random.uniform(0, 24, N - int(N*0.4)*2)
    ])
    hour_of_day = np.clip(np.round(hours), 0, 23).astype(int)
    
    # 9. Day of Week
    day_of_week = np.random.randint(0, 7, size=N)
    
    # 10. Is Subscription
    is_subscription = np.random.binomial(1, p=0.15, size=N)
    
    # 11. Days Since Last Payment
    days_since_last_payment = np.random.exponential(scale=30, size=N)
    days_since_last_payment = np.clip(days_since_last_payment, 0, 365).astype(int)
    
    # 12. Customer Tenure Days
    base_tenure = previous_transaction_count * 15 + np.random.exponential(scale=100, size=N)
    customer_tenure_days = np.clip(base_tenure, 0, 3650).astype(int)
    
    # 13. Payment Attempt Number
    payment_attempt_number = retry_count + 1
    
    # 14. Is First Payment
    is_first_payment = (previous_transaction_count == 0).astype(int)
    
    # 15. Customer Avg Transaction Amount
    # Some jitter around the current amount
    customer_avg_transaction_amount = amount * np.random.lognormal(mean=0, sigma=0.3, size=N)
    customer_avg_transaction_amount = np.round(customer_avg_transaction_amount, 2)
    
    # 16. Amount vs Customer Average
    amount_vs_customer_average = amount / (customer_avg_transaction_amount + 1e-5)
    
    # Create DataFrame
    df = pd.DataFrame({
        'transaction_id': transaction_id,
        'amount': amount,
        'payment_method': payment_method,
        'failure_reason': failure_reason,
        'retry_count': retry_count,
        'customer_success_rate': customer_success_rate,
        'previous_transaction_count': previous_transaction_count,
        'previous_failed_count': previous_failed_count,
        'hour_of_day': hour_of_day,
        'day_of_week': day_of_week,
        'is_subscription': is_subscription,
        'days_since_last_payment': days_since_last_payment,
        'customer_tenure_days': customer_tenure_days,
        'payment_attempt_number': payment_attempt_number,
        'is_first_payment': is_first_payment,
        'customer_avg_transaction_amount': customer_avg_transaction_amount,
        'amount_vs_customer_average': amount_vs_customer_average
    })
    
    # --- Target Generation (Latent Score) ---
    score = np.zeros(N)
    
    # Base rate adjustment
    score -= 0.5 
    
    # Customer success rate contribution
    score += (df['customer_success_rate'] - 0.5) * 5.0
    
    # Failure reason weights
    fr_weights = {
        'temporary_network_failure': 2.0,
        'abandoned_otp': 1.0,
        'insufficient_funds': -1.5,
        'invalid_card': -3.0,
        'exceeds_limit': -1.5
    }
    score += df['failure_reason'].map(fr_weights)
    
    # Retry count penalty
    score -= df['retry_count'] * 1.0
    
    # Previous failed count penalty
    score -= df['previous_failed_count'] * 0.15
    
    # First payment uncertainty
    score -= df['is_first_payment'] * 0.5
    
    # Tenure bonus
    score += (df['customer_tenure_days'] / 365.0) * 0.3
    
    # Amount vs average (very large amounts relative to history are harder to recover)
    score -= (df['amount_vs_customer_average'] - 1.0) * 0.5
    
    # Timing effects (night hours generally perform worse)
    night_hours = df['hour_of_day'].isin([0,1,2,3,4,5])
    score -= night_hours.astype(int) * 0.5
    
    # Random noise
    score += np.random.normal(0, 1.2, size=N)
    
    # Convert to probability via sigmoid
    recovery_probability_true = 1 / (1 + np.exp(-score))
    
    # Generate binary target
    df['recovered'] = np.random.binomial(1, recovery_probability_true)
    
    # Ensure no leakage fields are present implicitly
    # (Since we just generated it, they aren't, but following instructions)
    
    # --- Assertions ---
    assert len(df) == 20000, f"Expected 20,000 rows, got {len(df)}"
    assert df['recovered'].isin([0, 1]).all()
    assert df['transaction_id'].is_unique
    assert df.isnull().sum().sum() == 0
    assert "amount_recovered" not in df.columns
    assert "recovery_status" not in df.columns
    assert "recovery_action" not in df.columns
    assert "recovery_probability_true" not in df.columns
    
    # Save dataset
    output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'synthetic')
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'training_dataset.csv')
    df.to_csv(output_path, index=False)
    
    # --- Output Verification ---
    print("=== DATASET VERIFICATION ===")
    print(f"Shape: {df.shape}")
    print(f"Features: {list(df.columns)}")
    print(f"\nTarget Class Distribution:\n{df['recovered'].value_counts(normalize=True)*100}")
    print(f"\nRecovered Percentage: {df['recovered'].mean()*100:.2f}%")
    print("\nMissing values:", df.isnull().sum().sum())
    print("Duplicate IDs:", df.duplicated(subset=['transaction_id']).sum())
    print("\nMinimum Amount:", df['amount'].min())
    print("Maximum Amount:", df['amount'].max())
    print("Mean Amount:", df['amount'].mean())
    print("\nCustomer Success Rate Stats:\n", df['customer_success_rate'].describe()[['min', 'max', 'mean']])
    print("\nFailure Reason Distribution:\n", df['failure_reason'].value_counts(normalize=True)*100)
    print("\nPayment Method Distribution:\n", df['payment_method'].value_counts(normalize=True)*100)
    
    print("\nExplicit Confirmations:")
    print("- 'amount_recovered', 'recovery_status', 'recovery_action', 'recovery_probability_true' are NOT in columns.")
    print("- 'transaction_id' is an identifier and will be dropped before model training.")
    
    print("\nSample Records (first 10):")
    print(df.head(10).to_string())
    print("\nSaved output to:", output_path)

if __name__ == '__main__':
    generate_dataset()

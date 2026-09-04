from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# Define features
CATEGORICAL_FEATURES = [
    'payment_method',
    'failure_reason'
]

NUMERIC_FEATURES = [
    'amount',
    'retry_count',
    'customer_success_rate',
    'previous_transaction_count',
    'previous_failed_count',
    'hour_of_day',
    'day_of_week',
    'is_subscription',
    'days_since_last_payment',
    'customer_tenure_days',
    'payment_attempt_number',
    'is_first_payment',
    'customer_avg_transaction_amount',
    'amount_vs_customer_average'
]

# Excluded explicitly to prevent leakage or meaningless splits:
# - 'transaction_id': Identifier, no predictive value, would just overfit.
# - 'amount_recovered', 'recovery_status', 'recovery_action', 'recovery_probability_true': 
#   These are post-recovery/leakage fields and strictly prohibited from training.

TARGET = 'recovered'

def get_preprocessor():
    """
    Returns a ColumnTransformer configured to preprocess our features.
    - Categorical features are one-hot encoded (ignoring unknown categories to prevent errors on unseen data).
    - Numeric features are standardized using StandardScaler.
    
    Why probability quality matters for RecoverIQ:
    RecoverIQ uses these predictions to determine optimal cost-benefit recovery strategies.
    A well-calibrated probability (where a 0.8 prediction means an 80% true chance of recovery)
    is essential for expected value calculations, which is why we evaluate PR-AUC and Brier score.
    """
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), NUMERIC_FEATURES),
            ('cat', OneHotEncoder(handle_unknown='ignore'), CATEGORICAL_FEATURES)
        ]
    )
    return preprocessor

def get_feature_names():
    return NUMERIC_FEATURES + CATEGORICAL_FEATURES

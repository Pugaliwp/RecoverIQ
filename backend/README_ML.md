# RecoverIQ Machine Learning Data

This directory contains the machine learning pipelines and models for the RecoverIQ platform. 
We generate synthetic training data to develop and train models before applying them to real transactional data.

## Synthetic Dataset Generation

The dataset is generated using `ai/generate_dataset.py`.

### Features
- **transaction_id**: Unique identifier (not an ML feature)
- **amount**: Log-normal distribution of transaction amounts (capped)
- **payment_method**: Non-uniform categorical distribution (Card, UPI, Netbanking, Wallet)
- **failure_reason**: Categorical reasons with relationships to payment method (e.g. invalid_card implies Card)
- **retry_count**: Bounded retry attempts
- **customer_success_rate**: Beta distribution skewed toward higher success
- **previous_transaction_count**: Poisson/Negative Binomial distribution
- **previous_failed_count**: Consistent with transaction count and success rate
- **hour_of_day**: Peak distributions reflecting business/shopping hours
- **day_of_week**: Uniform 0-6
- **is_subscription**: Binomial probability
- **days_since_last_payment**: Exponential distribution
- **customer_tenure_days**: Realistic tenure distribution
- **payment_attempt_number**: Based on retry_count
- **is_first_payment**: Derived from customer history
- **customer_avg_transaction_amount**: Based on customer behavior
- **amount_vs_customer_average**: Ratio of current amount to average amount

### Target
The target variable is `recovered` (binary 0/1), generated from a latent logistic probability model (using a sigmoid transform of various feature contributions).
The dataset specifically avoids data leakage by not including `amount_recovered`, `recovery_status`, or any other post-recovery information.

### Assumptions and Limitations
- The temporal relationship between successive transactions is not simulated perfectly.
- The latent score models logical relationships (e.g. temporary_network_failure increases recovery likelihood, invalid_card decreases it) but may not exactly match a specific business's true data distribution.
- Real-world black swan events or complex fraud patterns are absent.

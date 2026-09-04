import os
import json
import joblib
import pandas as pd
from fastapi import HTTPException
from sqlalchemy.orm import Session
from ..models.recovery import RecoveryOpportunity
from ..models.transaction import Transaction
from ..models.customer import Customer

# Load AI Modules (must be in Python path)
import sys
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
if base_dir not in sys.path:
    sys.path.append(base_dir)

from ai.decision_engine import get_recovery_decision

class AIService:
    def __init__(self):
        self.model = None
        self.metadata = None
        self.load_model()

    def load_model(self):
        try:
            model_path = os.path.join(base_dir, 'ai', 'model', 'recovery_model.joblib')
            meta_path = os.path.join(base_dir, 'ai', 'model', 'model_metadata.json')
            
            if os.path.exists(model_path) and os.path.exists(meta_path):
                self.model = joblib.load(model_path)
                with open(meta_path, 'r') as f:
                    self.metadata = json.load(f)
            else:
                print("Warning: AI Model files not found.")
        except Exception as e:
            print(f"Error loading AI Model: {e}")
            self.model = None

    def _extract_features(self, db: Session, transaction: Transaction) -> pd.DataFrame:
        """
        Computes ML features dynamically from DB.
        """
        customer = transaction.customer
        
        # Calculate dynamic features based on customer's transaction history
        past_txns = []
        if customer and customer.transactions:
            past_txns = [t for t in customer.transactions if t.timestamp < transaction.timestamp]
            
        previous_transaction_count = len(past_txns)
        
        previous_failed_count = sum(1 for t in past_txns if t.payment_status in ['FAILED', 'ABANDONED'])
        
        if previous_transaction_count > 0:
            success_count = sum(1 for t in past_txns if t.payment_status == 'SUCCESS')
            customer_success_rate = success_count / previous_transaction_count
            customer_avg_transaction_amount = sum(t.amount for t in past_txns) / previous_transaction_count
        else:
            customer_success_rate = 1.0  # default for new users
            customer_avg_transaction_amount = transaction.amount
            
        amount_vs_customer_average = transaction.amount / max(customer_avg_transaction_amount, 1.0)
        
        if past_txns:
            last_txn_date = max(t.timestamp for t in past_txns)
            days_since_last = (transaction.timestamp - last_txn_date).days
        else:
            days_since_last = 0
            
        if customer:
            tenure_days = (transaction.timestamp - customer.created_at).days
        else:
            tenure_days = 0
            
        # Construct feature dictionary
        features = {
            'payment_method': transaction.payment_method or 'unknown',
            'failure_reason': transaction.failure_reason or 'unknown_error',
            'amount': transaction.amount,
            'retry_count': transaction.retry_count or 0,
            'customer_success_rate': customer_success_rate,
            'previous_transaction_count': previous_transaction_count,
            'previous_failed_count': previous_failed_count,
            'hour_of_day': transaction.timestamp.hour,
            'day_of_week': transaction.timestamp.weekday(),
            'is_subscription': 0, # Assuming false for demo if not explicitly mapped
            'days_since_last_payment': days_since_last,
            'customer_tenure_days': tenure_days,
            'payment_attempt_number': transaction.retry_count + 1,
            'is_first_payment': 1 if previous_transaction_count == 0 else 0,
            'customer_avg_transaction_amount': customer_avg_transaction_amount,
            'amount_vs_customer_average': amount_vs_customer_average
        }
        
        # We explicitly EXCLUDE transaction_id from this dataframe.
        return pd.DataFrame([features])

    def analyze_opportunity(self, opportunity_id: str, db: Session) -> dict:
        """
        Core pipeline: Find Opportunity -> Extract Features -> Predict -> Decision Engine
        """
        if not self.model:
            raise HTTPException(status_code=503, detail="AI Model is not currently loaded or available.")
            
        opp = db.query(RecoveryOpportunity).filter(RecoveryOpportunity.opportunity_id == opportunity_id).first()
        if not opp:
            raise HTTPException(status_code=404, detail="Opportunity not found")
            
        if not opp.transaction:
            raise HTTPException(status_code=404, detail="Associated transaction not found")
            
        # 1. Prepare Features
        try:
            X = self._extract_features(db, opp.transaction)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Feature extraction failed: {str(e)}")
            
        # 2. Predict Probability
        try:
            # model.predict_proba returns array of shape (n_samples, n_classes)
            # index 1 is the probability of class 1 (recovered)
            probability = float(self.model.predict_proba(X)[0][1])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model prediction failed: {str(e)}")
            
        # 3. Prepare data for Decision Engine
        transaction_data = {
            'transaction_id': opp.transaction.transaction_id,
            'failure_reason': opp.transaction.failure_reason,
            'retry_count': opp.transaction.retry_count,
            'customer_success_rate': X['customer_success_rate'].iloc[0]
        }
        
        # 4. Get Decision
        decision = get_recovery_decision(transaction_data, probability)
        
        return decision

ai_service = AIService()

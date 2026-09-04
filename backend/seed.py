import os
import sys
from datetime import datetime, timedelta
import uuid
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

from app.database import engine, Base, SessionLocal
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.recovery import RecoveryOpportunity
from app.models.audit import AuditLog

def generate_id(prefix=""):
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"

def seed_db():
    print("Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        
        # Customers
        c1 = Customer(customer_id="cust_12345", name="Alice Smith", email="alice@example.com")
        c2 = Customer(customer_id="cust_67890", name="Bob Jones", email="bob@example.com")
        c3 = Customer(customer_id="cust_54321", name="Charlie Brown", email="charlie@example.com")
        
        db.add_all([c1, c2, c3])
        db.commit()
        print("Customers seeded.")

        # Transactions
        t1 = Transaction(
            transaction_id="TXN_A1B2C3", customer_id="cust_12345", amount=4999.0, currency="INR", 
            timestamp=now - timedelta(hours=1), payment_status="FAILED", failure_reason="Bank timeout", 
            payment_method="UPI", retry_count=0
        )
        t2 = Transaction(
            transaction_id="TXN_X9Y8Z7", customer_id="cust_67890", amount=12499.0, currency="INR", 
            timestamp=now - timedelta(hours=3), payment_status="ABANDONED", failure_reason="Dropped at OTP", 
            payment_method="Card", retry_count=0
        )
        t3 = Transaction(
            transaction_id="TXN_P4Q5R6", customer_id="cust_54321", amount=2999.0, currency="INR", 
            timestamp=now - timedelta(hours=5), payment_status="SUBSCRIPTION_FAILED", failure_reason="Insufficient funds", 
            payment_method="Mandate", retry_count=1
        )
        db.add_all([t1, t2, t3])
        db.commit()
        print("Transactions seeded.")

        # Opportunities
        o1 = RecoveryOpportunity(
            opportunity_id="OPP_1", transaction_id="TXN_A1B2C3", amount_at_risk=4999.0, 
            recovery_probability=82.0, root_cause="Payment Failure", recommended_action="RETRY", 
            status="ELIGIBLE", created_at=now - timedelta(minutes=45)
        )
        o2 = RecoveryOpportunity(
            opportunity_id="OPP_2", transaction_id="TXN_X9Y8Z7", amount_at_risk=12499.0, 
            recovery_probability=71.0, root_cause="Checkout Abandonment", recommended_action="REMINDER", 
            status="PENDING", created_at=now - timedelta(minutes=160)
        )
        o3 = RecoveryOpportunity(
            opportunity_id="OPP_3", transaction_id="TXN_P4Q5R6", amount_at_risk=2999.0, 
            recovery_probability=95.0, root_cause="Subscription Failure", recommended_action="RETRY", 
            status="IN_PROGRESS", created_at=now - timedelta(hours=4)
        )
        db.add_all([o1, o2, o3])
        db.commit()
        print("Opportunities seeded.")

        # Audit Logs
        a1 = AuditLog(
            opportunity_id="OPP_3", timestamp=now - timedelta(hours=2), 
            event_type="RECOVERY_EVALUATION", reason="Subscription Failed - Insufficient Funds", 
            recommendation="Wait 24h for salary hit", action="Retry Queued", 
            policy_applied="Smart routing enabled", result="PENDING", amount_recovered=0.0
        )
        db.add(a1)
        db.commit()
        print("Audit logs seeded.")

        print("Database seeded successfully with synthetic data!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()

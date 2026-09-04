import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.customer import Customer
from app.models.recovery import RecoveryAction, RecoveryOpportunity
from app.routes.customers import get_customers
from app.routes.recovery import get_recovery_actions

# Setup in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def test_get_customers_route_function():
    db = TestingSessionLocal()
    cust = Customer(id=1, customer_id="cust_test1", name="Test User", email="test@example.com")
    db.add(cust)
    db.commit()

    customers = get_customers(db=db)
    assert len(customers) >= 1
    assert customers[0].customer_id == "cust_test1"
    assert customers[0].name == "Test User"
    assert customers[0].email == "test@example.com"
    db.close()

def test_get_recovery_actions_route_function():
    db = TestingSessionLocal()
    opp = RecoveryOpportunity(
        id=10, opportunity_id="OPP_TEST10", transaction_id="TXN_10",
        amount_at_risk=5000.0, recovery_probability=0.8,
        root_cause="INSUFFICIENT_FUNDS", recommended_action="RETRY", status="ELIGIBLE"
    )
    db.add(opp)
    action = RecoveryAction(id=10, opportunity_id="OPP_TEST10", action_type="RETRY", action_status="PENDING_APPROVAL")
    db.add(action)
    db.commit()

    actions = get_recovery_actions(db=db)
    assert len(actions) >= 1
    assert actions[0].opportunity_id == "OPP_TEST10"
    assert actions[0].action_type == "RETRY"
    assert actions[0].action_status == "PENDING_APPROVAL"
    db.close()

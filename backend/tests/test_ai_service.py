import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from app.services.ai_service import AIService
from app.models.recovery import RecoveryOpportunity
from app.models.transaction import Transaction
from app.models.customer import Customer
try:
    from app.models.audit import AuditLog
except ImportError:
    pass
try:
    from app.models.recovery import RecoveryAction
except ImportError:
    pass
import pandas as pd
from datetime import datetime

class DummyModel:
    def __init__(self, prob=0.8):
        self.prob = prob
    def predict_proba(self, X):
        return [[1 - self.prob, self.prob]]

@pytest.fixture
def ai_service():
    service = AIService()
    service.model = DummyModel(0.9) # High probability by default
    return service

@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def dummy_customer():
    cust = Customer(id=1, customer_id="cust_1", created_at=datetime.utcnow())
    cust.transactions = []
    return cust

@pytest.fixture
def dummy_transaction(dummy_customer):
    txn = Transaction(
        transaction_id="txn_1",
        customer=dummy_customer,
        amount=100.0,
        payment_method="card",
        failure_reason="network_failure",
        retry_count=0,
        timestamp=datetime.utcnow()
    )
    return txn

@pytest.fixture
def dummy_opportunity(dummy_transaction):
    opp = RecoveryOpportunity(
        opportunity_id="opp_1",
        transaction=dummy_transaction
    )
    return opp

def test_missing_opportunity(ai_service, mock_db):
    mock_db.query().filter().first.return_value = None
    with pytest.raises(HTTPException) as exc:
        ai_service.analyze_opportunity("missing_opp", mock_db)
    assert exc.value.status_code == 404

def test_missing_transaction(ai_service, mock_db, dummy_opportunity):
    dummy_opportunity.transaction = None
    mock_db.query().filter().first.return_value = dummy_opportunity
    with pytest.raises(HTTPException) as exc:
        ai_service.analyze_opportunity("opp_1", mock_db)
    assert exc.value.status_code == 404

def test_missing_model(ai_service, mock_db, dummy_opportunity):
    ai_service.model = None
    mock_db.query().filter().first.return_value = dummy_opportunity
    with pytest.raises(HTTPException) as exc:
        ai_service.analyze_opportunity("opp_1", mock_db)
    assert exc.value.status_code == 503

def test_high_probability_transaction(ai_service, mock_db, dummy_opportunity):
    mock_db.query().filter().first.return_value = dummy_opportunity
    decision = ai_service.analyze_opportunity("opp_1", mock_db)
    assert decision["recovery_probability"] == 0.9
    assert decision["recommended_action"] == "RETRY"
    assert decision["risk_band"] == "HIGH"

def test_low_probability_transaction(ai_service, mock_db, dummy_opportunity):
    ai_service.model = DummyModel(0.2)
    mock_db.query().filter().first.return_value = dummy_opportunity
    decision = ai_service.analyze_opportunity("opp_1", mock_db)
    assert decision["recovery_probability"] == 0.2
    assert decision["recommended_action"] == "NO_ACTION"
    assert decision["risk_band"] == "LOW"

def test_insufficient_funds(ai_service, mock_db, dummy_opportunity):
    dummy_opportunity.transaction.failure_reason = "insufficient_funds"
    mock_db.query().filter().first.return_value = dummy_opportunity
    decision = ai_service.analyze_opportunity("opp_1", mock_db)
    # High probability + insufficient funds -> REMINDER
    assert decision["recommended_action"] == "REMINDER"

def test_invalid_card(ai_service, mock_db, dummy_opportunity):
    dummy_opportunity.transaction.failure_reason = "invalid_card"
    mock_db.query().filter().first.return_value = dummy_opportunity
    decision = ai_service.analyze_opportunity("opp_1", mock_db)
    assert decision["recommended_action"] == "PAYMENT_METHOD_UPDATE"

def test_retry_policy_violation(ai_service, mock_db, dummy_opportunity):
    dummy_opportunity.transaction.retry_count = 5
    mock_db.query().filter().first.return_value = dummy_opportunity
    decision = ai_service.analyze_opportunity("opp_1", mock_db)
    assert decision["recommended_action"] == "REMINDER"

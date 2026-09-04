import pytest
from unittest.mock import MagicMock, patch
from app.routes.analytics import get_portfolio_analytics
from app.models.recovery import RecoveryOpportunity
from app.models.transaction import Transaction
from app.models.customer import Customer
from app.models.audit import AuditLog

@patch("app.routes.analytics.ai_service")
def test_portfolio_with_opportunities(mock_ai_service):
    # Setup mock DB opportunities
    opp1 = RecoveryOpportunity(
        opportunity_id="OPP_TEST_1",
        status="PENDING",
        amount_at_risk=1000.0,
        recovery_probability=0.0
    )
    opp1.transaction = Transaction(transaction_id="TXN_1")
    
    opp2 = RecoveryOpportunity(
        opportunity_id="OPP_TEST_2",
        status="IN_PROGRESS",
        amount_at_risk=2000.0,
        recovery_probability=0.0
    )
    opp2.transaction = Transaction(transaction_id="TXN_2")
    
    # Set up mock ai responses
    def mock_analyze(opp_id, db):
        if opp_id == "OPP_TEST_1":
            return {"recovery_probability": 0.5, "recommended_action": "RETRY"}
        return {"recovery_probability": 0.8, "recommended_action": "REMINDER"}
        
    mock_ai_service.analyze_opportunity.side_effect = mock_analyze
    
    mock_db = MagicMock()
    mock_db.query().filter().all.return_value = [opp1, opp2]
    
    data = get_portfolio_analytics(db=mock_db)
    
    assert data["opportunity_count"] == 2
    assert data["total_amount_at_risk"] == 3000.0
    
    # exp_rec = (1000 * 0.5) + (2000 * 0.8) = 500 + 1600 = 2100
    assert data["expected_recovery"] == 2100.0
    assert data["expected_recovery_rate"] == 2100.0 / 3000.0
    
    # priorities: 
    # opp1: 1000 * 0.5 * 1.0 (RETRY) = 500
    # opp2: 2000 * 0.8 * 0.8 (REMINDER) = 1280
    assert data["opportunities"][0]["opportunity_id"] == "OPP_TEST_2"
    assert data["opportunities"][1]["opportunity_id"] == "OPP_TEST_1"

def test_empty_portfolio():
    mock_db = MagicMock()
    mock_db.query().filter().all.return_value = []
    
    data = get_portfolio_analytics(db=mock_db)
    
    assert data["opportunity_count"] == 0
    assert data["total_amount_at_risk"] == 0.0
    assert data["expected_recovery"] == 0.0
    assert data["expected_recovery_rate"] is None
    assert len(data["opportunities"]) == 0

@patch("app.routes.analytics.ai_service")
def test_ai_service_failure_fallback(mock_ai_service):
    opp1 = RecoveryOpportunity(
        opportunity_id="OPP_TEST_3",
        status="PENDING",
        amount_at_risk=1000.0,
        recovery_probability=60.0 # 60% in DB
    )
    opp1.transaction = Transaction(transaction_id="TXN_3")
    
    mock_ai_service.analyze_opportunity.side_effect = Exception("Model down")
    
    mock_db = MagicMock()
    mock_db.query().filter().all.return_value = [opp1]
    
    data = get_portfolio_analytics(db=mock_db)
    
    # Should fallback to DB probability 0.6
    assert data["opportunities"][0]["recovery_probability"] == 0.6
    assert data["expected_recovery"] == 600.0

@patch("app.routes.analytics.ai_service")
def test_invalid_probability_and_zero_amount(mock_ai_service):
    opp1 = RecoveryOpportunity(
        opportunity_id="OPP_TEST_4",
        status="PENDING",
        amount_at_risk=0.0,
        recovery_probability=0.0
    )
    opp2 = RecoveryOpportunity(
        opportunity_id="OPP_TEST_5",
        status="PENDING",
        amount_at_risk=1000.0,
        recovery_probability=0.0
    )
    
    def mock_analyze(opp_id, db):
        if opp_id == "OPP_TEST_4":
            return {"recovery_probability": 0.5}
        return {"recovery_probability": 1.5} # Invalid probability
        
    mock_ai_service.analyze_opportunity.side_effect = mock_analyze
    
    mock_db = MagicMock()
    mock_db.query().filter().all.return_value = [opp1, opp2]
    
    data = get_portfolio_analytics(db=mock_db)
    
    assert data["total_amount_at_risk"] == 1000.0
    assert data["expected_recovery"] == 0.0 # opp4 is 0 amount, opp5 has invalid prob bounded to 0

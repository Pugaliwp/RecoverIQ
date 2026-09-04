import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from app.routes.recovery import record_recovery_outcome
from app.routes.analytics import get_recovery_performance
from app.models.recovery import RecoveryOpportunity, RecoveryAction
from app.models.transaction import Transaction

def test_outcome_approved_to_recovered():
    action = RecoveryAction(id=1, opportunity_id="OPP_1", action_status="APPROVED", action_type="REMINDER")
    transaction = Transaction(transaction_id="TX_1", amount=500.0)
    opp = RecoveryOpportunity(opportunity_id="OPP_1", transaction=transaction)
    
    mock_db = MagicMock()
    # First query for action, second for opp
    mock_db.query().filter().first.side_effect = [action, opp]
    
    with patch("app.services.ai_service.ai_service") as mock_ai:
        mock_ai.analyze_opportunity.return_value = {"recovery_probability": 0.8, "recommended_action": "REMINDER"}
        
        result = record_recovery_outcome(1, {"outcome": "RECOVERED"}, mock_db)
        
        assert result["outcome"] == "RECOVERED"
        assert result["prediction_correct"] is True
        assert result["synthetic"] is True
        assert action.action_status == "COMPLETED"
        assert action.result == "RECOVERED"
        assert action.amount_recovered == 500.0
        assert opp.status == "RECOVERED"
        mock_db.add.assert_called() # audit log
        mock_db.commit.assert_called_once()

def test_outcome_approved_to_not_recovered():
    action = RecoveryAction(id=1, opportunity_id="OPP_1", action_status="APPROVED", action_type="REMINDER")
    transaction = Transaction(transaction_id="TX_1", amount=500.0)
    opp = RecoveryOpportunity(opportunity_id="OPP_1", transaction=transaction)
    
    mock_db = MagicMock()
    mock_db.query().filter().first.side_effect = [action, opp]
    
    with patch("app.services.ai_service.ai_service") as mock_ai:
        mock_ai.analyze_opportunity.return_value = {"recovery_probability": 0.8}
        
        result = record_recovery_outcome(1, {"outcome": "NOT_RECOVERED"}, mock_db)
        
        assert result["outcome"] == "NOT_RECOVERED"
        assert result["prediction_correct"] is False
        assert action.action_status == "COMPLETED"
        assert action.result == "NOT_RECOVERED"
        assert action.amount_recovered == 0.0
        assert opp.status == "FAILED"

def test_outcome_pending_approval_rejected():
    action = RecoveryAction(id=1, action_status="PENDING_APPROVAL")
    mock_db = MagicMock()
    mock_db.query().filter().first.return_value = action
    
    with pytest.raises(HTTPException) as excinfo:
        record_recovery_outcome(1, {"outcome": "RECOVERED"}, mock_db)
    assert excinfo.value.status_code == 400
    assert "cannot record outcome" in excinfo.value.detail

def test_outcome_rejected_action_rejected():
    action = RecoveryAction(id=1, action_status="REJECTED")
    mock_db = MagicMock()
    mock_db.query().filter().first.return_value = action
    
    with pytest.raises(HTTPException) as excinfo:
        record_recovery_outcome(1, {"outcome": "RECOVERED"}, mock_db)
    assert excinfo.value.status_code == 400
    assert "cannot record outcome" in excinfo.value.detail

def test_outcome_completed_duplicate_rejected():
    action = RecoveryAction(id=1, action_status="COMPLETED")
    mock_db = MagicMock()
    mock_db.query().filter().first.return_value = action
    
    with pytest.raises(HTTPException) as excinfo:
        record_recovery_outcome(1, {"outcome": "RECOVERED"}, mock_db)
    assert excinfo.value.status_code == 400
    assert "already recorded" in excinfo.value.detail

def test_invalid_outcome():
    mock_db = MagicMock()
    with pytest.raises(HTTPException) as excinfo:
        record_recovery_outcome(1, {"outcome": "SUCCESS"}, mock_db)
    assert excinfo.value.status_code == 400
    assert "Invalid outcome" in excinfo.value.detail

def test_missing_action():
    mock_db = MagicMock()
    mock_db.query().filter().first.return_value = None
    with pytest.raises(HTTPException) as excinfo:
        record_recovery_outcome(1, {"outcome": "RECOVERED"}, mock_db)
    assert excinfo.value.status_code == 404
    assert "Action not found" in excinfo.value.detail

def test_missing_transaction():
    action = RecoveryAction(id=1, action_status="APPROVED")
    opp = RecoveryOpportunity(opportunity_id="OPP_1", transaction=None)
    mock_db = MagicMock()
    mock_db.query().filter().first.side_effect = [action, opp]
    
    with pytest.raises(HTTPException) as excinfo:
        record_recovery_outcome(1, {"outcome": "RECOVERED"}, mock_db)
    assert excinfo.value.status_code == 404
    assert "transaction not found" in excinfo.value.detail

def test_prediction_correctness():
    action = RecoveryAction(id=1, opportunity_id="OPP_1", action_status="APPROVED", action_type="REMINDER")
    transaction = Transaction(transaction_id="TX_1", amount=500.0)
    opp = RecoveryOpportunity(opportunity_id="OPP_1", transaction=transaction)
    
    mock_db = MagicMock()
    mock_db.query().filter().first.side_effect = [action, opp]
    
    with patch("app.services.ai_service.ai_service") as mock_ai:
        mock_ai.analyze_opportunity.return_value = {"recovery_probability": 0.4}
        result = record_recovery_outcome(1, {"outcome": "NOT_RECOVERED"}, mock_db)
        assert result["prediction_correct"] is True

def test_analytics_empty():
    mock_db = MagicMock()
    mock_db.query().filter().all.return_value = []
    
    result = get_recovery_performance(mock_db)
    
    assert result["total_predictions"] == 0
    assert result["synthetic"] is True
    assert result["brier_score"] == 0.0

def test_analytics_with_data_brier_score_calibration():
    a1 = RecoveryAction(id=1, opportunity_id="OPP_1", result="RECOVERED")
    a2 = RecoveryAction(id=2, opportunity_id="OPP_2", result="NOT_RECOVERED")
    a3 = RecoveryAction(id=3, opportunity_id="OPP_3", result="RECOVERED")
    
    mock_db = MagicMock()
    mock_db.query().filter().all.return_value = [a1, a2, a3]
    
    def mock_analyze(opp_id, db):
        if opp_id == "OPP_1": return {"recovery_probability": 0.9}
        if opp_id == "OPP_2": return {"recovery_probability": 0.1}
        if opp_id == "OPP_3": return {"recovery_probability": 0.6}
        
    with patch("app.routes.analytics.ai_service") as mock_ai:
        mock_ai.analyze_opportunity.side_effect = mock_analyze
        
        res = get_recovery_performance(mock_db)
        
        assert res["total_predictions"] == 3
        assert res["recovered"] == 2
        assert res["prediction_accuracy"] == 1.0 # 0.9->REC(correct), 0.1->NOT_REC(correct), 0.6->REC(correct)
        
        # Brier: (0.9-1)^2 + (0.1-0)^2 + (0.6-1)^2 = 0.01 + 0.01 + 0.16 = 0.18
        # average = 0.18 / 3 = 0.06
        assert abs(res["brier_score"] - 0.06) < 0.001
        
        # Buckets:
        # 80-100% -> OPP_1
        # 0-20% -> OPP_2
        # 40-60% -> OPP_3
        b80 = next(b for b in res["calibration_buckets"] if b["bucket"] == "80-100%")
        assert b80["prediction_count"] == 1
        assert b80["recovered_count"] == 1
        assert b80["observed_recovery_rate"] == 1.0
        
        b0 = next(b for b in res["calibration_buckets"] if b["bucket"] == "0-20%")
        assert b0["prediction_count"] == 1
        assert b0["recovered_count"] == 0
        assert b0["observed_recovery_rate"] == 0.0

def test_no_real_payment_api_invocation():
    # Verify razorpay is not mocked or called.
    # We didn't import razorpay in recovery.py, so this is implicitly verified by code inspection,
    # but we can just add a placeholder test that checks if the string 'razorpay' is in recovery.py
    import os
    recovery_file = os.path.join(os.path.dirname(__file__), '..', 'app', 'routes', 'recovery.py')
    with open(recovery_file, 'r') as f:
        content = f.read()
    assert "razorpay" not in content.lower(), "Safety violation: razorpay API might be invoked"

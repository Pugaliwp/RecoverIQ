import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from app.routes.recovery import create_recovery_action, approve_recovery_action, reject_recovery_action
from app.models.recovery import RecoveryOpportunity, RecoveryAction
from app.models.transaction import Transaction
from app.models.customer import Customer
from app.models.audit import AuditLog

def test_create_action_success():
    opp1 = RecoveryOpportunity(opportunity_id="OPP_1")
    mock_db = MagicMock()
    # First query is for duplicate check (returns None), second is for opportunity (returns opp1)
    mock_db.query().filter().first.side_effect = [None, opp1]
    
    with patch("app.services.ai_service.ai_service") as mock_ai:
        mock_ai.analyze_opportunity.return_value = {"recommended_action": "REMINDER"}
        
        action = create_recovery_action(opportunity_id="OPP_1", db=mock_db)
        
        assert action.action_type == "REMINDER"
        assert action.action_status == "PENDING_APPROVAL"
        assert action.opportunity_id == "OPP_1"
        assert mock_db.add.call_count == 2 # 1 action, 1 audit
        mock_db.commit.assert_called_once()

def test_create_action_duplicate_pending():
    active_action = RecoveryAction(id=1, opportunity_id="OPP_1", action_status="PENDING_APPROVAL")
    mock_db = MagicMock()
    # First query for duplicate check finds the active action
    mock_db.query().filter().first.return_value = active_action
    
    with pytest.raises(HTTPException) as excinfo:
        create_recovery_action(opportunity_id="OPP_1", db=mock_db)
        
    assert excinfo.value.status_code == 409
    assert "active recovery action already exists" in excinfo.value.detail

def test_create_action_duplicate_approved():
    active_action = RecoveryAction(id=1, opportunity_id="OPP_1", action_status="APPROVED")
    mock_db = MagicMock()
    # First query for duplicate check finds the active action
    mock_db.query().filter().first.return_value = active_action
    
    with pytest.raises(HTTPException) as excinfo:
        create_recovery_action(opportunity_id="OPP_1", db=mock_db)
        
    assert excinfo.value.status_code == 409
    assert "active recovery action already exists" in excinfo.value.detail

def test_execute_recovery_legacy_disabled():
    from app.routes.recovery import execute_recovery
    with pytest.raises(HTTPException) as excinfo:
        execute_recovery(opportunity_id="OPP_1", db=MagicMock())
    assert excinfo.value.status_code == 410
    assert "Legacy recovery execution is disabled" in excinfo.value.detail

def test_create_action_policy_blocked():
    opp1 = RecoveryOpportunity(opportunity_id="OPP_1")
    mock_db = MagicMock()
    # First query duplicate check (None), second opportunity (opp1)
    mock_db.query().filter().first.side_effect = [None, opp1]
    
    with patch("app.services.ai_service.ai_service") as mock_ai:
        mock_ai.analyze_opportunity.return_value = {"recommended_action": "NO_ACTION"}
        
        with pytest.raises(HTTPException) as excinfo:
            create_recovery_action(opportunity_id="OPP_1", db=mock_db)
            
        assert excinfo.value.status_code == 400
        assert "blocked by policy" in excinfo.value.detail

def test_approve_action_success():
    action = RecoveryAction(id=1, opportunity_id="OPP_1", action_status="PENDING_APPROVAL", action_type="REMINDER")
    mock_db = MagicMock()
    mock_db.query().filter().first.return_value = action
    
    with patch("app.services.ai_service.ai_service") as mock_ai:
        mock_ai.analyze_opportunity.return_value = {"recommended_action": "REMINDER"}
        
        approved_action = approve_recovery_action(action_id=1, db=mock_db)
        
        assert approved_action.action_status == "APPROVED"
        mock_db.commit.assert_called_once()

def test_approve_action_invalid_state():
    action = RecoveryAction(id=1, opportunity_id="OPP_1", action_status="APPROVED", action_type="REMINDER")
    mock_db = MagicMock()
    mock_db.query().filter().first.return_value = action
    
    with patch("app.services.ai_service.ai_service") as mock_ai:
        mock_ai.analyze_opportunity.return_value = {"recommended_action": "REMINDER"}
        
        with pytest.raises(HTTPException) as excinfo:
            approve_recovery_action(action_id=1, db=mock_db)
            
        assert excinfo.value.status_code == 400
        assert "cannot approve" in excinfo.value.detail

def test_approve_action_policy_recheck_failed():
    action = RecoveryAction(id=1, opportunity_id="OPP_1", action_status="PENDING_APPROVAL", action_type="REMINDER")
    mock_db = MagicMock()
    mock_db.query().filter().first.return_value = action
    
    with patch("app.services.ai_service.ai_service") as mock_ai:
        mock_ai.analyze_opportunity.return_value = {"recommended_action": "NO_ACTION"}
        
        with pytest.raises(HTTPException) as excinfo:
            approve_recovery_action(action_id=1, db=mock_db)
            
        assert excinfo.value.status_code == 400
        assert "no longer compliant" in excinfo.value.detail

def test_reject_action_success():
    action = RecoveryAction(id=1, opportunity_id="OPP_1", action_status="PENDING_APPROVAL", action_type="REMINDER")
    mock_db = MagicMock()
    mock_db.query().filter().first.return_value = action
    
    rejected_action = reject_recovery_action(action_id=1, db=mock_db)
    
    assert rejected_action.action_status == "REJECTED"
    mock_db.commit.assert_called_once()

def test_reject_action_invalid_state():
    action = RecoveryAction(id=1, opportunity_id="OPP_1", action_status="REJECTED", action_type="REMINDER")
    mock_db = MagicMock()
    mock_db.query().filter().first.return_value = action
    
    with pytest.raises(HTTPException) as excinfo:
        reject_recovery_action(action_id=1, db=mock_db)
        
    assert excinfo.value.status_code == 400
    assert "cannot reject" in excinfo.value.detail

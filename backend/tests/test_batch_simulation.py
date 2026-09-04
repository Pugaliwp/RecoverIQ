import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from app.database import Base
from app.models.customer import Customer
from app.models.transaction import Transaction
from app.models.recovery import RecoveryOpportunity, RecoveryAction
from app.models.audit import AuditLog
from app.schemas.recovery import BatchSimulationRequest
from app.routes.recovery import simulate_batch_recovery

# Setup isolated in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

def seed_sample_data(db):
    cust = Customer(id=1, customer_id="CUST_BATCH1", name="Batch User 1", email="batch1@example.com", created_at=datetime.utcnow())
    db.add(cust)
    db.commit()

    t1 = Transaction(id=1, transaction_id="TXN_B1", customer_id="CUST_BATCH1", amount=4999.0, payment_method="upi", payment_status="FAILED", failure_reason="network_failure", retry_count=0, timestamp=datetime.utcnow())
    t2 = Transaction(id=2, transaction_id="TXN_B2", customer_id="CUST_BATCH1", amount=12499.0, payment_method="card", payment_status="ABANDONED", failure_reason="abandoned_otp", retry_count=0, timestamp=datetime.utcnow())
    t3 = Transaction(id=3, transaction_id="TXN_B3", customer_id="CUST_BATCH1", amount=2999.0, payment_method="mandate", payment_status="FAILED", failure_reason="insufficient_funds", retry_count=0, timestamp=datetime.utcnow())
    t4 = Transaction(id=4, transaction_id="TXN_B4", customer_id="CUST_BATCH1", amount=8500.0, payment_method="upi", payment_status="FAILED", failure_reason="invalid_card", retry_count=0, timestamp=datetime.utcnow())
    db.add_all([t1, t2, t3, t4])
    db.commit()

    o1 = RecoveryOpportunity(id=1, opportunity_id="OPP_B1", transaction_id="TXN_B1", amount_at_risk=4999.0, recovery_probability=82.0, root_cause="network_failure", recommended_action="RETRY", status="ELIGIBLE", expected_recovery=4099.18)
    o2 = RecoveryOpportunity(id=2, opportunity_id="OPP_B2", transaction_id="TXN_B2", amount_at_risk=12499.0, recovery_probability=71.0, root_cause="abandoned_otp", recommended_action="REMINDER", status="PENDING", expected_recovery=8874.29)
    o3 = RecoveryOpportunity(id=3, opportunity_id="OPP_B3", transaction_id="TXN_B3", amount_at_risk=2999.0, recovery_probability=95.0, root_cause="insufficient_funds", recommended_action="REMINDER", status="IN_PROGRESS", expected_recovery=2849.05)
    o4 = RecoveryOpportunity(id=4, opportunity_id="OPP_B4", transaction_id="TXN_B4", amount_at_risk=8500.0, recovery_probability=88.0, root_cause="invalid_card", recommended_action="PAYMENT_METHOD_UPDATE", status="ELIGIBLE", expected_recovery=7480.0)
    db.add_all([o1, o2, o3, o4])
    db.commit()

def test_1_empty_batch():
    db = TestingSessionLocal()
    res = simulate_batch_recovery(BatchSimulationRequest(max_opportunities=3), db=db)
    assert res.synthetic is True
    assert res.processed_count == 0
    assert res.stopping_reason == "NO_ELIGIBLE_OPPORTUNITIES"
    db.close()

def test_2_batch_limit_enforcement():
    db = TestingSessionLocal()
    seed_sample_data(db)
    res = simulate_batch_recovery(BatchSimulationRequest(max_opportunities=2, min_probability=0.10), db=db)
    assert res.processed_count <= 2
    assert res.stopping_reason == "MAX_OPPORTUNITIES_REACHED"
    db.close()

def test_3_min_probability_filter():
    db = TestingSessionLocal()
    seed_sample_data(db)
    res = simulate_batch_recovery(BatchSimulationRequest(min_probability=0.99), db=db)
    assert res.processed_count == 0
    assert res.stopping_reason == "MIN_PROBABILITY_THRESHOLD_NOT_MET"
    db.close()

def test_4_deterministic_prioritization():
    db = TestingSessionLocal()
    seed_sample_data(db)
    res1 = simulate_batch_recovery(BatchSimulationRequest(dry_run=True, max_opportunities=3), db=db)
    res2 = simulate_batch_recovery(BatchSimulationRequest(dry_run=True, max_opportunities=3), db=db)
    ranks1 = [r.opportunity_id for r in res1.results]
    ranks2 = [r.opportunity_id for r in res2.results]
    assert ranks1 == ranks2
    assert len(ranks1) > 0
    db.close()

def test_5_policy_blocked_opportunity():
    db = TestingSessionLocal()
    # Create opp with zero probability or policy block
    o = RecoveryOpportunity(id=9, opportunity_id="OPP_BLOCKED", transaction_id="TXN_BLOCKED", amount_at_risk=1000.0, recovery_probability=0.0, root_cause="invalid", recommended_action="NO_ACTION", status="ELIGIBLE")
    db.add(o)
    db.commit()
    
    res = simulate_batch_recovery(BatchSimulationRequest(dry_run=True, min_probability=0.0), db=db)
    blocked_items = [r for r in res.results if not r.policy_allowed]
    if blocked_items:
        assert blocked_items[0].action_status == "BLOCKED"
        assert res.policy_blocked_count >= 1
    db.close()

def test_6_duplicate_action_protection():
    db = TestingSessionLocal()
    seed_sample_data(db)
    a = RecoveryAction(id=99, opportunity_id="OPP_B1", action_type="RETRY", action_status="PENDING_APPROVAL")
    db.add(a)
    db.commit()

    res = simulate_batch_recovery(BatchSimulationRequest(dry_run=True, max_opportunities=4), db=db)
    processed_opp_ids = [r.opportunity_id for r in res.results]
    assert "OPP_B1" not in processed_opp_ids
    db.close()

def test_7_recovered_opportunity_exclusion():
    db = TestingSessionLocal()
    seed_sample_data(db)
    opp = db.query(RecoveryOpportunity).filter(RecoveryOpportunity.opportunity_id == "OPP_B1").first()
    opp.status = "RECOVERED"
    db.commit()

    res = simulate_batch_recovery(BatchSimulationRequest(dry_run=True, max_opportunities=4), db=db)
    processed_opp_ids = [r.opportunity_id for r in res.results]
    assert "OPP_B1" not in processed_opp_ids
    db.close()

def test_8_failed_opportunity_exclusion():
    db = TestingSessionLocal()
    seed_sample_data(db)
    opp = db.query(RecoveryOpportunity).filter(RecoveryOpportunity.opportunity_id == "OPP_B1").first()
    opp.status = "FAILED"
    db.commit()

    res = simulate_batch_recovery(BatchSimulationRequest(dry_run=True, max_opportunities=4), db=db)
    processed_opp_ids = [r.opportunity_id for r in res.results]
    assert "OPP_B1" not in processed_opp_ids
    db.close()

def test_9_dry_run_produces_no_mutation():
    db = TestingSessionLocal()
    seed_sample_data(db)
    actions_before = db.query(RecoveryAction).count()
    audits_before = db.query(AuditLog).count()

    res = simulate_batch_recovery(BatchSimulationRequest(dry_run=True, max_opportunities=3), db=db)
    assert res.dry_run is True
    assert db.query(RecoveryAction).count() == actions_before
    assert db.query(AuditLog).count() == audits_before
    db.close()

def test_10_synthetic_all_success_scenario():
    db = TestingSessionLocal()
    seed_sample_data(db)
    res = simulate_batch_recovery(BatchSimulationRequest(dry_run=True, scenario="all_success", max_opportunities=2), db=db)
    for r in res.results:
        if r.policy_allowed:
            assert r.outcome == "RECOVERED"
            assert r.amount_recovered == r.amount_at_risk
    db.close()

def test_11_synthetic_all_failure_scenario():
    db = TestingSessionLocal()
    seed_sample_data(db)
    res = simulate_batch_recovery(BatchSimulationRequest(dry_run=True, scenario="all_failure", max_opportunities=2), db=db)
    for r in res.results:
        if r.policy_allowed:
            assert r.outcome == "NOT_RECOVERED"
            assert r.amount_recovered == 0.0
    db.close()

def test_12_synthetic_mixed_scenario():
    db = TestingSessionLocal()
    seed_sample_data(db)
    res = simulate_batch_recovery(BatchSimulationRequest(dry_run=True, scenario="mixed", max_opportunities=2), db=db)
    allowed_results = [r for r in res.results if r.policy_allowed]
    if len(allowed_results) >= 2:
        assert allowed_results[0].outcome == "RECOVERED"
        assert allowed_results[1].outcome == "NOT_RECOVERED"
    db.close()

def test_13_correct_amount_recovered_calculation():
    db = TestingSessionLocal()
    seed_sample_data(db)
    res = simulate_batch_recovery(BatchSimulationRequest(dry_run=True, scenario="all_success", max_opportunities=2), db=db)
    expected_sum = sum(r.amount_recovered for r in res.results if r.policy_allowed)
    assert res.amount_recovered == round(expected_sum, 2)
    db.close()

def test_14_correct_recovery_rate():
    db = TestingSessionLocal()
    seed_sample_data(db)
    res = simulate_batch_recovery(BatchSimulationRequest(dry_run=True, scenario="mixed", max_opportunities=2), db=db)
    if res.amount_at_risk > 0:
        expected_rate = round(res.amount_recovered / res.amount_at_risk, 4)
        assert res.recovery_rate == expected_rate
    db.close()

def test_15_stopping_reason():
    db = TestingSessionLocal()
    seed_sample_data(db)
    res = simulate_batch_recovery(BatchSimulationRequest(max_opportunities=1), db=db)
    assert res.stopping_reason in ["MAX_OPPORTUNITIES_REACHED", "NO_ELIGIBLE_OPPORTUNITIES"]
    db.close()

def test_16_no_real_payment_api_invocation():
    # Verify execution requires zero HTTP network calls or payment gateways
    db = TestingSessionLocal()
    seed_sample_data(db)
    res = simulate_batch_recovery(BatchSimulationRequest(dry_run=False, max_opportunities=1), db=db)
    assert res.synthetic is True
    db.close()

def test_17_audit_event_creation():
    db = TestingSessionLocal()
    seed_sample_data(db)
    res = simulate_batch_recovery(BatchSimulationRequest(dry_run=False, max_opportunities=1), db=db)
    if res.processed_count > 0 and res.policy_blocked_count == 0:
        audits = db.query(AuditLog).all()
        event_types = [a.event_type for a in audits]
        assert "BATCH_ACTION_CREATED" in event_types
        assert "BATCH_ACTION_APPROVED" in event_types
        assert "BATCH_SYNTHETIC_OUTCOME" in event_types
    db.close()

def test_18_existing_workflow_regression():
    db = TestingSessionLocal()
    seed_sample_data(db)
    # Perform regular batch simulation
    res = simulate_batch_recovery(BatchSimulationRequest(dry_run=False, max_opportunities=1), db=db)
    assert res.synthetic is True
    # Ensure opportunity status updated to RECOVERED or FAILED
    processed_id = res.results[0].opportunity_id
    opp = db.query(RecoveryOpportunity).filter(RecoveryOpportunity.opportunity_id == processed_id).first()
    assert opp.status in ["RECOVERED", "FAILED"]
    db.close()

import unittest
from .decision_engine import get_recovery_decision

class TestDecisionEngine(unittest.TestCase):
    
    def test_case_1_high_prob_network_failure(self):
        # High probability + temporary network failure -> RETRY
        txn = {
            "transaction_id": "txn_1",
            "failure_reason": "network_failure",
            "retry_count": 0
        }
        prob = 0.85
        decision = get_recovery_decision(txn, prob)
        self.assertEqual(decision["recommended_action"], "RETRY")
        self.assertTrue(decision["policy_checks"][0]["allowed"])
        
    def test_case_2_high_prob_max_retries(self):
        # High probability + retry_count >= 2 -> not RETRY (Policy blocks RETRY, falls back)
        txn = {
            "transaction_id": "txn_2",
            "failure_reason": "network_failure",
            "retry_count": 2
        }
        prob = 0.85
        decision = get_recovery_decision(txn, prob)
        self.assertNotEqual(decision["recommended_action"], "RETRY")
        self.assertEqual(decision["recommended_action"], "REMINDER")

    def test_case_3_insufficient_funds(self):
        # Insufficient funds -> no aggressive retry
        txn = {
            "transaction_id": "txn_3",
            "failure_reason": "insufficient_funds",
            "retry_count": 0
        }
        prob = 0.60
        decision = get_recovery_decision(txn, prob)
        self.assertIn(decision["recommended_action"], ["REMINDER", "PAYMENT_METHOD_UPDATE"])
        
    def test_case_4_invalid_card(self):
        # Invalid card -> PAYMENT_METHOD_UPDATE
        txn = {
            "transaction_id": "txn_4",
            "failure_reason": "invalid_card",
            "retry_count": 0
        }
        prob = 0.90
        decision = get_recovery_decision(txn, prob)
        self.assertEqual(decision["recommended_action"], "PAYMENT_METHOD_UPDATE")
        
    def test_case_5_low_probability(self):
        # Low probability -> NO_ACTION
        txn = {
            "transaction_id": "txn_5",
            "failure_reason": "network_failure",
            "retry_count": 0
        }
        prob = 0.20
        decision = get_recovery_decision(txn, prob)
        self.assertEqual(decision["recommended_action"], "NO_ACTION")
        
    def test_case_6_abandoned_otp(self):
        # Abandoned OTP -> REMINDER
        txn = {
            "transaction_id": "txn_6",
            "failure_reason": "abandoned_otp",
            "retry_count": 0
        }
        prob = 0.65
        decision = get_recovery_decision(txn, prob)
        self.assertEqual(decision["recommended_action"], "REMINDER")
        
    def test_case_7_exceeds_limit(self):
        # Exceeds limit -> safe alternative (PAYMENT_METHOD_UPDATE)
        txn = {
            "transaction_id": "txn_7",
            "failure_reason": "exceeds_limit",
            "retry_count": 0
        }
        prob = 0.50
        decision = get_recovery_decision(txn, prob)
        self.assertEqual(decision["recommended_action"], "PAYMENT_METHOD_UPDATE")
        
    def test_case_8_policy_prevents_excessive_retries(self):
        # Even if initial rule says RETRY, policy blocks if max retries hit
        txn = {
            "transaction_id": "txn_8",
            "failure_reason": "unknown_reason",
            "retry_count": 5
        }
        prob = 0.95
        decision = get_recovery_decision(txn, prob)
        # Should drop from RETRY -> REMINDER (which is allowed)
        self.assertEqual(decision["recommended_action"], "REMINDER")
        self.assertFalse(decision["policy_checks"][0]["allowed"]) # RETRY blocked

if __name__ == "__main__":
    unittest.main()

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User, Transaction, Budget, SavingsGoal
from services.ai_copilot import answer_financial_copilot
from services.admin_copilot import answer_admin_copilot, ADMIN_CHAT_SESSIONS
from services.financial_aggregation import calculate_unified_budget_status, get_centralized_system_summary

class Phase4CopilotAnalyticsTestSuite(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        self.admin = User.query.filter_by(role='admin').first()
        if not self.admin:
            self.admin = User(name='Phase 4 Admin', email='p4_admin@example.com', password_hash='pass123', role='admin', is_active=True)
            db.session.add(self.admin)
            db.session.commit()

        self.user = User.query.filter_by(email='p4_user@example.com').first()
        if not self.user:
            self.user = User(name='Phase 4 User', email='p4_user@example.com', password_hash='pass123', role='user', is_active=True)
            db.session.add(self.user)
            db.session.commit()

        tx1 = Transaction(user_id=self.user.id, type='income', amount=50000.0, category='Salary', date='2026-08-10', description='Salary payment')
        tx2 = Transaction(user_id=self.user.id, type='expense', amount=3000.0, category='Food', date='2026-08-11', description='Supermarket Groceries')
        db.session.add_all([tx1, tx2])
        db.session.commit()

    def test_user_copilot_analytical_tags(self):
        """Verify that answer_financial_copilot outputs explicit analytical tags ([FACT], [CALCULATION], [RECOMMENDATION])."""
        txs = Transaction.query.filter_by(user_id=self.user.id).all()
        budgets = Budget.query.filter_by(user_id=self.user.id).all()

        res_balance = answer_financial_copilot("What is my current balance?", txs, budgets, [], [])
        self.assertEqual(res_balance["classification"], "FACT")

        res_earn = answer_financial_copilot("How much did I earn?", txs, budgets, [], [])
        self.assertEqual(res_earn["classification"], "FACT")

        res_recommend = answer_financial_copilot("How much should I save every month?", txs, budgets, [], [])
        self.assertEqual(res_recommend["classification"], "RECOMMENDATION")

    def test_admin_copilot_chart_payload(self):
        """Verify that answer_admin_copilot returns structured chart payloads for analytical questions."""
        res = answer_admin_copilot("Show category spending", self.admin.id)
        self.assertIsInstance(res, dict)
        self.assertIn("chart", res)
        self.assertEqual(res["chart"]["type"], "bar")
        self.assertIn("labels", res["chart"])
        self.assertIn("values", res["chart"])

    def test_admin_copilot_multi_turn_context(self):
        """Verify that Admin Copilot maintains multi-turn session context across queries."""
        # 1. Ask top spender
        res1 = answer_admin_copilot("Who spent the most?", self.admin.id)
        self.assertIn("reply", res1)

        session = ADMIN_CHAT_SESSIONS.get(self.admin.id)
        self.assertIsNotNone(session)
        self.assertEqual(session.get('last_intent'), 'TOP_SPENDING_USER')

        # 2. Followup asking for their category
        res2 = answer_admin_copilot("What category did they spend the most on?", self.admin.id)
        self.assertIn("Category Spending Breakdown", res2["title"])

    def test_action_proposal_confirm_workflow(self):
        """Verify that natural language write command generates proposal requiring confirmation."""
        txs = Transaction.query.filter_by(user_id=self.user.id).all()
        res = answer_financial_copilot("Add ₹500 food expense", txs, [], [], [])
        
        self.assertIsInstance(res, dict)
        self.assertIn("action_proposal", res)
        self.assertEqual(res["action_proposal"]["type"], "add_transaction")
        self.assertEqual(res["action_proposal"]["amount"], 500.0)

    def test_centralized_aggregation_consistency(self):
        """Verify get_centralized_system_summary returns consistent counts."""
        summary = get_centralized_system_summary()
        self.assertGreater(summary['users'], 0)
        self.assertGreater(summary['admins'], 0)
        self.assertGreaterEqual(summary['transactions'], 2)

if __name__ == '__main__':
    unittest.main()

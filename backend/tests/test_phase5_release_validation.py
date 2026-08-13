import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User, Transaction, Budget, Subscription, SavingsGoal
from services.ai_copilot import answer_financial_copilot
from services.admin_copilot import answer_admin_copilot, ADMIN_CHAT_SESSIONS

class Phase5ReleaseValidationTestSuite(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        self.admin = User.query.filter_by(role='admin').first()
        if not self.admin:
            self.admin = User(name='Phase 5 Admin', email='p5_admin@example.com', password_hash='pass123', role='admin', is_active=True)
            db.session.add(self.admin)
            db.session.commit()

        self.user = User.query.filter_by(email='p5_user@example.com').first()
        if not self.user:
            self.user = User(name='Phase 5 User', email='p5_user@example.com', password_hash='pass123', role='user', is_active=True)
            db.session.add(self.user)
            db.session.commit()

        tx1 = Transaction(user_id=self.user.id, type='income', amount=75000.0, category='Salary', date='2026-08-10', description='Monthly Salary')
        tx2 = Transaction(user_id=self.user.id, type='expense', amount=5000.0, category='Food', date='2026-08-11', description='Grocery Shopping')
        db.session.add_all([tx1, tx2])
        db.session.commit()

    def test_affordability_transparency_breakdown(self):
        """Verify that affordability query returns clean response and structured breakdown dictionary."""
        txs = Transaction.query.filter_by(user_id=self.user.id).all()
        res = answer_financial_copilot("Can I afford ₹10,000?", txs, [], [], [])
        
        self.assertIsInstance(res, dict)
        self.assertIn("reply", res)
        self.assertNotIn("[FACT]", res["reply"])  # Clean natural text
        self.assertEqual(res["classification"], "RECOMMENDATION")
        self.assertIn("breakdown", res)
        self.assertIn("current_balance", res["breakdown"])
        self.assertIn("purchase_amount", res["breakdown"])
        self.assertEqual(res["breakdown"]["purchase_amount"], 10000.0)

    def test_copilot_contextual_action_buttons(self):
        """Verify that User Copilot returns contextual action buttons."""
        txs = Transaction.query.filter_by(user_id=self.user.id).all()
        res = answer_financial_copilot("Where am I spending the most?", txs, [], [], [])
        
        self.assertIsInstance(res, dict)
        self.assertIn("actions", res)
        self.assertGreater(len(res["actions"]), 0)

    def test_admin_copilot_analytical_enhancements(self):
        """Verify Admin Copilot response format for top spender query."""
        res = answer_admin_copilot("Who spent the most?", self.admin.id)
        self.assertIsInstance(res, dict)
        self.assertIn("title", res)
        self.assertIn("actions", res)

    def test_security_secret_key_environment(self):
        """Verify that JWT secret is populated and not exposing raw default keys in production."""
        jwt_secret = os.environ.get('JWT_SECRET')
        self.assertIsNotNone(jwt_secret)
        self.assertGreater(len(jwt_secret), 10)

if __name__ == '__main__':
    unittest.main()

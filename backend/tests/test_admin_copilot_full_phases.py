import os
import sys
import unittest
import jwt
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User, Transaction
from services.admin_copilot import answer_admin_copilot, get_database_health, ADMIN_CHAT_SESSIONS

class FullPhasesAdminCopilotTestSuite(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Admin user
        self.admin = User.query.filter_by(email='phase_admin@example.com').first()
        if not self.admin:
            self.admin = User(name='Phase Admin', email='phase_admin@example.com', password_hash='pass123', role='admin', is_active=True)
            db.session.add(self.admin)

        # Normal User
        self.user = User.query.filter_by(email='phase_user@example.com').first()
        if not self.user:
            self.user = User(name='Phase User', email='phase_user@example.com', password_hash='pass123', role='user', is_active=True)
            db.session.add(self.user)

        db.session.commit()

        # Sample transactions for Phase User
        tx1 = Transaction(user_id=self.user.id, amount=500.0, type='expense', category='Food', description='Lunch', date='2026-08-10')
        tx2 = Transaction(user_id=self.user.id, amount=1200.0, type='expense', category='Shopping', description='Clothes', date='2026-08-11')
        db.session.add_all([tx1, tx2])
        db.session.commit()

        self.admin_token = jwt.encode(
            {'user_id': self.admin.id, 'email': self.admin.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            app.config['SECRET_KEY'], algorithm='HS256'
        )

        self.user_token = jwt.encode(
            {'user_id': self.user.id, 'email': self.user.email, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},
            app.config['SECRET_KEY'], algorithm='HS256'
        )

    def tearDown(self):
        self.app_context.pop()

    def test_phase7_greetings_handling(self):
        res = answer_admin_copilot("hello", self.admin.id)
        self.assertEqual(res['type'], 'greeting')
        self.assertIn("Hello! 👋", res['reply'])

    def test_phase5_last_n_transactions_bug_fix(self):
        res = answer_admin_copilot("show the last 5 transactions", self.admin.id)
        self.assertEqual(res['type'], 'transaction_list')
        self.assertIn('data', res)
        self.assertLessEqual(len(res['data']), 5)

    def test_phase5_last_n_users_bug_fix(self):
        res = answer_admin_copilot("show the last 5 users", self.admin.id)
        self.assertEqual(res['type'], 'user_list')
        self.assertIn('data', res)
        self.assertLessEqual(len(res['data']), 5)

    def test_phase6_multi_turn_pronoun_context(self):
        # Step 1: Who spent the most?
        res1 = answer_admin_copilot("Who spent the most?", self.admin.id)
        self.assertIn("Highest Spending User", res1['reply'])
        top_user_id = ADMIN_CHAT_SESSIONS[self.admin.id]['last_user_id']

        # Step 2: Show his transactions
        res2 = answer_admin_copilot("Show his transactions", self.admin.id)
        self.assertEqual(res2['type'], 'transaction_list')
        self.assertEqual(ADMIN_CHAT_SESSIONS[self.admin.id]['last_user_id'], top_user_id)

    def test_phase27_no_hallucination_user_lookup(self):
        res = answer_admin_copilot("Show the transactions for user XYZ123", self.admin.id)
        self.assertIn("I couldn't find a user matching XYZ123", res['reply'])

    def test_phase27_no_hallucination_tx_lookup(self):
        res = answer_admin_copilot("Show transaction ABC999", self.admin.id)
        self.assertIn("I couldn't find transaction ABC999", res['reply'])

    def test_phase15_real_database_health_latency(self):
        health = get_database_health()
        self.assertEqual(health['status'], 'Healthy')
        self.assertIn('latency_ms', health)
        self.assertGreaterEqual(health['latency_ms'], 0.0)

    def test_phase16_security_unauthorized_access(self):
        res = self.client.post('/api/admin/ai/chat', json={'query': 'Show last 5 transactions'}, headers={'Authorization': f'Bearer {self.user_token}'})
        self.assertEqual(res.status_code, 403)

if __name__ == '__main__':
    unittest.main()

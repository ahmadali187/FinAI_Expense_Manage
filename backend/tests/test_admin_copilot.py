import os
import sys
import unittest
import jwt
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User, Transaction
from services.admin_copilot import answer_admin_copilot, get_admin_stats

class AdminCopilotTestSuite(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        self.admin = User.query.filter_by(email='copilot_admin@example.com').first()
        if not self.admin:
            self.admin = User(name='Copilot Admin', email='copilot_admin@example.com', password_hash='pass123', role='admin', is_active=True)
            db.session.add(self.admin)

        self.user = User.query.filter_by(email='copilot_user@example.com').first()
        if not self.user:
            self.user = User(name='Copilot User', email='copilot_user@example.com', password_hash='pass123', role='user', is_active=True)
            db.session.add(self.user)

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

    def test_admin_stats_tool_layer(self):
        stats = get_admin_stats()
        self.assertIn('users', stats)
        self.assertIn('active_users', stats)
        self.assertIn('admins', stats)
        self.assertIn('transactions', stats)
        self.assertIn('total_income', stats)
        self.assertIn('total_expenses', stats)
        self.assertGreaterEqual(stats['users'], 2)

    def test_answer_admin_copilot_queries(self):
        ans_users = answer_admin_copilot("Total users?")
        reply_users = ans_users['reply'] if isinstance(ans_users, dict) else ans_users
        self.assertIn("Application Users Summary", reply_users)

        ans_admins = answer_admin_copilot("How many admins?")
        reply_admins = ans_admins['reply'] if isinstance(ans_admins, dict) else ans_admins
        self.assertIn("System Administrators", reply_admins)

        ans_txs = answer_admin_copilot("Total transactions?")
        reply_txs = ans_txs['reply'] if isinstance(ans_txs, dict) else ans_txs
        self.assertTrue("Total Financial Overview" in reply_txs or "Total Transactions" in reply_txs)

        ans_health = answer_admin_copilot("Show database health")
        reply_health = ans_health['reply'] if isinstance(ans_health, dict) else ans_health
        self.assertTrue("Database Health" in reply_health or "Database System Status" in reply_health)

    def test_admin_copilot_refuses_personal_finance_questions(self):
        ans_personal = answer_admin_copilot("What is my balance?")
        reply_personal = ans_personal['reply'] if isinstance(ans_personal, dict) else ans_personal
        self.assertIn("That is a personal financial question", reply_personal)

    def test_admin_ai_chat_endpoint_access_control(self):
        # 1. Admin request -> 200 OK
        res = self.client.post('/api/admin/ai/chat', json={'query': 'Total users?'}, headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('reply', data)

        # 2. Normal user request -> 403 Forbidden
        res_user = self.client.post('/api/admin/ai/chat', json={'query': 'Total users?'}, headers={'Authorization': f'Bearer {self.user_token}'})
        self.assertEqual(res_user.status_code, 403)

if __name__ == '__main__':
    unittest.main()

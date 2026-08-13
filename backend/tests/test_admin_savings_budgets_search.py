import os
import sys
import unittest
import jwt
import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ['JWT_SECRET'] = '25388babd2c2f19f79a2767b3f9e34b9e1acc270a8e04f580bb799c9361e0827'

from app import app, db, User, Account, Transaction, SavingsGoal, Budget
from services.admin_copilot import answer_admin_copilot

class AdminSavingsBudgetsSearchTestSuite(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Admin user
        self.admin = User.query.filter_by(email='sb_admin@example.com').first()
        if not self.admin:
            self.admin = User(name='Savings Admin', email='sb_admin@example.com', password_hash='pass123', role='admin', is_active=True)
            db.session.add(self.admin)
        else:
            self.admin.role = 'admin'
            self.admin.is_active = True

        # Normal User
        self.user = User.query.filter_by(email='sb_user@example.com').first()
        if not self.user:
            self.user = User(name='Savings User', email='sb_user@example.com', password_hash='pass123', role='user', is_active=True)
            db.session.add(self.user)

        db.session.commit()

        # Sample SavingsGoal and Budget
        goal = SavingsGoal(user_id=self.user.id, title='Emergency Fund', target_amount=50000.0, current_amount=35000.0, target_date='2026-12-31')
        budget = Budget(user_id=self.user.id, category='Groceries', amount=10000.0, period='monthly')
        tx = Transaction(user_id=self.user.id, amount=2500.0, type='expense', category='Groceries', description='Supermarket', date='2026-08-11')

        db.session.add_all([goal, budget, tx])
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

    def test_admin_list_savings_goals_endpoint(self):
        res = self.client.get('/api/admin/savings-goals', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('savings_goals', data)
        self.assertIn('summary', data)
        self.assertGreaterEqual(data['total'], 1)
        self.assertEqual(data['summary']['total_goals'], len(SavingsGoal.query.all()))

    def test_admin_list_budgets_endpoint(self):
        res = self.client.get('/api/admin/budgets', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('budgets', data)
        self.assertIn('summary', data)
        self.assertGreaterEqual(data['total'], 1)
        # Verify Groceries budget spent calculation
        groceries_b = next((b for b in data['budgets'] if b['category'] == 'Groceries'), None)
        self.assertIsNotNone(groceries_b)
        self.assertGreaterEqual(groceries_b['used_amount'], 2500.0)

    def test_admin_global_search_endpoint(self):
        res = self.client.get('/api/admin/search?q=Groceries', headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('budgets', data)
        self.assertIn('transactions', data)

    def test_admin_copilot_savings_goals_queries(self):
        res_top_saver = answer_admin_copilot("Who saved the most?", self.admin.id)
        self.assertTrue("Top Saving User" in res_top_saver.get('title', '') or "saved" in res_top_saver.get('reply', ''))

        res_goals = answer_admin_copilot("Show savings goals", self.admin.id)
        self.assertIn("Savings Goals Summary", res_goals.get('title', ''))

    def test_unauthorized_access_denied(self):
        res = self.client.get('/api/admin/savings-goals', headers={'Authorization': f'Bearer {self.user_token}'})
        self.assertEqual(res.status_code, 403)

if __name__ == '__main__':
    unittest.main()
